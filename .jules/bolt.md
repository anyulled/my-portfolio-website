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

## 2026-01-27 - [Scroll Performance: Global ScrollTrigger Integration]
**Learning:** Initializing `ScrollTrigger.scrollerProxy` and `Lenis` listeners inside individual hooks (like `useFadeIn`) creates $O(N)$ listeners, causing severe performance degradation during scroll.
**Action:** Centralized the integration in `ScrollContext`. Added `ScrollTrigger.refresh()` after setup to handle race conditions where child components initialize triggers before the proxy is ready.

## 2026-01-27 - [Correctness: GSAP Cleanup]
**Learning:** Using `ScrollTrigger.getAll().forEach(t => t.kill())` in a component's cleanup function destroys ALL scroll triggers on the page, causing broken interactions in other components.
**Action:** Replaced manual cleanup with `useGSAP` hook (from `@gsap/react`), which automatically scopes and cleans up animations/triggers bound to the component. Refactored event listeners to use `contextSafe` for proper context tracking.

## 2026-01-28 - [Performance: Server-Side Request Waterfalls]
**Learning:** Sequential `await` calls for independent data (e.g., gallery and hero images) in Server Components create a request waterfall, increasing server response time by the sum of latencies.
**Action:** Use `Promise.all` to execute independent asynchronous operations concurrently, reducing the total wait time to the duration of the slowest request.

## 2026-01-28 - [LCP Optimization: Hero Image Opacity]
**Learning:** Even with `next/image` and `priority`, wrapping the LCP element (Hero image) in a container with `style={{ opacity: 0 }}` for entrance animations effectively hides it until JavaScript loads and executes. This delays LCP significantly, defeating the purpose of server-side rendering and preloading.
**Action:** Removed `opacity: 0` from the initial styles and the `from` state of the GSAP animation. Retained only the scale animation (which doesn't affect visibility) to ensure the image is painted immediately upon HTML parsing.

## 2026-01-28 - [LCP Optimization: Hidden Container Animation]
**Learning:** Fading in a container element (like a Hero section) from `opacity: 0` implicitly hides all its children, including the LCP candidate (Hero image), even if the children themselves don't have opacity styles. This negates `priority` loading.
**Action:** Removed the container-level fade-in animation. To maintain visual polish without hurting LCP, applied initial `transform: scale(1.1)` inline to the background image wrapper to match the JS animation start state, preventing layout shifts/jumps when JS loads.

## 2026-02-11 - [Performance: GCS Metadata Fetching]
**Learning:** Google Cloud Storage `bucket.getFiles()` fetches the default page size (1000 items) of metadata even when `autoPaginate` is false, unless `maxResults` is explicitly set. This causes significant overhead (large payload parsing and network latency) when only a few items are needed.
**Action:** Always set `maxResults` to a reasonable buffer (e.g., limit + 20) when fetching a subset of files from GCS to minimize payload size and processing time.

## 2026-02-12 - [LCP Optimization: Global CSS Animations]
**Learning:** Applying `animation: fadeIn` globally to `img` tags in `globals.css` forces ALL images, including LCP candidates (like Hero), to start at `opacity: 0` and wait for a scroll-timeline event. This defeats `next/image` optimizations (`priority`) and significantly delays LCP.
**Action:** Removed the global `img` animation rule. Relied on component-level animations (e.g., `useFadeIn`, `Gallery`) which are more controlled and allow excluding critical images from initial hiding.

## 2026-02-13 - [Performance: GSAP React Dependencies]
**Learning:** Using `useGSAP` (v2.1+) without a dependency array (or config object) causes it to run on every render. When combined with `ScrollTrigger.batch`, this creates expensive initialization logic on every re-render (e.g., lightbox open/close), degrading interaction performance.
**Action:** Always provide a configuration object with a `dependencies` array (e.g., `{ dependencies: [data] }`) as the second argument to `useGSAP` if the animation depends on state/props, ensuring it only re-runs when necessary.
