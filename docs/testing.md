# Testing and Verification

Owner: Repository maintainer  
Applies to: Application and harness changes  
Source: Repository quality policy  
Last verified: 2026-09-12  
Review after: 2026-12-12

## Command matrix

| Command                  | Purpose                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| `npm run verify:quick`   | Repository policy, lint, formatting, and types                         |
| `npm run verify`         | Quick checks, unit and contract coverage, hermetic build, OpenAPI lint |
| `npm run verify:full`    | Complete local verification including Playwright                       |
| `npm run verify:preview` | Read-only tests against a deployed preview                             |
| `npm run verify:nightly` | Full verification, mutation tests, and generated documentation         |

## Coverage

New and modified executable statements, branches, functions, and lines require at least 90% coverage. Global coverage cannot decline from the recorded baseline and must ratchet upward until it reaches 90%.

Tests follow Arrange, Act, Assert. Unit tests cover utilities and isolated policies. Property tests cover untrusted input and invariant-heavy transformations. Contract tests compare route behavior with `docs/openapi.yaml`. Playwright covers flows that cross UI, route, and integration boundaries.

Mutation testing starts from the recorded 25% legacy break baseline, reports scores below 60% as low, and treats 80% as the target. Raise the break threshold whenever the measured repository score improves; never lower it to accommodate a regression.

## E2E environments

Local E2E runs a production build with `HARNESS_MODE=fixture`. Fixture mode must not call production Supabase, Redis, Blob, GCS, Meta, or email services and fails closed in Vercel production.

Preview E2E is read-only. It verifies public rendering and authentication boundaries but does not submit forms, resize files, recalculate prices, or send Instagram messages. Real Instagram delivery remains a manual release procedure in `docs/instagram-e2e-test.md`.

## Evidence

CI retains JUnit, coverage, mutation, Playwright traces, screenshots, videos, and structured server output when relevant. A green exit code without the required behavioral evidence is not completion.
