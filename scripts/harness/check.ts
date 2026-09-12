import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

interface PackageManifest {
  scripts?: Record<string, string>;
}

interface HarnessFinding {
  what: string;
  why: string;
  fix: string;
}

const requiredPathStatus: Array<[string, boolean]> = [
  ["AGENTS.md", existsSync("AGENTS.md")],
  ["README.md", existsSync("README.md")],
  ["architecture.md", existsSync("architecture.md")],
  ["CONTRIBUTING.md", existsSync("CONTRIBUTING.md")],
  ["SECURITY.md", existsSync("SECURITY.md")],
  [".env.example", existsSync(".env.example")],
  [
    ".github/ISSUE_TEMPLATE/harness-task.yml",
    existsSync(".github/ISSUE_TEMPLATE/harness-task.yml"),
  ],
  [
    ".github/PULL_REQUEST_TEMPLATE.md",
    existsSync(".github/PULL_REQUEST_TEMPLATE.md"),
  ],
  ["docs/harness.md", existsSync("docs/harness.md")],
  ["playwright.config.ts", existsSync("playwright.config.ts")],
  [
    "config/coverage-baseline.json",
    existsSync("config/coverage-baseline.json"),
  ],
];

const forbiddenTrackedPaths = [
  ".env",
  "CODEOWNERS copy",
  "dev.log",
  "dev_server.log",
  "server.log",
  "verify.py",
];

const requiredScripts = [
  "doctor",
  "harness:check",
  "harness:clean",
  "harness:yaml",
  "typecheck",
  "verify:quick",
  "verify",
  "verify:full",
  "verify:nightly",
  "verify:preview",
];

const readPackageManifest = (): PackageManifest =>
  JSON.parse(readFileSync("package.json", "utf8")) as PackageManifest;

const readTrackedPaths = (): Set<string> =>
  new Set(
    execFileSync("git", ["ls-files"], { encoding: "utf8" })
      .split("\n")
      .filter(Boolean),
  );

const collectRequiredPathFindings = (): HarnessFinding[] =>
  requiredPathStatus
    .filter(([, pathExists]) => !pathExists)
    .map(([requiredPath]) => ({
      what: `Required harness path is missing: ${requiredPath}`,
      why: "A fresh session cannot discover the complete repository contract.",
      fix: `Restore ${requiredPath} or update the authoritative harness contract.`,
    }));

const collectTrackedArtifactFindings = (): HarnessFinding[] => {
  const trackedPaths = readTrackedPaths();
  return forbiddenTrackedPaths
    .filter((forbiddenPath) => trackedPaths.has(forbiddenPath))
    .map((forbiddenPath) => ({
      what: `Forbidden artifact is tracked: ${forbiddenPath}`,
      why: "Secrets and transient verification output make handoffs unsafe.",
      fix: `Remove ${forbiddenPath} from Git and keep local equivalents ignored.`,
    }));
};

const collectScriptFindings = (): HarnessFinding[] => {
  const packageManifest = readPackageManifest();
  const packageScripts = packageManifest.scripts ?? {};
  const missingScriptFindings = requiredScripts
    .filter((scriptName) => !Object.hasOwn(packageScripts, scriptName))
    .map((scriptName) => ({
      what: `Required package script is missing: ${scriptName}`,
      why: "Maintainers and agents need one reproducible verification vocabulary.",
      fix: `Define ${scriptName} in package.json.`,
    }));
  const networkFetchingScripts = Object.entries(packageScripts)
    .filter(([, scriptCommand]) => /(^|\s)npx\s/.test(scriptCommand))
    .map(([scriptName]) => ({
      what: `Package script can fetch undeclared tooling: ${scriptName}`,
      why: "Runtime downloads make execution dependent on mutable registry state.",
      fix: `Declare the tool in devDependencies and invoke its local binary from ${scriptName}.`,
    }));

  return [...missingScriptFindings, ...networkFetchingScripts];
};

const reportFinding = (finding: HarnessFinding): void => {
  console.error(`WHAT: ${finding.what}`);
  console.error(`WHY: ${finding.why}`);
  console.error(`FIX: ${finding.fix}`);
};

const findings = [
  ...collectRequiredPathFindings(),
  ...collectTrackedArtifactFindings(),
  ...collectScriptFindings(),
];

if (findings.length > 0) {
  findings.forEach(reportFinding);
  process.exitCode = 1;
} else {
  console.log("Harness contract verified.");
}
