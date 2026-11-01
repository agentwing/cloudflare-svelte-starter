# Project instructions

These guides were moved from AgentWing's website/app starter pack so the repository can be used
independently by any coding agent. No AgentWing template, integration, secret, or attached Skill is
required. Read the files directly; do not look for an AgentWing `useSkill` tool.

Always read [engineering standards](rules/platform-safety.md). Load only the additional guides
relevant to the current task:

| Task                                                                     | Guide                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------ |
| First setup or adapting the baseline                                     | [Project setup](bootstrap.md)                    |
| Authentication, organizations, permissions, tenancy                      | [Tenancy and auth](skills/tenant-auth.md)        |
| Schema, migrations, consistency, storage, email, observability, recovery | [Data and operations](skills/data-operations.md) |
| Tests, CI, previews, deployment, rollback                                | [Test and release](skills/test-release.md)       |
| Git, repository ownership, branches, pull requests                       | [Source control](skills/source-control.md)       |
| Selected billing capability                                              | [Stripe billing](skills/billing-stripe.md)       |
| Selected AI, agents, retrieval, MCP capability                           | [Cloudflare AI](skills/ai-cloudflare.md)         |

The guides are project procedures and standards, not authorization to add unrelated features or
perform external actions. Honor the current request and the host agent's approval rules. Read and
update these files as the product evolves rather than maintaining a second copy elsewhere.

For current APIs, use available first-party documentation tools, then Context7, then official web
documentation. Optional public documentation MCP endpoints (configure in your agent only if useful):

- Cloudflare: https://docs.mcp.cloudflare.com/mcp
- Svelte: https://mcp.svelte.dev/mcp
- Better Auth: https://mcp.better-auth.com/mcp
- Context7: https://mcp.context7.com/mcp
- Cloudflare Agents SDK: https://agents.cloudflare.com/mcp

They provide documentation, not cloud-account authorization. If an endpoint requires authentication
or is unavailable, use official web documentation; do not block project work on installing it.
