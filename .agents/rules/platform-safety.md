# Website and app engineering standards

These are standing standards for products built from this repository. Apply only
the sections relevant to the product and current request. Optional capabilities are not
requirements: do not add accounts, organizations, billing, AI, uploads, email, or collaboration
unless the product brief needs them.

## Product scope

- Implement the user's current request as the smallest coherent product change. Do not continue
  into unrelated roadmap work merely because it is documented or appears useful.
- Inspect the existing product before changing it, preserve unrelated work, and remove an older
  direction only when repository evidence shows it is superseded.
- Ask only for product decisions that cannot be discovered or inferred safely.

## Platform baseline

- Build on SvelteKit with TypeScript on Cloudflare Workers. Use D1 for authoritative relational
  state, R2 for files and blobs, Queues for asynchronous delivery, Durable Objects only for
  stateful coordination, Better Auth for authentication and organizations, Stripe when billing
  is selected, and Cloudflare Think for durable agentic AI.
- Do not introduce a second authoritative database, authentication system, tenancy model, billing
  authority, or deployment platform. External providers may be integrations, not competing
  sources of truth.
- Verify current official documentation before changing framework, SDK, CLI, or provider setup.

## Security and tenancy

- When accounts and shared tenant data exist, use Better Auth organizations as the canonical
  tenant. Add workspace scope only when the product has a real workspace concept, then carry the
  complete organization and workspace scope through every record, query, relationship, and test.
- Derive identity and tenant scope only at trusted server boundaries. Never trust client, route,
  model, webhook, retrieved-text, or raw queue identifiers as authority.
- Every read and write of tenant-owned data must bind the complete scope and apply resource
  visibility. A role check, assignment label, foreign key, or client filter is not object access.
- Authorize both sides of access grants and cross-resource links. Return the same generic
  not-found response for inaccessible and nonexistent cross-tenant resources.
- Treat uploads, web pages, retrieved content, tool output, and model output as untrusted data.
  Keep models behind narrow tenant-bound tools and never expose raw provider credentials.

## Data and asynchronous work

- D1 owns permissions, lifecycle, product state, and audit. R2, search indexes, caches, and
  provider state are blobs or derived state, never authorization authorities.
- Prevent lost updates with explicit revisions or stable version ancestry. Preserve committed
  history and resolve concurrent edits without destroying either version.
- Use additive schema changes. Plan destructive changes with impact, compatibility order,
  recovery, and verified backups.
- Make related D1 writes atomic. Across D1, R2, Queues, email, Stripe, and model providers, use
  durable operation records, idempotency, retries, reconciliation, and explicit failed states.
- Keep account deletion separate from organization deletion and preserve last-owner invariants.

## Cost, privacy, and product quality

- Authenticate, authorize, check entitlement, reserve bounded cost, dispatch, settle actual usage,
  and reconcile ambiguity at one admission boundary for every billable provider action.
- Store no secret values in chat, prompts, source files, commits, logs, screenshots, fixtures,
  browser storage, or artifacts. Use least-privilege, environment-specific credentials.
- Keep AI-generated, human-written, and human-reviewed content distinguishable where it affects
  trust. Sanitize rendered rich text and model output.
- Meet WCAG 2.2 AA and route user-visible strings through internationalization. Cover loading,
  empty, error, permission-denied, retry, keyboard, reflow, and reduced-motion states.

## Verification and release

- Add real tests for behavior changes, with cross-tenant and same-tenant-negative cases whenever
  authorization or a relationship changes.
- During implementation use the narrowest relevant checks. Before handoff, run the project's
  complete gate once and report anything omitted or failed truthfully.
- Keep development, preview, staging, and production resources isolated. A preview must never
  point at production data or credentials.
- Deliver changes for human review through a branch and pull request. Never merge on the user's
  behalf. Production, destructive, costly, or outward-facing actions require a fresh explicit
  confirmation for the exact target and effect.
- Finish with the product outcome, verification evidence, external/deployment state, remaining
  risk, and one clear next action.
