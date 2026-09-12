import { readFileSync } from "node:fs";

interface CoverageBaseline {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

interface CoverageSummary {
  total: {
    statements: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
    lines: { pct: number };
  };
}

const baseline = JSON.parse(
  readFileSync("config/coverage-baseline.json", "utf8"),
) as CoverageBaseline;
const summary = JSON.parse(
  readFileSync("coverage/coverage-summary.json", "utf8"),
) as CoverageSummary;
const metrics = [
  {
    name: "statements",
    actual: summary.total.statements.pct,
    minimum: baseline.statements,
  },
  {
    name: "branches",
    actual: summary.total.branches.pct,
    minimum: baseline.branches,
  },
  {
    name: "functions",
    actual: summary.total.functions.pct,
    minimum: baseline.functions,
  },
  {
    name: "lines",
    actual: summary.total.lines.pct,
    minimum: baseline.lines,
  },
];
const regressions = metrics.filter(
  (coverageMetric) => coverageMetric.actual < coverageMetric.minimum,
);

metrics.forEach((coverageMetric) =>
  console.log(
    `${coverageMetric.name}: ${coverageMetric.actual.toFixed(2)}% (minimum ${coverageMetric.minimum.toFixed(2)}%)`,
  ),
);

if (regressions.length > 0) {
  console.error("WHAT: Global coverage regressed below its recorded baseline.");
  console.error(
    "WHY: Existing verification strength must not decline while coverage ratchets toward 90%.",
  );
  console.error(
    "FIX: Add coverage or update the baseline only after an independently reviewed intentional increase.",
  );
  process.exitCode = 1;
}
