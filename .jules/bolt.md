## 2026-01-27 - [LCP Optimization: Server-Side Random Selection]
**Learning:** Client-side random content selection (e.g., hero images) forces `mounted` checks to avoid hydration mismatches, delaying the rendering of critical content (LCP) until after JavaScript execution.
**Action:** Move random selection logic to Server Components and pass the selected content as props to Client Components. This allows the server to send the initial HTML with the hero image immediately, enabling the browser to discover and preload the resource significantly earlier.

## 2026-01-27 - [LCP Optimization: Enable SSR for Theme-Dependent Components]
**Learning:** Components using `next-themes` often block rendering with `if (!mounted) return null` to avoid hydration mismatches, which prevents SSR and hurts LCP.
**Action:** Remove the blocking check and instead conditionally render only the theme-dependent UI (e.g., icons) using the `mounted` state. This allows the rest of the component (structure, links) to be server-rendered and visible immediately.
