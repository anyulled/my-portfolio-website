# Agent Instructions

## 🚨 CRITICAL RULES - NEVER VIOLATE

- **Do not disable ESLint or any linting rules.** They are there for a purpose.
- **Never remove or comment out Git hook commands.** Our goal is to deliver with quality.
- **Never bypass Git hooks** (e.g., using `--no-verify`). We prioritize quality code over delivery speed.
- **NO inline comments, doc comments, or line comments of ANY kind** explaining what the code does.
- **Code MUST be self-documenting** through clear variable and function names.
- **Code comments ONLY explain WHY**, never WHAT. Only write comments explaining why a non-obvious decision was made.

## Project Context & Stack

- **Framework**: Next.js App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management / Data**: React Server Components (RSC), Supabase, Google Cloud Storage
- **Testing**: Jest, Testing Library

## Architectural Constraints

- Follow Next.js App Router conventions (e.g., `page.tsx`, `layout.tsx`, API routes in `app/api`).
- Favor React Server Components for data fetching where appropriate, minimizing client-side JavaScript.
- Maintain clear boundaries between server-side logic and client-side interactivity (`"use client"`).

## Coding Principles

Agents must adhere to the following core principles:

- **SOLID**: Follow Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles.
- **DRY (Don't Repeat Yourself)**: Abstract reusable logic into utilities or hooks.
- **KISS (Keep It Simple, Stupid)**: Avoid over-engineering. Prefer simple, readable solutions over complex ones.
- **YAGNI (You Aren't Gonna Need It)**: Do not add functionality or abstractions until they are actually necessary.
- **Law of Demeter**: Only talk to your immediate friends, not strangers. A method should only call methods on: itself, its parameters, objects it creates, or its direct properties. Avoid chaining (e.g., `object.getA().getB().getC()`).
- **Tell, Don't Ask**: Tell objects what to do rather than asking them for data and making decisions. Push behavior into the object that owns the data.
- **Boy Scout Rule**: Always leave the code better than you found it.

## Testing Requirements

- **Coverage**: Ensure at least **90%** test coverage for any new or modified code.
- **Types of Tests**: Write Unit Tests for utilities and hooks, and Integration/E2E tests for complex user flows.
- **AAA Pattern**: Always follow the AAA (Arrange, Act, Assert) pattern:
  - **Arrange**: Set up the preconditions and inputs.
  - **Act**: Execute the function under test.
  - **Assert**: Verify the expected outcomes occurred.

## General Guidelines

- **Modern Syntax**: Prefer modern ECMAScript syntax with immutability where possible (e.g., `const`, spread operators, `map`/`filter`/`reduce`).
- **TypeScript First**: Strive to eliminate the `"any"` type completely. Use proper interface/type definitions for clarity and type safety.
- **Completion Checks**: Before declaring a task is done, you MUST:
  1. Check that the project builds successfully (`npm run build`).
  2. Verify all tests pass (`npm run test`).
  3. Resolve all linting or formatting errors (`npm run lint`).
  4. Fix any SonarQube findings.
- **Documentation**: Always check the `/workflows` or `/skills` reference documentation if you're uncertain about a particular architectural approach or implementation detail.
