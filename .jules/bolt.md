## 2024-05-22 - Hero Component LCP Optimization
**Learning:** Returning `null` based on a client-side `mounted` state kills SSR and significantly delays LCP, even for images that are hidden via opacity. Browsers can preload images discovered in HTML, but `null` return prevents this.
**Action:** Always render the structure of LCP components on the server. If hydration mismatch is a concern due to randomness, move the random selection to the Server Component and pass it down.
