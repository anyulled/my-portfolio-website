# Contributing

## Task contract

Start from a GitHub harness-task issue with observable acceptance criteria, explicit scope exclusions, risks, and required verification. Move it to `state:active` before implementation and keep work in one focused branch or worktree.

Do not mix incidental refactors into the task. Record new architecture decisions in an ADR or RFC rather than an issue comment alone.

## Development contract

Use Node.js 24.20.0 and npm 11.19.1. Install with `npm ci`, copy `.env.example` to `.env.local`, and run `npm run doctor` before changing code.

Follow `AGENTS.md`. Do not disable lint rules, bypass Git hooks, expose credentials, or weaken a failing quality gate.

## Verification contract

Use `npm run verify:quick` during development and `npm run verify:full` before handoff. Every failure must be resolved at its source or recorded as a blocker with evidence.

Pull requests must include links to verification artifacts and show how every acceptance criterion was proven. Required checks determine whether an issue may move to `state:passing`; the author does not declare completion independently.

## Handoff contract

Leave the working tree free of generated output and update the issue with the commit, completed acceptance criteria, verification results, unresolved blockers, decisions, and one next action.
