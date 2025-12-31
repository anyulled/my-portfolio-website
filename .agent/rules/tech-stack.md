# Project Instructions & Tech Stack

## Tech Stack Summary

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, Tailwind Merge, CLSX
- **Animation**: Framer Motion, GSAP
- **Database/Backend**: Supabase (SSR, JS Client)
- **State Management**: React Query (implied by usage patterns or libraries), Context API
- **Testing**: Jest, React Testing Library
- **Linting/Formatting**: ESLint, Prettier
- **Package Manager**: **NPM** (Do NOT use Bun or Yarn)

## Agent Instructions

### Package Manager

- **ALWAYS** use `npm` for installing dependencies and running scripts.
- **NEVER** use `bun` or `yarn` to avoid lockfile conflicts and environment mismatches, unless explicitly instructed for a specific one-off task (which is rare).
- The presence of `package-lock.json` indicates `npm` is the source of truth.

### Development Commands

- **Start Dev Server**: `npm run dev` (Runs `next dev --turbopack`)
- **Build**: `npm run build` (Includes `check-i18n` step)
- **Test**: `npm test` (Runs `jest`)
- **Lint**: `npm run lint` (Runs `eslint .`)
- **Prettier**: `npm run prettier`
- **Database Migrations**: `npm run supabase:migrate`

### Project Structure (Brief)

- `src/app`: App Router pages and layouts.
- `src/components`: Reusable UI components.
- `src/lib`: Utility functions and shared logic.
- `src/messages`: Internationalization (i18n) messages.
- `public`: Static assets.

### Workflow Rules

1. **Verification**: Before marking a task as complete, always run `npm run build` and `npm test` to ensure no regressions.
2. **Linting**: Run `npm run lint` before finishing to catch code style issues.
3. **New Dependencies**: Install using `npm install <package>` or `npm install -D <package>`.
