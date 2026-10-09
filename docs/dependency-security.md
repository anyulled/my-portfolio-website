# Dependency security maintenance

The October 2026 Instagram inbox release updates Next.js and its matching environment and lint packages to 16.3.8, Sharp to 0.35.5, and compatible transitive dependencies to remove the high and critical findings that blocked the required security audit. `@eslint/js` stays on ESLint 9's matching release instead of mixing its version 10 configuration with ESLint 9.

## Brace-pattern depth guard

Upstream `braces` 3.0.3 has no patched release for [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Next.js linting and the Vercel toolbar both depend on it. The npm override pins the inspected MIT-licensed derivative `@dieub/braces-depth-guard` to `3.0.3-pn.2`; the lockfile pins its registry artifact and integrity hash.

The derivative backports the nesting and recursive AST traversal bounds from [upstream PR #72](https://github.com/micromatch/braces/pull/72), caps depth at 100, and adds fractional-limit and cyclic-parent protections. Runtime source was compared with the upstream package before adoption. The published package has no install script and includes npm provenance metadata.

`src/__tests__/security/braces-depth.test.ts` exercises the installed dependency through its normal consumer API. It verifies excessive brace and parenthesis nesting is rejected before recursive traversal, an unlimited caller option cannot bypass the hard bound, and ordinary glob compilation and range expansion remain compatible. Lint, build, and browser verification exercise the consuming tools.

An alias alone does not prove a security fix. This release relies on the reviewed guard changes and executable regressions in addition to audit results. The guard addresses nested-input recursion; it is not a guarantee against every possible resource-exhaustion pattern or malformed caller-supplied AST.

Remove the override when an upstream release contains equivalent protections, after rerunning the depth regressions and complete verification. Keep the existing audit severity threshold and required checks unchanged.
