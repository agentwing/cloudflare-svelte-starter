# Data safety and production operations

Apply `.agents/rules/platform-safety.md` and use this detailed operational recipe.

## Contents

1. Migrations and cross-system consistency
2. R2 lifecycle and recovery
3. Backups and restore
4. Transactional email
5. Observability and audit
6. Incidents, rollback, and key rotation

## Migrations and compatibility

Use numbered, forward-only D1 migrations. Prefer expand-migrate-contract:

1. Add the new nullable/defaulted shape and indexes.
2. Deploy/backfill idempotently in bounded batches.
3. Deploy code that reads/writes the new shape while remaining compatible with the old one.
4. Verify production state and observability.
5. Remove the old shape only in a later, separately approved release.

Never drop/rename tables or columns, delete production rows, rewrite large tables, or restore a
database without showing the exact impact and receiving explicit confirmation. D1 migration and
Worker deployment are separate operations; security, authorization, entitlement, and hard-
budget checks fail closed when required state is unavailable. Only optional presentation
features may degrade gracefully.

Use `D1Database.batch()` for related D1 statements that must commit atomically. Inspect affected
row counts and the applied schema. Do not make provider/network calls between statements that
must be atomic.

A remote migration changes real data and requires fresh confirmation for the exact database,
migration set, impact, checks, and recovery plan. Local migrations are safe in-scope verification
and do not require that remote-change confirmation.

Before a remote migration:

- apply it to a clean local database and an upgrade fixture from the previous schema;
- seed and run invariant/security tests;
- inspect tables, indexes, foreign keys, triggers, and constraints with PRAGMAs;
- capture a production Time Travel bookmark and exact recovery command;
- estimate lock/rewrite/downtime risk and document deploy order.

Keep migration parser workarounds version-scoped. If the pinned Wrangler version reproduces the
lowercase trigger parser issue, require uppercase `CREATE TRIGGER ... BEGIN ... END;`, retain a
linked comment, and lint it. Remove cargo-cult workarounds only after reproducing the fix on the
pinned local and remote path.

## Cross-system consistency

D1, R2, Queues, email, Stripe, and other providers do not share a transaction.

- Write a versioned outbox row in the same D1 batch as the authoritative state change.
- Dispatch outbox records idempotently and record attempts/status.
- Give each queue/provider operation a stable idempotency key.
- Consumers claim a unique inbox record, apply the side effect, and mark completion safely.
- Retry transient failures with bounded backoff; send exhausted work to a DLQ and alert.
- Add reconciliation/sweeper jobs for stuck outbox rows, abandoned uploads, stale provider
  mappings, and partially completed deletions.

Do not acknowledge a webhook or user operation as durable until its authoritative state and
future work are safely recorded.

## Concurrent edits and lost updates

Any record two people (or a person and an agent) can edit at once needs explicit concurrency
control. A read-modify-write with no revision check silently destroys the other writer's work.

- Store a monotonic revision/version on the record and require the writer's base revision.
- On a stale base, reject with a distinguishable conflict result, or merge — never overwrite.
- Merge deterministically first: match by stable child IDs and auto-resolve every
  non-overlapping change with no model involvement.
- Use a model only for genuinely overlapping edits, and keep its output reviewable.
- Keep resolution append-only: publish a new version rather than mutating or discarding either
  side, so no committed state is ever lost.
- Detect divergence at submit time, not at render time, and record the base revision that a
  draft/branch was taken from.
- Test simultaneous writers, a stale-base write, and a merge that touches the same field.

## R2 lifecycle and recovery

D1 stores authoritative file ownership, visibility, status, hashes, size, and retention state.
R2 stores bytes and does not protect against intentional/accidental deletion by itself.

- Use provisional upload keys and explicit finalization.
- Soft-delete metadata first and delay physical deletion according to retention policy.
- Use narrowly scoped R2 credentials and bucket/prefix locks where retention justifies them.
- Configure lifecycle rules for abandoned multipart/provisional objects and approved expiry.
- Inventory D1↔R2 consistency and repair/report orphans without guessing ownership.
- Do not claim D1 Time Travel can recover deleted R2 objects.

For permanent user/org deletion, honor the documented legal retention exceptions while removing
all active copies, derived indexes, signed access, provider content, and scheduled work.

## Backups and restore

