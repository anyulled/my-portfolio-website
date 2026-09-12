import { readFileSync } from "node:fs";
import { parseDocument } from "yaml";

const yamlDocuments: Array<[string, string]> = [
  [
    ".github/ISSUE_TEMPLATE/config.yml",
    readFileSync(".github/ISSUE_TEMPLATE/config.yml", "utf8"),
  ],
  [
    ".github/ISSUE_TEMPLATE/harness-task.yml",
    readFileSync(".github/ISSUE_TEMPLATE/harness-task.yml", "utf8"),
  ],
  [".github/dependabot.yml", readFileSync(".github/dependabot.yml", "utf8")],
  [
    ".github/workflows/ci.yml",
    readFileSync(".github/workflows/ci.yml", "utf8"),
  ],
  [
    ".github/workflows/dependabot-auto-merge.yml",
    readFileSync(".github/workflows/dependabot-auto-merge.yml", "utf8"),
  ],
  [
    ".github/workflows/nightly.yml",
    readFileSync(".github/workflows/nightly.yml", "utf8"),
  ],
  [
    ".github/workflows/preview-e2e.yml",
    readFileSync(".github/workflows/preview-e2e.yml", "utf8"),
  ],
  [
    ".github/workflows/pr-size-labeler.yml",
    readFileSync(".github/workflows/pr-size-labeler.yml", "utf8"),
  ],
  [
    ".github/workflows/scorecard.yml",
    readFileSync(".github/workflows/scorecard.yml", "utf8"),
  ],
  [
    ".github/workflows/task-state.yml",
    readFileSync(".github/workflows/task-state.yml", "utf8"),
  ],
  [".commitlintrc.yml", readFileSync(".commitlintrc.yml", "utf8")],
];

const parseErrors = yamlDocuments.flatMap(([documentPath, yamlSource]) =>
  parseDocument(yamlSource).errors.map(
    (parseError) => `${documentPath}: ${parseError.message}`,
  ),
);

if (parseErrors.length > 0) {
  console.error("WHAT: Harness YAML is invalid.");
  console.error("WHY: GitHub cannot execute malformed repository automation.");
  console.error(`FIX: Resolve these parser errors:\n${parseErrors.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`YAML verified: ${yamlDocuments.length} documents.`);
}
