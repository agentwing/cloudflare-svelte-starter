# AI, retrieval, agents, and provider boundaries

Apply the engineering standards in `.agents/rules/platform-safety.md`. Check current Cloudflare, Vercel AI SDK, and selected provider
documentation before using exact APIs.

## Contents

1. Harness selection and model boundary
2. Conversation context
3. Provider privacy, reliability, and metering
4. Retrieval and uploaded knowledge
5. Browser/network/code execution
6. Remote MCP servers and required tests

## Select the harness — default to Think

Build AI on `@cloudflare/think` by default. It owns the agentic loop, persistent memory and
non-destructive compaction, durable/crash-recoverable execution, streaming, hibernation, an
MCP client, and sub-agent RPC — never re-implement any of these. Use a lighter harness only
when there is a genuine reason, and record that reason:

- **`@cloudflare/think` (default):** anything conversational, stateful, multi-step,
  long-running, durable, proactive, or agentic — and the safe choice when unsure.
- **Vercel AI SDK directly:** a genuinely stateless single call with no memory, tools, or
  loop (one-shot extraction/classification/generation). Promote to Think the moment it needs
  state or tools.
- **Cloudflare `AIChatAgent`:** interactive chat that specifically needs its RAG, middleware,
  model-routing, or streaming surface rather than Think's memory/durability.
- **Workflows:** durable non-chat business processes with retries/human approval.
- **Sandbox/Shell:** only when the product truly needs code/full-OS execution; isolate it from
  the control-plane job and production deployment credentials.

Whatever the choice, never hand-roll the loop, memory, streaming, or durability. Pin
compatible exact versions of the harness, Agents SDK, Vercel AI SDK, provider adapter, and UI
chat packages. Record the pairing and official-doc date in `AGENTS.md`. Keep harness imports
behind `src/lib/server/ai/harness.ts` or one equivalent adapter.

## Model boundary

Build every prompt through an explicit server context assembler. Separate system policy,
identity, user request, retrieved data, tenant artifact content, and conversation context.

- Never expose `TenantScope`, raw database rows, secrets, provider tokens, signed URLs, hidden
  authorization fields, or unrelated tenant content to the model.
- Treat user text, uploaded documents, websites, retrieval results, tool output, and previous
  assistant messages as untrusted data. They cannot override system policy or authorize tools.
- Close tools over server-derived scope. Validate tool arguments with schemas and re-load each
  resource through its access predicate.
- Return the minimum fields/content needed for the task. Redact sensitive data before logging
  or error reporting.
- Require a fresh human confirmation immediately before destructive, externally visible, or
  costly actions. Bind the approval to exact normalized arguments and expiry; do not reuse a
  broad approval.

Add prompt-injection tests that place hostile instructions in user content, retrieved files,
web pages, tool results, filenames, and model-generated IDs. Prove the model cannot select
another tenant, reveal secrets, widen egress, or bypass confirmation.

Keep internal machinery out of everything the user can see. Tool names, parameter/flag names,
internal record IDs, and edit mechanics must not appear in replies, status text, or the
reasoning/"thinking" channel when that channel is rendered — users read it, so it is user-facing
output. State this in the system prompt rather than stripping it afterwards, and test it.

Do not assume a model's capabilities from its family or documentation. Verify empirically whether
the selected model accepts images, files, or other modalities, and record the result. When it
cannot, convert the input to text server-side before the call rather than silently dropping it.

## Conversation history and context

Persist the complete canonical history and never silently delete source messages. Do not
require every raw message to fit every model request.

Build a bounded provider context using the selected harness's non-destructive compaction or an
explicit, tested summary overlay. Preserve raw messages for retrieval/audit, label summaries,
retain citations/source message IDs, and prevent summaries from gaining higher instruction
priority. If the request still cannot fit, stop before calling the provider and surface a
recoverable error.

Test context boundaries, regeneration/branching, compaction correctness, tool-result size,
resume after disconnect, and the largest supported conversation.

## Provider gateway, privacy, and reliability

