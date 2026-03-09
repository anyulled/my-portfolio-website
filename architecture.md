# Project Architecture

This document outlines the high-level architecture of this Next.js project, focusing on the boundaries between the different directories and when to use them.

## Directory Structure

### `src/lib/` (The Utilities & Core Helpers Layer)

The `lib` folder is designated for **pure functions, helpers, and configurations** that do not inherently carry state, side effects, or heavy business logic.

**What goes here:**

- Data transformers (e.g., `photoMapper.ts`, `sanitizer.ts`)
- Client wrappers and third-party initializers (e.g., `gcp/storage-client.ts`, `mixpanelClient.ts`)
- Helper functions (e.g., `cn.ts` for Tailwind classes, `extractName.ts`, `pricing.ts`)
- Shared constants or configuration constants (e.g., `openGraph.ts`)

**When to use it:**

- When you need a reusable, pure function that can be tested in isolation.
- When configuring a third-party client (like GCP Storage or Mixpanel) that will be imported by services.

### `src/services/` (The Business Logic layer)

The `services` folder contains the **core business logic and integrations** of the application. This is where data is fetched, mutated, cached, or sent to external APIs. Code here should remain agnostic of the UI framework (React) and focus purely on data movement and logic.

**What goes here:**

- Database interactions (e.g., `database.ts`)
- External API calls or integrations (e.g., `mailer.ts`, `photos/`, `storage/`)
- Caching logic (e.g., `cache.ts`, `redis.ts`)
- Inter-process communication or localized context services (e.g., `ipc.ts`, `locale.ts`)

**When to use it:**

- When reading from or writing to a database.
- When communicating with external APIs.
- When implementing caching mechanisms.
- Generally, this folder should be used by Next.js API Routes, Server Actions, or Server Components.

### `src/hooks/` (The React State & Lifecycle Layer)

The `hooks` folder contains custom **React Hooks**. These are strongly tied to the React ecosystem and run strictly on the client (or within Client Components).

**What goes here:**

- Reusable stateful logic (e.g., `use-toast.ts` for managing UI notifications).
- Lifecycle and DOM interaction logic (e.g., `useFadeIn.tsx` for animation observing).
- Analytics tracking tied to UI events (e.g., `eventTracker.ts`).

**When to use it:**

- When you need to tap into React's state management (`useState`, `useReducer`).
- When you need to interact with the component lifecycle (`useEffect`).
- When interacting with the DOM (Refs, window events) inside a `'use client'` component.

## Module Dependencies & Constraints

To maintain a clean architecture, we enforce strict dependency boundaries between modules. **The following rules dictate which modules must NOT depend on each other:**

1. **`src/lib/` (Core Utilities)**
   - **MUST NOT** depend on `src/services/` (Business Logic).
   - **MUST NOT** depend on `src/hooks/` (React State).
   - **MUST NOT** depend on `src/app/` or `src/components/` (UI layer).
   - _Rationale_: Utilities must remain pure, isolated, and framework-agnostic.

2. **`src/hooks/` (Client React State)**
   - **MUST NOT** depend on `src/services/` (Server-side Business Logic).
   - _Rationale_: Hooks run on the client, whereas services are strictly for the server environment (e.g., database, secret APIs). Mixing them causes build errors or security leaks.

3. **`src/services/` (Server Business Logic)**
   - **MUST NOT** depend on `src/hooks/` (React State).
   - **MUST NOT** depend on `src/components/` or `src/app/` (UI layer).
   - _Rationale_: Business logic must remain decoupled from the presentation layer.

4. **`src/components/` (Shared UI Components)**
   - **MUST NOT** depend on `src/app/` (Next.js Application Routing layer).
   - _Rationale_: Components should be reusable across different routes. Tying them to specific app route logic reduces their reusability.
