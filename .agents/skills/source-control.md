# Source control and GitHub

The private repository is the user's durable, portable source of truth. Establish it early for a
new product, preserve existing history for an established one, and never push to a repository
whose owner, name, privacy, or current contents have not been verified. Once it is verified, keep
it current as the work happens.

## First-time setup

- Do not open by asking for a token. Explain that GitHub is the online home and backup for the
  project's code. Direct a new user to https://github.com/signup, then help them create an empty
  private repository and confirm its exact owner and name.
- Explain that a narrowly scoped token allows repository verification, pushing branches, and
  opening pull requests without sharing a password. It is not the user's password. Direct them
  to store it as `GITHUB_TOKEN` in your execution environment's secret settings, never in chat.
- Continue from the first missing requirement on later turns. Do not repeat account, repository,
  or credential steps already completed in the conversation.
- Verify the authenticated account, repository owner/name, private visibility, default branch,
  permissions, and whether the destination is truly empty before changing it.

## Authentication safety

- Use the configured credential only for the intended GitHub host and repository. Never place its
  value in a remote URL, file, Git config, command text, log, artifact, or source-controlled data.
- Configure a credential helper that reads the credential at execution time, then verify the Git
  configuration contains only the literal variable reference and never the resolved value.
- Treat every authenticated private-repository operation as credentialed, including read-only
  account checks, fetch, pull, clone, API reads, and comparisons.
- If authentication fails, re-check the account, scope, expiry, organization policy, repository
  target, and credential configuration. Never discard local work or rewrite history to solve an
  authentication failure.

## Existing repositories

- Inspect status, remotes, branches, recent history, upstream tracking, and divergence before
  modifying files. Fetch before planning when the repository is connected and current remote
  state matters.
- Preserve unrelated changes. Never force-push, reset hard, clean untracked files, delete an
  unmerged branch, or rewrite shared history without an explicit recovery-aware decision.
- Set commit identity to values confirmed by the user or an appropriate GitHub noreply address.

## Commits and secret scanning

- Group commits by coherent product outcome. Review the complete diff and staged files before
  each commit; do not stage local databases, environment files, credentials, generated secrets,
  test artifacts, or unrelated work.
- Scan staged and untracked content for private keys, provider tokens, database URLs, webhook
  secrets, OAuth credentials, and accidental environment exports. Every push waits on a clean scan.
- If a secret reached Git history, stop, revoke and rotate it, then follow a reviewed history
  repair plan. Merely deleting it in a later commit is insufficient.

## Branch and pull-request workflow

- After the verified baseline exists, make each change on a descriptive branch from the current
  default branch.
- Commit and push each coherent change as you finish it, unprompted. The pushed branch is the
  user's safe record; local-only work is not backed up remotely. Mention the
  branch and what landed on it, and open a pull request once the change is worth reviewing, with
  a concise outcome summary, verification evidence, migrations and configuration by name only,
  preview link when available, known risks, and rollback notes.
- The default branch stays the user's to move. They review and merge; merging for them and
  pushing straight to it are the same act, and both wait for their word — as does anything that
  changes the repository itself: settings, secrets, releases, workflow runs, deletions, and any
  `gh api` call carrying a write method or a field. Read-only operations do not mutate the remote: `gh pr view`,
  `gh repo clone`, `gh run watch`.

## CI and previews

- Keep CI least-privilege and deterministic: pinned actions, frozen dependencies, generated-type
  checks, focused tests, full build, and secret scanning. Pull-request workflows must not receive
  production credentials or mutate production resources.
- A review preview uses isolated non-production resources and requires confirmation before code is
  uploaded to a public URL. Publish it from this environment with `pnpm wrangler versions upload`
  rather than a repository-connected hosting build; a pull request never publishes anything by
  itself. Post the resulting URL on the pull request and label it clearly as a preview. A local
  server is not a user preview.
- Finish with the branch, commits, pull-request URL, checks, preview state, deployment state, and
  the user's next review action.
