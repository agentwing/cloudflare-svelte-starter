# Billing, webhooks, and entitlement

Apply `.agents/rules/platform-safety.md` and verify current Stripe SDK/API and Cloudflare Workers runtime
documentation before implementing exact calls.

## Contents

1. Product decisions and local billing model
2. Checkout and portal
3. Webhook ingress and idempotency
4. Fulfillment and reconciliation
5. Usage, credits, and spend
6. Required tests and live-mode approval

## Product decisions first

Record currency, prices, billing interval, trial behavior, cancellation timing, grace/past-due
policy, refunds, taxes, seat definition, usage limits, and who may manage billing. Use Stripe
test mode in development/staging and separate live-mode products, prices, keys, webhooks, and
customers in production.

Keep product/price IDs in a single server configuration module. Never accept a price,
product, amount, currency, customer, subscription, success URL, or cancellation URL from the
browser without matching it to a server allowlist.

## Local billing model

D1 is the application entitlement authority. Map one internal organization to stored Stripe
customer/subscription identifiers and an explicit local snapshot containing at least:

- configured product/price and billing model;
- subscription status and relevant period/trial/cancel timestamps;
- last reconciliation time and provider object ID;
- computed effective entitlement/limits;
- exemption/test flags with an audited reason.

Define `effectivePlan(snapshot, now)` as a pure, tested function. Write the complete status
matrix for `trialing`, `active`, `past_due`, `unpaid`, `paused`, `canceled`, incomplete states,
and cancellation-at-period-end. Do not gate on a raw `plan` string and do not call Stripe on
every product request. Missing/corrupt entitlement or hard-budget state fails closed.

Put paid-feature and hard-usage checks in shared services used by every entry point: UI/API,
MCP, AI tools, uploads, schedules, queues, and admin paths. A route-only gate is insufficient.
Re-check entitlement inside the async consumer too, not only at enqueue: work can be queued
while entitled and run after downgrade, or the reverse.

When a gate skips deferred work (indexing, embedding, generation, notification), record the skip
with a distinguishable reason rather than a generic failure, and run an idempotent **backfill on
upgrade**: when an entitled plan lands, re-enqueue the work that was skipped while unentitled.
Without this, the user pays and still sees nothing. Test that the backfill is idempotent and
scoped to the upgrading tenant.

## Checkout and portal

Create Checkout and Customer Portal sessions server-side after authenticating the organization
and billing role. Use exact environment-specific return URL allowlists. Reuse the stored Stripe
customer; make session creation idempotent for retryable user actions when duplicate sessions
would be harmful.

Attach a non-authoritative internal correlation identifier to server-created provider metadata,
but resolve the tenant through the stored provider mapping during webhook processing. Metadata
alone is not proof of tenant identity.

## Webhook ingress

Implement the public route at a clear path such as
`src/routes/api/webhooks/stripe/+server.ts`:

1. Read the raw body exactly once.
2. Require the `Stripe-Signature` header.
3. Verify with the environment's webhook secret using the Stripe SDK's Workers/Web Crypto-
   compatible asynchronous API.
4. Reject before enqueueing if verification fails.
5. Allow only required event types and validate expected mode/account/API-version policy.
6. Insert the provider event into a D1 webhook inbox with `UNIQUE(provider, event_id)` and
   durably enqueue its internal operation in the same acceptance flow.
7. Return `2xx` only after durable acceptance. Return an error when persistence/enqueue fails
   so Stripe retries.

Do not parse a reconstructed JSON body for signature verification. Do not defer signature
verification to the Queue consumer.

Stripe delivery is duplicated and unordered. Cloudflare Queues is at-least-once and unordered.
The consumer therefore must:

- claim the inbox operation idempotently;
- treat an already-completed event as success;
- map the provider customer/subscription/object to one organization from D1;
- validate `livemode`, product/price, currency, amount, and expected object relationship;
- apply the business transition and mark the inbox record complete atomically when possible;
- retry transient errors and send exhausted failures to a DLQ with an alert.

Use the Stripe event ID for redelivery deduplication. Where Stripe may produce separate Event
objects for the same logical update, also use `(event.type, data.object.id)` or the business
fulfillment key appropriate to that event.

## Fulfillment and subscription reconciliation

For one-time purchases, grant exactly once using a unique business key such as Checkout
Session, Payment Intent, Invoice, or Charge ID selected for the product's payment flow. Validate
the expected amount/currency/product before granting.

Do not use `event.created` as a universal per-resource high-water mark. It is an event timestamp,
not a resource revision, and multiple related/unordered events can describe one subscription.
When subscription ordering matters, retrieve/reconcile the current Stripe Subscription and
write one local snapshot. Make reconciliation safe to repeat and add a scheduled repair job for
stale or failed webhook state.

Pin the Stripe API version intentionally and record it. Handle only the event types the product
needs; unhandled valid types return success after recording/ignoring rather than creating an
infinite retry.

## Usage, credits, and spend

Route every billable provider call through one admission function. Before dispatch it must:

1. authenticate and authorize the caller;
2. compute the effective entitlement;
3. atomically reserve the worst-case hard budget/credits;
4. reject when the reservation would overdraft;
5. dispatch with an idempotency/correlation ID;
6. settle actual usage and release unused reservation;
7. record provider-reported usage and cost for reconciliation.

Hard financial limits fail closed. A best-effort burst rate limiter may degrade only where the
documented maximum exposure remains bounded. Never let failure of a usage store create
unlimited paid calls.

Meter precisely; billing bugs are silent and compound:

- Keep the ledger append-only in integer minor units and derive balance by summing entries.
  Enforce idempotency with a database unique key on `(tenant, reason, reference)`, not
  application logic alone.
- An unpriced or unrecognized model/operation MUST fail closed. Never bill it as zero.
- Read the provider's usage fields exactly: components such as cached or reasoning tokens may be
  a _subset_ of another reported total. Charging both the total and the component double-bills.
  Assert the arithmetic against a real provider response in tests.
- Write the usage record and the ledger entry in the same D1 batch, and record the pricing
  version with each entry so historical charges stay explainable after a price change.
- Never expose internal unit cost, margin, or provider burn-rate to the client. Show the user
  only the units they purchased and consumed.
- Cap the loss from a single in-flight operation: let a running unit finish, clamp the debit to
  the available balance so the ledger cannot go negative, and block the _next_ dispatch below a
  documented floor.

Do not prescribe a per-seat cap unless the product actually charges per seat. Derive tenant
and user limits from the recorded unit economics and make them configurable with safe maximums.

## Required tests

Add deterministic tests for:

- invalid/missing signature and mutated raw body;
- test-mode event at live endpoint and wrong Stripe account;
- duplicate event delivery and two distinct equivalent events;
- reversed subscription event order and same-second events;
- wrong product, price, amount, currency, customer, or cross-tenant provider mapping;
- queue retry after partial failure and DLQ exhaustion;
- one-time grant exactly once;
- every subscription status/trial/cancellation transition;
- missing/corrupt entitlement and budget state failing closed;
- direct API/MCP/queue entry points unable to bypass entitlement;
- checkout/portal role checks and return URL allowlists;
- scheduled reconciliation repairing a missed webhook.

Never use live payment methods or production objects in CI. Before enabling live payments,
show the configured products/prices, webhook endpoint, event allowlist, entitlement matrix,
refund/tax assumptions, test evidence, rollback/disable switch, and request explicit approval.
