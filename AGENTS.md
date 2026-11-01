# Cloudflare Svelte starter agent guide

This repository carries its own project instructions in [.agents/](.agents/README.md).
Read [.agents/rules/platform-safety.md](.agents/rules/platform-safety.md) before changing code.
For first setup or adapting the starter to a product brief, also read
[.agents/bootstrap.md](.agents/bootstrap.md). Read the relevant detailed guides listed in
[.agents/README.md](.agents/README.md) before working in their areas.

These instructions apply to this repository and products derived from it. Optional capabilities
are added only when the product brief requires them. The executing agent's host policy controls
shell tools, approvals, credentials, and persistence; project instructions never override it.

The baseline uses SvelteKit, TypeScript, Cloudflare Workers, tenant-scoped D1, Better Auth,
Tailwind CSS, shadcn-svelte, and svelte-i18n. Inspect the manifest and lockfile for current versions.
Use the committed package manager and consult current official documentation before changing APIs.

Local commands (see package.json for the current definitions):

- `pnpm install --frozen-lockfile`
- `pnpm db:migrate:local`
- `pnpm dev` for Vite; `pnpm worker:dev` for the Worker runtime
- `pnpm verify` for generated types, formatting, lint, Svelte checks, unit tests, and build
- `pnpm test:e2e` for browser checks (also required by CI)

The committed Wrangler configuration is a local starter with a placeholder database ID and
localhost auth URL. It is not a configured production environment. Follow the isolation and
release guide before provisioning or publishing; never deploy placeholders or preview bindings
against production. Secrets belong in the host's secret store or ignored local environment files,
never in chat or source control.
