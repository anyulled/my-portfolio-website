# Vercel CLI runbook

This document contains the project-specific rules for managing the `boudoir-barcelona` Vercel project. It documents commands and behaviors verified with Vercel CLI 59.16.0. It must never contain environment variable values, access tokens, private keys, or other credentials.

## Project and authentication

Run commands from the repository root, where `.vercel/project.json` links this checkout to the `boudoir-barcelona` project. Do not assume that the repository name is the Vercel project name.

Confirm the account before changing project state:

```bash
npx --yes vercel whoami
npx --yes vercel env ls --json
```

The linked project is `boudoir-barcelona` in the `anyulleds-projects` scope. If `.vercel/project.json` is missing or points to another project, stop and link the intended project explicitly before running environment or deployment commands.

## Environment variables

Vercel scopes variables independently to `production`, `preview`, and `development`. The environment is a positional argument:

```bash
npx --yes vercel env add VARIABLE_NAME production
npx --yes vercel env update VARIABLE_NAME production
npx --yes vercel env rm VARIABLE_NAME preview
```

Use `--yes` for non-interactive execution. With this CLI version, `vercel env update VARIABLE_NAME --yes` is not reliable for a non-interactive update; specify each target explicitly and preserve the existing target scope.

Use `vercel env ls --json` when a script needs to inspect variables. Read only metadata such as `key`, `target`, `visibility`, and `type`; never print `value` or decrypted data. Avoid the human-readable `vercel env ls` output in logs because Config values may be displayed.

### Safe synchronization from `.env.local`

`.env.local` is a local secret store and is not a deployment artifact. A synchronization process must:

1. Parse the file in memory and use variable names only for diagnostics.
2. Exclude `VERCEL_OIDC_TOKEN`, which is a local Vercel credential rather than an application setting.
3. Update an existing variable only in the environments where it already exists, unless the desired scope has been explicitly approved.
4. Add missing variables to explicitly selected environments.
5. Send values through stdin rather than command-line arguments or logs.
6. Preserve whether an existing variable is Config or Sensitive.

For existing Config variables, pass `--type config`. For existing Sensitive variables, pass `--sensitive` or the equivalent supported secret type. This is important for values that look like credentials and for `NEXT_PUBLIC_*` variables: public variables must remain Config only when exposing them to browsers is intentional.

### Application secret classification

The `boudoir-barcelona` project stores these application credentials as Sensitive in every Vercel environment:

| Variable       | Development | Preview   | Production |
| -------------- | ----------- | --------- | ---------- |
| `CRON_SECRET`  | Sensitive   | Sensitive | Sensitive  |
| `GROQ_API_KEY` | Sensitive   | Sensitive | Sensitive  |

The classification is independent from the variable value and environment scope. Verify it from sanitized JSON metadata:

```bash
npx --yes vercel env ls --json
```

When synchronizing either credential from `.env.local`, send the value through stdin and preserve the target explicitly:

```bash
printf '%s\n' "$CRON_SECRET_VALUE" | npx --yes vercel env update CRON_SECRET production --sensitive --yes
printf '%s\n' "$GROQ_API_KEY_VALUE" | npx --yes vercel env update GROQ_API_KEY development --sensitive --yes
```

Never print the value or include it in `--value`, shell arguments, logs, commits, or pull requests.

Examples that do not expose the value in the command line:

```bash
printf '%s\n' "$APP_VALUE" | npx --yes vercel env update APP_SETTING production --type config --yes
printf '%s\n' "$SECRET_VALUE" | npx --yes vercel env update APP_SECRET production --sensitive --yes
```

Do not use `vercel env pull` over an existing `.env.local` without first deciding whether overwriting the local file is intended. Use a separate destination for inspection when appropriate.

## Deployment workflow

Changing a Vercel environment variable does not rebuild an existing deployment. After production variables change, deploy a known-good commit from `main`.

First inspect the deployment list and confirm that the selected deployment has `target: production`, `meta.githubCommitRef: main`, and the expected commit:

```bash
npx --yes vercel ls boudoir-barcelona --json
```

To rebuild that deployment with the current production environment variables:

```bash
npx --yes vercel redeploy DEPLOYMENT_URL --target production
```

Wait for the result to be `Ready` and verify that the production alias is assigned. Do not run `npx --yes vercel --prod` from a feature branch when the requested source is `main`; that command deploys the current working tree.

Use these commands according to the intended workflow:

```bash
npx --yes vercel deploy
npx --yes vercel --prod
npx --yes vercel build --prod
npx --yes vercel deploy --prebuilt --prod
```

Use `--prebuilt` only after a successful `vercel build`; otherwise the build output is not used as intended. For preview deployments protected by Vercel, use `vercel curl` instead of disabling deployment protection:

```bash
npx --yes vercel curl / --deployment PREVIEW_URL
```

## Troubleshooting and safety

- Check `vercel whoami` and `.vercel/project.json` before diagnosing a project or team mismatch.
- Treat a missing variable and a variable with the wrong environment scope as separate problems.
- Do not copy local-only credentials into Vercel automatically.
- Do not print `.env.local`, `vercel env pull` output, or CLI output containing Config values.
- Do not put secrets in shell arguments, committed files, pull requests, or deployment summaries.
- If a command reports an API or type error, inspect the sanitized JSON metadata and the command help before retrying.
- Keep production redeploys tied to a verified `main` deployment rather than the current checkout.
