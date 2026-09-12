# Sensuelle Boudoir Barcelona

[![Checkly](https://api.checklyhq.com/v1/badges/checks/8fb0d035-0146-4b64-8826-d01e721d34e6?style=flat&theme=default)](https://app.checklyhq.com)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=anyulled_my-portfolio-website&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=anyulled_my-portfolio-website)
[![AI Harness Scorecard](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fanyulled%2Fmy-portfolio-website%2Fscorecard%2Fscorecard-badge.json)](https://github.com/anyulled/my-portfolio-website/blob/scorecard/scorecard-report.md)

Next.js App Router application for the Sensuelle Boudoir photography website, booking and release workflows, pricing, image delivery, and the operator-only Instagram inbox.

## Prerequisites

- Node.js 24.20.0 is preferred; Node.js 22.9 or newer is supported.
- npm 11.19.1.
- Copy `.env.example` to `.env.local` and populate only the integrations needed for the workflow being exercised.

Never commit an environment file or paste credential values into issues, logs, or pull requests.

## Bootstrap

```bash
npm ci
npm run doctor
```

Start the application with production integrations:

```bash
npm run dev
```

Start it with deterministic local fixtures:

```bash
npm run dev:harness
```

Open <http://localhost:3000>.

## Verification

```bash
npm run verify:quick
npm run verify
npm run verify:full
```

`verify:quick` checks the repository contract, linting, formatting, and types. `verify` adds coverage, a fixture-backed production build, and the OpenAPI contract. `verify:full` also runs browser E2E tests against the production server.

See [Harness Engineering](docs/harness.md) for task state, evidence, handoffs, and CI behavior. See [Testing](docs/testing.md), [Architecture](architecture.md), [Security](SECURITY.md), and the [Vercel runbook](docs/vercel-cli.md) for focused guidance.

## Changes

Work is tracked through GitHub issues. One issue may be active per assignee, and every non-Dependabot pull request must close exactly one active issue. Significant architectural changes use the [RFC process](docs/rfcs/README.md) and durable decisions use `docs/adr`.
