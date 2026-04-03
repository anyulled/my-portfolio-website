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

## 2026-02-12 - [Performance: Hoisting Invariant Operations from Array Callbacks]

**Learning:** Placing invariant operations, like string replacement (`model.tag.replace("-", "")`), inside the callback of an array iteration method (e.g., `.find()`) forces the runtime to repeatedly allocate memory and execute the logic on every item. In nested loops (e.g., `.map()` containing `.find()`), this transforms an $O(N)$ string allocation into an $O(M \times N)$ performance bottleneck.
**Action:** Always extract and evaluate invariant variables before entering iterative callbacks to ensure they are computed only once.

## 2026-02-13 - [Performance: Array Partitioning]

**Learning:** When partitioning a single array into two or more distinct arrays based on a condition, performing multiple sequential `.filter()` operations iterates over the entire dataset multiple times and increases memory overhead through intermediate array creations.
**Action:** Use a single `for...of` loop to iterate through the array once, pushing items into their respective destination arrays based on the condition. This reduces iteration time and memory overhead.

## 2026-02-13 - [Performance: Pre-computing Map keys for O(1) Substring Match]
**Learning:** Replacing an O(M*N) nested loop `.find(photo => photo.tags.includes(searchTag))` with an O(1) Map lookup requires care if the original logic relied on substring matching (`String.prototype.includes`). A naive `photo.tags.split()` approach may fail or change behavior depending on the `tags` data type (e.g., if it's a single string vs an array) and matching rules (exact word vs substring).
**Action:** To preserve substring matching exactly while enabling O(1) lookup, iterate over the known search targets (e.g., `models`), evaluate the `.includes()` condition once per photo, and pre-populate the Map with the specific `searchTag` keys. This retains exact behavior while eliminating the inner loop during rendering.

## 2026-03-12 - [Performance: Server-Side Request Waterfalls in dynamic routes]
**Learning:** Sequential `await` calls for independent data fetching operations in dynamic route parameters (e.g. `getTranslations` and `getPhotosFromStorage`) in Server Components construct a request waterfall. This delays server response since requests execute one after another.
**Action:** Use `Promise.all` to execute the independent data-fetching calls concurrently and eliminate the request waterfall.

## 2026-03-22 - [Performance: Server-Side Request Waterfalls in API Routes]
**Learning:** Sequential `await` calls for independent data fetching operations in API routes (e.g. `getLatestPricing` and `fetchLatestIpc` in `src/app/api/pricing/recalculate/route.ts`) construct a request waterfall. This delays server response since requests execute one after another.
**Action:** Use `Promise.all` to execute the independent asynchronous calls concurrently and eliminate the request waterfall.

## 2026-03-22 - [LCP Optimization: Client-Side Content Initialization]
**Learning:** Initializing component state that maps static data to translations or derived content as an empty array and populating it within a `useEffect` hook forces the component to render initially without data. This delays content rendering until after hydration, negatively impacting Largest Contentful Paint (LCP) and causing layout shifts.
**Action:** To improve LCP and enable Server-Side Rendering (SSR) for static or synchronous data mappings, construct the derived state synchronously during the component's render cycle.

## 2026-03-23 - [LCP Optimization: Server-Side Rendering for Loading Component]
**Learning:** Wrapping purely visual/layout components (like a `Loading` fallback with Framer Motion animations) in a client-side `mounted` state check (e.g., `if (!mounted) return null;`) prevents the component from being server-side rendered (SSR). This delays its visibility until after React hydration, which severely degrades Largest Contentful Paint (LCP) and introduces visual pop-ins or delays for the user.
**Action:** Remove `mounted` checks for components that are purely presentational and rely on SSR-compatible libraries (like `framer-motion`'s `LazyMotion` or static CSS). This allows the initial HTML structure to be sent from the server and immediately displayed, ensuring a fast LCP.
## 2026-03-24 - [LCP Optimization: Client-Side Theme Icons]
**Learning:** Checking client-side hydration state (`mounted`) to render theme toggle icons prevents server rendering and degrades Largest Contentful Paint (LCP) because the icons are absent in the initial HTML and pop-in after hydration.
**Action:** Remove hydration blocks (`mounted`) and use CSS-based media queries or class variants (e.g., `hidden dark:block`, `block dark:hidden`) to handle theme-specific rendering instantly, allowing the entire component to be server rendered.
