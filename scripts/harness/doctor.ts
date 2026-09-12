import { execFileSync } from "node:child_process";

interface RuntimeVersion {
  major: number;
  minor: number;
}

const parseRuntimeVersion = (version: string): RuntimeVersion => {
  const [major = 0, minor = 0] = version
    .replace(/^v/, "")
    .split(".")
    .map(Number);
  return { major, minor };
};

const nodeVersion = parseRuntimeVersion(process.version);
const npmVersionText = execFileSync("npm", ["--version"], {
  encoding: "utf8",
}).trim();
const npmVersion = parseRuntimeVersion(npmVersionText);
const nodeSupported =
  (nodeVersion.major === 22 && nodeVersion.minor >= 9) ||
  (nodeVersion.major >= 23 && nodeVersion.major < 25);
const npmSupported = npmVersion.major === 11;

if (!nodeSupported) {
  console.error(`WHAT: Unsupported Node.js runtime: ${process.version}`);
  console.error(
    "WHY: The repository supports Node.js 22.9 through Node.js 24.",
  );
  console.error("FIX: Install Node.js 24.20.0 from .node-version.");
  process.exitCode = 1;
}

if (!npmSupported) {
  console.error(`WHAT: Unsupported npm runtime: ${npmVersionText}`);
  console.error("WHY: The lockfile and automation use npm 11 semantics.");
  console.error("FIX: Install npm 11.19.1.");
  process.exitCode = 1;
}

if (nodeSupported && npmSupported) {
  console.log(
    `Runtime verified: Node.js ${process.version}, npm ${npmVersionText}.`,
  );
}
