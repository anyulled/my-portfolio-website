import { execFileSync } from "node:child_process";

const changedTrackedPaths = execFileSync(
  "/usr/bin/git",
  ["status", "--porcelain", "--untracked-files=all"],
  { encoding: "utf8" },
).trim();

if (changedTrackedPaths) {
  console.error(
    `WHAT: Verification modified repository paths:\n${changedTrackedPaths}`,
  );
  console.error("WHY: Generated changes make the handoff non-reproducible.");
  console.error(
    "FIX: Regenerate and commit intentional output or stop the mutating verification step.",
  );
  process.exitCode = 1;
} else {
  console.log("Repository state remained clean.");
}
