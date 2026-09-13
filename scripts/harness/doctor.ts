interface RuntimeVersion {
  major: number;
  minor: number;
  patch: number;
}

const parseRuntimeVersion = (version: string): RuntimeVersion => {
  const [major = 0, minor = 0, patch = 0] = version
    .replace(/^v/, "")
    .split(".")
    .map(Number);
  return { major, minor, patch };
};

const nodeVersion = parseRuntimeVersion(process.version);
const npmVersionText =
  process.env.npm_config_user_agent?.match(/^npm\/([^\s]+)/)?.[1] ?? "0.0.0";
const npmVersion = parseRuntimeVersion(npmVersionText);
const nodeSupported = nodeVersion.major === 24;
const npmSupported = npmVersion.major === 11;

if (!nodeSupported) {
  console.error(`WHAT: Unsupported Node.js runtime: ${process.version}`);
  console.error("WHY: The repository supports the Node.js 24 LTS line.");
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
