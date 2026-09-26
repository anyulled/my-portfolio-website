# Portfolio feature delivery workflow

Use this workflow for changes to portfolio collections, Drive selection, public portfolio routes, and their administration.

## Establish the right task and checkout

1. Find the active GitHub issue and confirm it owns the acceptance criteria and exclusions for the work.
2. Run `git worktree list` and `git status --short --branch` before editing. Work in the checkout whose branch contains the feature; do not assume the terminal's default checkout is the task checkout.
3. Preserve unrelated changes in every checkout. Do not stage broad globs or move work across branches just to make the current directory convenient.
4. Check the remote issue metadata before opening a PR. The active issue must have its assignee and `state:active` label, and the PR body must close that one issue.

## Keep source, persistence, and publishing boundaries clear

- Treat Google Drive as the source library and navigate folders recursively, including nested subfolders. Keep the configured root folder as the navigation boundary.
- Keep Drive credentials and file IDs on the server. The browser receives only the file details required to browse and select images.
- Preserve the agreed publishing flow: selected images are copied and converted into the existing public GCS bucket; publish collection metadata only after every selected image succeeds. Do not apply database migrations to a live project when the user or repository workflow assigns that step to CI/CD.
- Keep collection management behind the sole-operator authorization boundary and use the existing Supabase repository patterns.

## Complete the public experience

- Implement listing and detail routes for collections, models, and styles from the same published collection data.
- Add localized labels for supported styles without translating user-entered collection names or locations.
- Give every index and detail route a specific title, description, canonical URL, and Open Graph image behavior. Ensure dynamic OG images handle empty and missing records.
- Keep the public routes independent of legacy tagged-photo listings unless the issue explicitly calls for a migration.

## Build in verified verticals

1. Split implementation into independently reviewable slices such as persistence/publishing, administration/Drive selection, and public routes/SEO.
2. Complete and verify each slice before committing it. Use focused tests for authorization, nested Drive navigation, selection order, persistence failures, and public route states.
3. Keep changed-code coverage at or above 90 percent and run the repository-prescribed verification gates. Do not weaken lint, coverage, hooks, or CI to make a slice pass.
4. Before handoff, run `npm run verify:full` and check `git status --short --branch` for unrelated or generated files.

## Publish without losing task context

- Push only the feature branch after its local hooks finish successfully. If a network command fails because the sandbox cannot resolve GitHub, retry through the approved elevated command path instead of interpreting the error as a missing issue or branch.
- For long-running commands, retain the returned session identifier and poll that session until it exits; a partial hook log is not proof that the push completed.
- Open a PR against the repository's main branch with `Closes #<issue-number>`, attach the PR to the task, then inspect the remote checks and automated review. Report pending checks as pending; do not describe the PR as fully verified until all required checks finish successfully.
