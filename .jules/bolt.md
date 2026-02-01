## 2026-01-27 - [LCP Optimization: Server-Side Random Selection]
**Learning:** Client-side random content selection (e.g., hero images) forces `mounted` checks to avoid hydration mismatches, delaying the rendering of critical content (LCP) until after JavaScript execution.
**Action:** Move random selection logic to Server Components and pass the selected content as props to Client Components. This allows the server to send the initial HTML with the hero image immediately, enabling the browser to discover and preload the resource significantly earlier.

## 2026-01-27 - [LCP Optimization: Enable SSR for Theme-Dependent Components]
**Learning:** Components using `next-themes` often block rendering with `if (!mounted) return null` to avoid hydration mismatches, which prevents SSR and hurts LCP.
**Action:** Remove the blocking check and instead conditionally render only the theme-dependent UI (e.g., icons) using the `mounted` state. This allows the rest of the component (structure, links) to be server-rendered and visible immediately.

## 2026-01-27 - [LCP Optimization: Hero Background Image]
**Learning:** CSS `background-image` is hidden from the browser's preload scanner and lacks automatic optimization (resizing, format conversion), hurting LCP. `next/image` addresses this but supports only basic positioning.
**Action:** Replaced `background-image` in Hero with `next/image` using `fill` and `priority`. Accepted the trade-off of removing `background-attachment: fixed` (parallax) in favor of significant LCP and bandwidth improvements.

## 2026-01-27 - [Performance: React Context Re-renders]
**Learning:** Storing rapidly changing values (like scroll position) in React Context triggers re-renders for all consumers on every update (e.g., every scroll frame). This creates massive performance overhead.
**Action:** Removed `scrollY` from `ScrollContext`. Components needing scroll position should use local event listeners or specialized subscriptions (like `lenis.on`) to update their own local state only when necessary (e.g., crossing a threshold), avoiding global re-renders.

## 2026-01-27 - [Performance: Hook Stability & Re-renders]
**Learning:** Custom hooks (like `useAnalyticsEventTracker`) that return unstable function references cause consuming components (like `NavBar`) to re-render unnecessarily, defeating `React.memo` optimizations on children.
**Action:** Wrapped the returned function in `useAnalyticsEventTracker` with `useCallback`. This stabilized the reference, enabling effective use of `React.memo` in `NavLinks` and preventing re-renders on every parent update (e.g., scroll threshold changes).
