# Testing, environments, and release

Use the smallest useful checks while iterating and one complete gate before handoff or release.
Never claim a check ran when it was unavailable, skipped, timed out, or failed.

## Cloudflare access

- Introduce Cloudflare as the service that hosts the running application and provides preview and
  deployment links before discussing credentials. Direct a first-time user to
  https://dash.cloudflare.com/sign-up.
- Explain where to find the Account ID and how to create a least-privilege Workers API token. For
  the starter product, the token needs Workers editing plus the D1 permission required by its
  migrations; expand permissions only for selected capabilities.
- Store the values under `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in your execution
  environment's secret settings. Never request or reproduce their values in chat.
- Verify the token and account with a read-only account check. Credential verification grants
  capability, not approval to create resources, publish a preview, migrate, or deploy.

## Environment isolation

- Development, preview, staging, and production use separate D1 databases, R2 buckets, Durable
  Objects, Queues, domains, OAuth clients, payment modes, email senders, provider resources, and
  credentials. A preview or staging hostname must never point at production data.
- Keep production custom-domain only. Disable public workers.dev and preview hostnames in the
  production configuration unless the product explicitly defines a separately isolated surface.
- Production fails closed when required auth, entitlement, provider, abuse, or hard-budget state is
  missing. Development fakes and bypasses must be impossible to enable in production.

## Verification layers

- Unit-test pure domain logic, parsing, validation, prompt/context assembly, and deterministic
  transformations.
- Test repositories and services against real applied D1 migrations, including tenant scope,
  inaccessible same-tenant objects, cross-tenant objects, relationships, affected-row checks,
  concurrency, and rollback behavior.
- Test route and protocol boundaries with authenticated, unauthenticated, unauthorized, malformed,
  duplicate, replayed, and cross-origin cases.
- Test Queues, Workflows, webhooks, and provider callbacks for duplicates, reordering, retries,
  stale data, partial failure, reconciliation, and exhausted work.
- Exercise critical browser flows at desktop and mobile sizes, covering loading, empty, error,
  forbidden, retry, keyboard, focus, reflow, reduced motion, and accessibility announcements.
- Prefer behavioral tests over regex assertions. Use source/AST ratchets only where they protect a
  boundary that runtime tests cannot observe directly.

## CI

- CI uses the committed package manager and lockfile, installs deterministically, regenerates types
  where applicable, checks formatting/lint/types, runs focused and integration tests, builds the
  Worker, and scans for secrets.
- Pin third-party actions to reviewed immutable versions and grant the least permissions required.
  Pull requests from untrusted forks receive no deployment or production credentials.
- CI and local handoff commands must match. Do not weaken the gate, alter baselines, delete
  assertions, or use no-verify to make a failing change appear releasable.

## Finding what is already deployed

- Inventory before concluding. Before saying a site, Worker, or Pages project is missing,
  undeployed, or needs a first deployment, list what the configured Cloudflare account already
  has: Workers, Pages projects, their deployments and preview versions, and routes and custom
  domains. Search for related names, not only an exact match; an earlier deployment often uses a
  different or older name. Never infer absence from one exact-name lookup.
- Open any plausible existing URL when you can, and report what it actually serves.
- A preview is not production. A working workers.dev or preview URL does not prove a production
  domain is attached, and a missing custom domain does not prove nothing is deployed.
- If a listing call fails, or the token cannot read a resource type such as Pages, say exactly
  what you checked and what you could not, instead of concluding the resource does not exist.
- Before any deployment, identify the intended production Worker or Pages project and compare it
  with the repository's Wrangler configuration. If the target is uncertain, do not create a new
  Worker or project and do not move live traffic; show what you found and ask.

## Preview and deployment

- Previews and deployments are performed from this environment with the project's own pinned
  Wrangler through the package manager, never by a hosting-side build connected to the repository.
  Do not connect the repository to Cloudflare builds and do not describe merging or pushing as
  something that publishes the product by itself.
- Publish preview versions only. `pnpm wrangler versions upload` uploads a reviewable version
  without shifting production traffic; report the preview URL it prints. Confirm it as described
  below; it is the only publish to perform on your own initiative.
- When a significant change is complete and its checks pass — a new feature, a visible redesign,
  a fix the user has been waiting on — ask whether they would like a preview to look at, rather
  than waiting to be asked or uploading one unprompted. Routine internal steps do not need the
  offer.
- Never deploy to production unless the user explicitly asks for that deployment. Finished work,
  passing checks, an approved preview, an approved pull request, or an earlier general wish to
  ship are not that request. When the product is ready, say what a deployment would do and stop.
- Once the user asks, release with `pnpm wrangler deploy` (or `pnpm wrangler versions deploy` for
  a staged rollout) and apply remote migrations with
  `pnpm wrangler d1 migrations apply <database> --remote`. Run each against the intended
  environment or configuration explicitly.
- A local server is only an internal verification fixture. For user review, create a public preview
  only after showing its isolated target, data/resources, checks, visibility, expiry, and rollback.
- Before staging or production, record the exact target, current Worker version, D1 recovery
  bookmark, resource/config changes, migrations, checks, expected impact, and recovery plan.
- Apply remote migrations and deployments as separate confirmed operations in compatibility order.
  Never infer approval for production from approval for code, a preview, a push, or staging.
- Verify immediately after release: readiness, auth, tenant isolation, primary writes, async work,
  logs, error rates, and selected product flows. Roll back or disable promptly when tenant or data
  integrity may be affected.

## Handoff

Report the product outcome, files or migrations changed, exact checks and results, pull request and
preview state, deployment state, configuration names without values, remaining risk, recovery
position, and one next action. The user reviews and merges; never merge for them.