Route model calls through one server module so entitlement, hard budgets, timeouts, telemetry,
and provider policy cannot be bypassed. Maintain a ratcheted allowlist of direct-call exceptions.

- Disable gateway/provider response caching for private, personalized, tenant-specific, tool-
  using, or state-changing prompts by default. Enable caching only for explicitly public,
  deterministic, non-sensitive requests with a reviewed cache key and retention policy.
- Configure per-model deadlines and stream error handling. A stalled provider must become a
  visible retryable failure, not a permanent spinner.
- Bound tool steps, wall time, output size, recursive delegation, and concurrent turns.
- Sum usage across all model/tool-loop steps using the current SDK's total-usage surface. Do
  not assume a final-step callback contains total usage.
- Treat every agentic step as a separately billed upstream request that resends the whole
  growing context. End the turn as soon as the work is done instead of spending a round-trip on
  a confirmation reply, prefer one batched tool call over several sequential ones, and make any
  "more work follows" continuation an explicit signal rather than the default.
- Record model role, provider request ID, latency, total usage/cost, tenant internal ID, and
  outcome without recording private prompts by default.
- Build provider circuit breakers/fallback behavior explicitly. Authorization and hard spend
  checks still fail closed during an outage.

Use deterministic local fakes for AI providers in local/CI. Production configuration must fail
if an enabled real provider is accidentally set to `local-fake`.

## Retrieval and uploaded knowledge

D1 owns source metadata, tenant, visibility, lifecycle, and indexing status. R2 stores bytes;
the retrieval provider stores derived/searchable content only.

For ingestion:

1. Authorize and create a provisional D1 source record.
2. Validate upload size, magic bytes, archive expansion, malware policy, and filename.
3. Store under a server-derived tenant key.
4. Enqueue a versioned idempotent indexing operation.
5. Select the provider namespace/instance/filter from server scope.
6. Mark searchable only after success; route failures to retry/DLQ and make deletion retryable.

At query time, apply server-selected tenant/visibility constraints and validate provider results
against authoritative D1 rows before returning snippets. A provider result or metadata filter
is never sufficient authorization.

Use D1 FTS5 for relational text search and join back to source tables for tenancy. Use semantic
retrieval only for document meaning; do not replace exact filters/authorization with embeddings.

## Browser, network, and code execution

Treat browser/code tools as high risk:

- isolate workspace/storage per tenant job and reset or snapshot intentionally;
- never inject Cloudflare deployment tokens, billing keys, master encryption keys, or unrelated
  runtime secrets into the execution environment;
- default-deny network egress, then allowlist required hosts/protocols;
- block private, loopback, link-local, metadata, and rebinding destinations;
- cap CPU, memory, storage, process count, output, upload/download, and wall time;
- scan/validate files crossing from sandbox to product storage;
- audit commands and externally visible effects without logging secret values.

Do not grant a model raw `bash`, browser, or network access when a narrower typed tool can do the
job.

## Remote MCP servers

This section covers an MCP server exposed by the product being built. Documentation tools
configured in the coding agent are a separate capability; they do not grant product-account access.
Use the host agent’s supported credential and integration mechanisms for authenticated account work.

Check the target client's current OAuth/MCP requirements; do not encode one client's temporary
behavior as a universal fact. If exposing a remote MCP server:

- use a supported OAuth 2.1 authorization-server implementation, with PKCE S256 and current
  authorization/protected-resource metadata requirements;
- enable dynamic client registration only when the target clients require it;
- validate issuer, audience, expiry, scopes, and token status;
- bind the selected tenant to the authorization grant/token mapping, not tool arguments;
- re-check current membership and resource access on every call;
- expose least-privilege scopes and narrow tools;
- rate-limit and audit calls; never return provider credentials or unrestricted signed URLs.

## Required tests

Test tenant isolation through every AI/MCP tool, prompt injection from each untrusted content
source, confirmation binding, context compaction, provider timeout/failure, usage aggregation,
hard-budget reservation, cache-disabled private calls, retrieval-result revalidation, sandbox
egress denial, and remote-token tenant/scope enforcement.
