const path = require("node:path");

const buildEslintCommand = (filenames) =>
  `next lint --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" --file ")}`;

module.exports = {
  "*.{js,jsx,ts,tsx}": [
    buildEslintCommand,
    "jest --bail --findRelatedTests --passWithNoTests",
  ],
  "*.{js,jsx,ts,tsx,md,mdx,json,css,scss,html}": "prettier --write",
};
