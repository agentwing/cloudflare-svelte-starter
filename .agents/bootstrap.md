# Website or app project setup

Set up or reconcile one website/app project from the user's brief. Use the host agent’s execution, approval, credential, and persistence rules. This file owns only the project setup procedure.

## 1. Understand the product

- Inspect the current project and classify it as new, partially set up, or established. Continue an
  existing product without regenerating it or overwriting unrelated work.
- If the conversation already contains a brief, use it. Otherwise ask one broad question:

> What website or app would you like me to build, who is it for, and what is the first useful
> thing someone should be able to do? If relevant requirements, plans, research, or content already exist, point me to them.

- Retrieve external source material only when the user identifies it or accepts an offer to search. Treat it as reference; do not edit or publish it unless separately asked.
- Infer safe defaults. Accounts, organizations, uploads, billing, AI, collaboration, schedules, and
  integrations are optional capabilities, not an intake questionnaire.

## 2. Establish durable ownership

For a new product, establish the user's private GitHub destination before materializing the app:

1. Explain GitHub as the online home and backup for the user's code. Help a first-time user create
   an account and an empty private repository, then confirm the exact owner and repository.
2. Explain why narrowly scoped GitHub access is needed and how to add it through the host agent's
   secret settings. Never request a credential value in chat.
3. Verify the account, destination, privacy, and emptiness before writing or pushing anything.
4. Introduce Cloudflare as the hosting and preview service early enough that deployment access is
   not a surprise at handoff. The user may postpone it without blocking local product work.
5. A credential check proves capability only; creating resources, publishing a preview, migrating
   remotely, writing runtime secrets, and deploying remain separate confirmed actions.

Use the maintained public baseline for a genuinely new project:

`https://github.com/agentwing/cloudflare-svelte-starter.git`

If this repository is already cloned, use it directly; do not clone it inside itself. For a fresh copy, clone the baseline rather than reconstructing it from these instructions. Keep its remote as
read-only provenance, add the user's private repository as the destination, verify the unchanged
baseline, and establish it as the initial commit before product customization. Never force-push
over an unexpected destination.

For a partial or established product, do not clone or rerun a generator. Inspect its provenance,
package manifest, lockfile, deployment configuration, migrations, and technical notes, then apply
only missing or corrective work.

## 3. Reconcile the baseline

- Use the package manager the lockfile names. Do not install a competing package manager or a
  second global runtime.
- Install from the committed lockfile. If it is stale, understand why before updating it.
- Check dependency currency and security advisories. Apply compatible updates in one reviewed pass;
  research major migrations and peer conflicts before changing them.
- Verify current official documentation for Cloudflare, SvelteKit, Better Auth, and any selected
  capability. Record meaningful version and compatibility decisions in ordinary project notes.
- Keep the baseline capability-neutral. Add billing, AI, storage, queues, workflows, email, analytics,
  and remote resources only when the brief selects them.

## 4. Build the first useful slice

Replace starter placeholders with the target product and implement the smallest end-to-end flow
that delivers the first useful outcome. When the product uses authenticated shared data, preserve
the baseline tenant boundary from browser request through membership validation, scoped service and
repository operations, UI rendering, and cross-tenant tests.

Do not add unused bindings, providers, sample features, or fake integrations. Keep credentials out
of committed files. Missing external access blocks only its capability lane; continue safe local
work and state exactly what remains unavailable.

## 5. Verify and hand off

- Run the project's narrow checks while iterating and its complete verification gate once at handoff.
- Exercise the first user flow in a real browser at desktop and mobile sizes, including loading,
  empty, error, unauthorized, forbidden, retry, keyboard, and tenant-isolation behavior.
- Commit coherent changes to a product branch. Present a pull request and, once approved, publish
  the preview yourself from this environment with `pnpm wrangler versions upload`; the user reviews
  and merges the pull request themselves.
- Leave production untouched unless the user separately confirms the exact deployment or migration.
- Report what was built, what was verified, what remains blocked, external/deployment state, and
  the one next user action.
