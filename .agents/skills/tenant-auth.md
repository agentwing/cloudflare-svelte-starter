# Tenancy and authentication boundary

Apply `.agents/rules/platform-safety.md` and use this detailed recipe for tenant/auth implementation.

## Contents

1. Canonical tenant and schema
2. Trusted scope constructors
3. Authorization contract
4. Self-auditing tests
5. Non-D1 storage and asynchronous boundaries
6. Better Auth requirements
7. Account and organization deletion
8. Web security baseline

## 1. Canonical tenant and schema

Use a Better Auth organization as the canonical tenant. Represent a solo user with a
one-member personal organization. Do not mix user-owned and organization-owned records.

Choose workspace cardinality before the first product migration:

- If the product does not need multiple workspaces per organization, omit `workspace_id`.
- If it does, make `(organization_id, workspace_id)` a required part of `TenantScope`, every
  tenant-owned row, unique constraint, relationship, query, storage key, and test fixture.

For every tenant-owned table:

- make tenant columns `NOT NULL`;
- bind them in every read and write;
- make natural uniqueness tenant-scoped, such as
  `UNIQUE (organization_id, normalized_name)`;
- use composite relationships such as
  `FOREIGN KEY (organization_id, project_id) REFERENCES project(organization_id, id)` where
  they prevent cross-tenant links;
- index the tenant prefix used by access queries;
- inspect the applied schema with `PRAGMA foreign_key_list` and `PRAGMA index_list` in tests.

D1 foreign keys are a consistency backstop, never the authorization boundary. D1 enables
them by default but supported PRAGMAs and migration operations can affect enforcement. SQLite
also restricts which constraints can be introduced with `ALTER TABLE`; verify the resulting
schema rather than assuming the migration text achieved the intended constraint.

## 2. Trusted scope constructors

Define an opaque `TenantScope` in `src/lib/server/auth/scope.ts`. Keep its runtime constructor
module-private and expose only audited trust-boundary functions:

- `scopeFromSession(event)` — load the Better Auth session, active organization, current
  membership/role, and workspace membership if applicable.
- `scopeFromQueueMessage(message)` — validate a versioned server-produced envelope, then
  re-load the tenant and any referenced resource before work.
- `scopeFromProviderMapping(providerRef)` — after signature/authentication, map a stored
  provider customer/subscription/resource ID to an internal organization. Never accept the
  tenant only from webhook metadata.
- `systemScope(operation)` — allow only named maintenance operations and record them in the
  audit log. Never expose this constructor to routes, models, or general services.

Never construct scope from a client body, query string, route parameter, model tool argument,
retrieved document, raw queue field, or arbitrary webhook field. A TypeScript brand does not
survive malicious casts; add a lint/AST rule that forbids `as TenantScope`, direct constructor
imports, and plain-object scope literals outside `scope.ts`.

Re-check membership for protected requests and sensitive long-running work. If Better Auth
session cookie caching is enabled, do not treat cached session membership as immediate
revocation. A removed member must lose access without waiting for a new login.

An authenticated session with no valid active organization fails closed on protected APIs
and mutations. Maintain a small explicit allowlist for onboarding actions: list/join/create an
organization, accept a valid invitation, set an active organization, and sign out.

## 3. Authorization contract

Every ID-addressed operation must enforce tenant and resource visibility either through a
checked access load or in the same fully scoped SQL statement.

Classify each public service/SDK/tool method as one of:

- **access-control:** grants/removes access, creates cross-resource relationships, changes
  membership/roles, shares resources, or reads a resource subject to more than tenant-wide
  visibility. Load and authorize the source, validate the target belongs to the same scope,
  then reject unauthorized/not-found cases with one generic message.
- **scoped-write:** mutates a resource using all tenant and visibility predicates in the
  write. Inspect `meta.changes`; when exactly one row is expected, map zero rows to the same
  generic not-found response unless idempotent no-op is an explicit API contract.
- **read:** returns only rows matching tenant plus visibility predicates and returns
  empty/null for an inaccessible resource without revealing existence.
- **system/pure:** no user tenant data, with a written justification.

Never execute `UPDATE/DELETE ... WHERE id = ?` for tenant data. `requireRole` proves only an
organization role; it does not prove access to a particular resource. Assignment labels do
not grant permission.

For a relationship, membership, assignment, move, or share:

1. Authorize the source resource.
2. Load the target by the same tenant scope.
3. Validate any project/workspace boundary.
4. Perform the scoped mutation and require the expected affected-row count.
5. Append an audit event in the same D1 batch when practical.

Route handlers derive the caller and invoke services; they do not call repositories directly.
Services own authorization, entitlement, and orchestration. Repositories own prepared,
tenant-scoped D1 operations. Models and clients never receive raw rows or a scope object.

## 4. Self-auditing tests

Build a ratchet under `src/lib/server/security/` or the equivalent project path. Prefer these
files unless the existing repository has an established equivalent:

- `tenant-surface-policy.ts` — classifies every route, service/SDK/tool, and repository export.
- `tenant-isolation.test.ts` — generates cross-tenant behavioral cases from that policy.
- `sql-scope-lint.test.ts` — rejects direct D1 access and structurally unsafe tenant SQL.
- `../db/tenant-tables.ts` — lists every tenant-owned table and its required scope columns.

The ratchet MUST:

1. Enumerate route, service/SDK/tool, and repository surfaces from disk.
2. Fail when a new exported method lacks a policy classification or required isolation case.
3. Fail when a stale policy entry references a removed method.
4. Treat any added or changed repository function, raw SQL statement, D1 query, or search query
   touching a tenant-owned table as requiring updated isolation coverage in the same change.
