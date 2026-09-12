import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative } from "node:path";

interface SourceLocation {
  start: { line: number };
}

interface FileCoverage {
  statementMap: Record<string, SourceLocation>;
  fnMap: Record<string, { loc: SourceLocation }>;
  branchMap: Record<string, { loc: SourceLocation }>;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number[]>;
}

interface CoverageMetric {
  covered: number;
  total: number;
}

type CoverageReport = Record<string, FileCoverage>;
type ChangedLines = Map<string, Set<number>>;

const baseReference = process.env.COVERAGE_BASE_REF ?? "origin/main";
const changedSourcePattern = /^src\/(?!__tests__\/).+\.(?:ts|tsx)$/;

const readChangedLines = (): ChangedLines => {
  const unifiedDiff = execFileSync(
    "/usr/bin/git",
    ["diff", "--unified=0", baseReference, "--", "src"],
    { encoding: "utf8" },
  );
  const changedLines: ChangedLines = new Map();
  const diffLines = unifiedDiff.split("\n");
  const state = { currentPath: "" };

  for (const diffLine of diffLines) {
    if (diffLine.startsWith("+++ b/")) {
      state.currentPath = diffLine.slice(6);
      continue;
    }

    const addedRange = diffLine.startsWith("@@ ")
      ? diffLine.split(" ").find((rangePart) => rangePart.startsWith("+"))
      : undefined;
    if (!addedRange || !changedSourcePattern.test(state.currentPath)) {
      continue;
    }

    const [startLineText, lineCountText = "1"] = addedRange.slice(1).split(",");
    const startLine = Number(startLineText);
    const lineCount = Number(lineCountText);
    const sourceLines =
      changedLines.get(state.currentPath) ?? new Set<number>();
    Array.from(
      { length: lineCount },
      (_, offset) => startLine + offset,
    ).forEach((lineNumber) => sourceLines.add(lineNumber));
    changedLines.set(state.currentPath, sourceLines);
  }

  return changedLines;
};

const createMetric = (): CoverageMetric => ({ covered: 0, total: 0 });

const addCount = (metric: CoverageMetric, executionCount: number): void => {
  metric.total += 1;
  if (executionCount > 0) {
    metric.covered += 1;
  }
};

const findFileCoverage = (
  coverageReport: CoverageReport,
  sourcePath: string,
): FileCoverage | undefined =>
  Object.entries(coverageReport).find(
    ([absolutePath]) => relative(process.cwd(), absolutePath) === sourcePath,
  )?.[1];

const collectFileMetrics = (
  fileCoverage: FileCoverage,
  changedLines: Set<number>,
): Record<string, CoverageMetric> => {
  const statements = createMetric();
  const functions = createMetric();
  const branches = createMetric();
  const lineExecutionCounts = new Map<number, number>();
  const statementCounts = new Map(Object.entries(fileCoverage.s));
  const functionCounts = new Map(Object.entries(fileCoverage.f));
  const branchCounts = new Map(Object.entries(fileCoverage.b));

  Object.entries(fileCoverage.statementMap).forEach(
    ([statementId, location]) => {
      if (!changedLines.has(location.start.line)) {
        return;
      }
      const executionCount = statementCounts.get(statementId) ?? 0;
      addCount(statements, executionCount);
      lineExecutionCounts.set(
        location.start.line,
        Math.max(
          lineExecutionCounts.get(location.start.line) ?? 0,
          executionCount,
        ),
      );
    },
  );

  Object.entries(fileCoverage.fnMap).forEach(([functionId, definition]) => {
    if (changedLines.has(definition.loc.start.line)) {
      addCount(functions, functionCounts.get(functionId) ?? 0);
    }
  });

  Object.entries(fileCoverage.branchMap).forEach(([branchId, definition]) => {
    if (!changedLines.has(definition.loc.start.line)) {
      return;
    }
    (branchCounts.get(branchId) ?? []).forEach((executionCount) =>
      addCount(branches, executionCount),
    );
  });

  const lines = createMetric();
  lineExecutionCounts.forEach((executionCount) =>
    addCount(lines, executionCount),
  );

  return { statements, branches, functions, lines };
};

const mergeMetrics = (
  totals: Record<string, CoverageMetric>,
  additions: Record<string, CoverageMetric>,
): void => {
  const mergeMetric = (
    totalMetric: CoverageMetric,
    additionalMetric: CoverageMetric,
  ): void => {
    totalMetric.covered += additionalMetric.covered;
    totalMetric.total += additionalMetric.total;
  };

  mergeMetric(totals.statements, additions.statements);
  mergeMetric(totals.branches, additions.branches);
  mergeMetric(totals.functions, additions.functions);
  mergeMetric(totals.lines, additions.lines);
};

const changedLinesByPath = readChangedLines();
const coverageReport = JSON.parse(
  readFileSync("coverage/coverage-final.json", "utf8"),
) as CoverageReport;
const totals = {
  statements: createMetric(),
  branches: createMetric(),
  functions: createMetric(),
  lines: createMetric(),
};

changedLinesByPath.forEach((changedLines, sourcePath) => {
  const fileCoverage = findFileCoverage(coverageReport, sourcePath);
  if (fileCoverage) {
    mergeMetrics(totals, collectFileMetrics(fileCoverage, changedLines));
  }
});

const failingMetrics = Object.entries(totals).filter(([, metric]) => {
  const percentage =
    metric.total === 0 ? 100 : (metric.covered / metric.total) * 100;
  return percentage < 90;
});

Object.entries(totals).forEach(([metricName, metric]) => {
  const percentage =
    metric.total === 0 ? 100 : (metric.covered / metric.total) * 100;
  console.log(
    `${metricName}: ${metric.covered}/${metric.total} (${percentage.toFixed(2)}%)`,
  );
});

if (failingMetrics.length > 0) {
  console.error("WHAT: Changed executable code is below 90% coverage.");
  console.error("WHY: New behavior must include machine-verifiable evidence.");
  console.error(
    "FIX: Add tests for the uncovered changed statements, branches, functions, and lines.",
  );
  process.exitCode = 1;
}