Create `plan/operations.md` with environment-specific resource names, owners, RPO/RTO,
bookmarks/exports, restore commands, rollback commands, and escalation contacts.

D1 Time Travel is the short-window recovery mechanism. Immediately before destructive work,
capture and record a bookmark outside the database. A restore overwrites in place and cancels
in-flight work, so require a separate explicit confirmation and show the exact target bookmark.
For retention beyond the current Time Travel window, schedule encrypted D1 exports to a
restricted backup location with tested expiry.

Protect R2 separately through delayed deletion, locks, and/or backup copies according to data
value. Rehearse recovery using non-production resources on a schedule and record the evidence;
an untested backup is not a recovery plan.

## Transactional email

Use Resend as the default only when it fits product/domain/deliverability requirements.
Cloudflare Email Sending can send to arbitrary recipients on supported paid plans after domain
onboarding; verified-destination-only behavior applies to limited/free routing scenarios. Check
current plan, domain, quota, suppression, and deliverability documentation before selection.

For either provider:

- verify SPF, DKIM, DMARC, from/reply-to domains, and production ownership;
- send through an idempotent Queue consumer, not in the request handler;
- use stable message keys to avoid duplicate invitations/receipts;
- avoid putting secrets or excessive personal data in email or logs;
- handle bounce, complaint, suppression, and provider webhook events;
- make password reset/verification/invitation tokens single-use, scoped, and expiring;
- use a fake mailbox/provider in CI and require confirmation before real sends.

## Observability and audit

Enable Workers structured logs and tracing with intentional sampling/cost limits. Configure an
alert destination such as Sentry/OTEL and source maps without exposing build tokens at runtime.

Every request/job/provider operation should carry a correlation ID. Log structured event name,
environment, internal tenant ID or privacy-safe hash, operation ID, latency, outcome, retry count,
and provider request ID. Never log cookies, authorization headers, reset/invitation tokens,
secret values, full email bodies, private prompts/documents, payment details, or raw uploads.

Alert on at least:

- elevated 5xx/auth failures and latency;
- webhook inbox age/failure and Queue/DLQ depth;
- migration/deploy/post-deploy smoke failure;
- email bounce/complaint/failure;
- AI/provider timeout, usage, and spend anomalies;
- backup/export/restore-drill failure;
- rate-limit, entitlement, and hard-budget check failures.

Live status surfaces (jobs, runs, imports, notifications) are a recurring and easily invisible
cost: a fixed short interval multiplied by every open tab bills real reads for idle work. Poll
adaptively and back off while nothing changes, stop entirely when the document is hidden or the
work reaches a terminal state, and return deltas rather than resending the whole list or
transcript each tick. Prefer a push/stream where the platform supports it, and memoize expensive
per-response work such as redaction instead of recomputing it on every poll.

Keep an append-only application audit trail for role/membership/access changes, billing changes,
data export/deletion, destructive operations, secret-management actions, impersonation/support
access, and AI-authored mutations. Store privacy-safe before/after metadata, actor, tenant,
operation ID, time, and approval reference; never store secrets.

## Incident and rollback behavior

Before deploy, record the current Worker version and bindings. If the post-deploy gate fails or
tenant/data integrity may be affected:

1. Stop or disable the harmful entry point without destroying evidence.
2. Roll back the Worker when compatible with the current schema; otherwise use the prepared
   feature flag/fix-forward path.
3. Pause affected queues/workflows/providers if continued processing increases harm.
4. Preserve correlated logs/audit records and determine tenant impact.
5. Restore data only after identifying the safe bookmark/export and obtaining confirmation.
6. Verify health and affected invariants, then communicate impact in plain language.
7. Add the regression test and update the runbook.

Never promise that Worker rollback also rolls back D1, R2, Queues, Durable Objects, or provider
state. Design adjacent application versions to tolerate additive schema changes.

## Secrets and key rotation

Maintain a secret inventory containing name, environment, purpose, least-privilege scope, owner,
creation/rotation dates, and dependent components—never the value. Rotate provider/deployment
credentials after exposure, staff/agent access change, or the documented interval.

For envelope encryption, store a key version with every ciphertext, keep old decrypt-only keys
during migration, re-encrypt in a resumable job, verify completion, then retire the old key.
Validate decoded key length/algorithm instead of relying on the textual length of a Base64 value.