5. Require every tenant query to bind `organization_id` and, when workspaces exist,
   `workspace_id`, directly or through a verified tenant-scoped join.
6. Forbid direct D1 access outside registered repository modules. Allow an exception only for an
   explicitly classified system operation with a documented justification and dedicated test.
7. Require a cross-tenant proof for every method category:
   - access-control rejects with the generic response;
   - read returns no victim data;
   - scoped-write reports no success and leaves the victim row byte-for-byte unchanged.
8. Give the attacker an admin role in their own organization so role checks alone cannot make
   the test pass.
9. Test same-organization but unauthorized visibility separately from cross-organization
   isolation.

Do not rely on a source-text search for `requireUser` or `scope`: a comment or dead branch can
satisfy it. Use TypeScript AST analysis for forbidden imports/construction and parse static SQL
to inspect table references, aliases, joins, and scope predicates; a regex that merely finds
`organization_id` is not proof of scoping. Static analysis supplements rather than replaces the
generated black-box tests. Treat routes as protected by default and keep the public allowlist
small: auth endpoints, login/onboarding, health, and verified webhooks.

Join FTS5 to the authoritative source table and repeat tenant/visibility predicates. Never
trust an FTS virtual table, cache key, search-provider filter, or model-supplied ID as access
control.

## 5. Non-D1 storage and asynchronous boundaries

### R2

- Derive opaque object keys server-side from verified scope and resource identity.
- Never accept an arbitrary R2 key from a client or model.
- Authorize against D1 before get, signed URL creation, copy, or delete.
- Keep signed URLs short-lived and purpose-specific.
- Upload to a provisional key, validate size/type/magic bytes, commit D1 metadata, then
  finalize. Sweep abandoned provisional objects idempotently.

### Durable Objects

Derive the object ID/name from verified tenant plus entity identity. Do not route directly to
an attacker-provided object name. Re-check authorization at the Worker boundary before RPC.

### Queues, schedules, and workflows

Use versioned, schema-validated envelopes produced only after server authorization. Include a
unique message/operation ID. Consumers are at-least-once: use an inbox unique key, make every
side effect idempotent, re-load referenced resources, and route exhausted retries to a DLQ.

### AI Search, retrieval, AI tools, and MCP

Choose provider namespace/instance/filter from server scope. Treat retrieved content as
untrusted data, not instructions. Close tools over the verified scope; never let a tool or
remote MCP caller choose another organization by argument. Re-check membership per remote MCP
call and derive tenant identity from the verified authorization grant/token mapping.

## 6. Better Auth requirements

Check the current Better Auth and SvelteKit integration before implementation. At minimum:

- use the organization plugin as the membership/role backbone;
- mount the supported SvelteKit handler and populate `event.locals` server-side;
- keep `trustedOrigins` narrow and environment-specific;
- use secure, HTTP-only cookies and correct proxy/canonical URL configuration;
- require verified email before accepting sensitive invitations;
- configure `revokeSessionsOnPasswordReset: true`;
- rate-limit sign-up, sign-in, password reset, verification, invitation, and account deletion;
- use server-side Turnstile verification when enabled;
- fail production configuration if required auth/email/Turnstile keys are missing.

Prefer local fixtures that use real Better Auth. If a bypass is unavoidable, place it in a
local-only module excluded from the production import graph. Prove the production bundle has
no bypass marker/route and that the route returns `404`; a runtime `APP_ENV` comparison alone
does not compile it out.

Test last-owner removal, invitation reuse/expiry/wrong-email acceptance, session revocation,
active-organization switching, org-less sessions, CSRF/trusted origins, and cross-org admins.

## 7. Account and organization deletion

Treat account deletion and organization deletion as separate confirmed workflows.

Before deleting an account:

1. Require recent reauthentication; use Better Auth's supported password/fresh-session and
   optional email verification flow.
2. Block while the user is the last owner of any organization. Require ownership transfer or
   a separately confirmed organization deletion.
3. Produce/export data if the retention policy promises it.
4. Run application cleanup and auth deletion as an idempotent workflow.
5. Revoke sessions/tokens and write a privacy-safe audit result.

Do not globally reassign authorship to one cross-tenant "deleted user". Prefer nullable actor
IDs with a retained privacy-safe label, or a tenant-local system principal. Preserve only the
minimum audit/billing records required by the documented retention policy.

Organization deletion must enumerate D1 rows, R2 objects, search indexes, Durable Objects,
scheduled work, provider mappings, and retained audit/billing exceptions. Show the impact and
recovery/retention behavior before requesting confirmation.

## 8. Web security baseline

- Validate all client, webhook, queue, model, and retrieved shapes at the edge.
- Use prepared statements; never interpolate SQL identifiers/values from untrusted input.
- Apply CSP and standard security headers; sanitize rendered rich text/model output. A structured
  content schema MUST degrade an unknown or invalid node individually — never let one
  unrecognized node blank or reject the user's whole document. Test round-tripping content that
  contains a node type the current allowlist does not know.
- Protect custom cookie-authenticated state-changing routes against CSRF and restrict CORS.
- Allowlist redirect/callback origins and reject open redirects.
- Defend URL imports/browser tools against SSRF: block private/link-local/metadata addresses,
  restrict protocols, bound redirects/response size/time, and re-resolve DNS safely.
- Validate upload size, declared type, magic bytes, filenames, archive expansion, and malware
  policy before indexing or serving active content.
- Require human confirmation immediately before destructive or externally visible AI tool
  actions and audit the approved operation.
