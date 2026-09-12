# Harness Engineering

Owner: Repository maintainer  
Applies to: All repository work  
Source: Walking Labs Harness Engineering course  
Last verified: 2026-09-12  
Review after: 2026-12-12

## System of record

Repository files hold durable product, architecture, environment, and verification knowledge. GitHub issues and their comments are the only task-state store. Do not create parallel progress or feature-list files.

## Session initialization

1. Read `AGENTS.md`, the active issue, and the focused documents it links.
2. Confirm the issue contains observable acceptance criteria, scope exclusions, risks, and verification requirements.
3. Run `npm ci` after dependency changes or a fresh clone.
4. Run `npm run doctor` and establish a passing `npm run verify:quick` checkpoint.
5. Confirm the working tree and base branch before editing.

## Task state

Each issue has exactly one state label:

- `state:not-started`: accepted but no implementation has begun.
- `state:active`: the assignee's single work-in-progress task.
- `state:blocked`: progress requires a documented decision or external change.
- `state:passing`: required checks prove every acceptance criterion.

Automation controls the transition to `state:passing`. A non-Dependabot pull request closes exactly one active issue.

## Verification levels

- Static: harness policy, lint, formatting, types, architecture, and secret checks.
- Runtime: unit, property, contract, coverage, mutation, and fixture-backed production build.
- System: local Playwright E2E and read-only preview E2E.

Failures state what failed, why it matters, and how to reproduce or fix it. CI artifacts retain the evidence used to accept or reject the change.

## Session handoff

Update the active issue with:

- Current commit and branch.
- Acceptance criteria completed and their evidence.
- Commands run and artifact links.
- Remaining failure or blocker.
- Decisions made during the session.
- One next action.

Run the appropriate verification command and confirm no unexpected tracked files or generated artifacts remain.

## Automation loops

Every recurring workflow defines a trigger, verification target, timeout, retry bound, and stop condition. Dependabot may auto-merge patch and minor changes only after all required checks pass. Major dependency updates and all other work require maintainer merge.

Nightly failures update one issue per failing subsystem and stop after bounded retries. A later successful run closes the corresponding issue.

## Graph eligibility

Keep one active issue and a fixed CI dependency graph until at least three conditions apply:

- Work has independent parallel units.
- The solution requires meaningful branching or backtracking.
- Every node has checkpointable state.
- Every node has unambiguous acceptance evidence.
- Collaboration benefit exceeds coordination cost.

Worktrees isolate concurrent changes but do not weaken task ownership or acceptance rules.
