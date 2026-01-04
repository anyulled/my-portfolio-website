const path = require("node:path");

const buildEslintCommand = (filenames) =>
  `next lint --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" --file ")}`;

// usage of next lint is broken, use eslint directly
const buildEslint = (filenames) =>
  `npx eslint --fix ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" ")}`;

module.exports = {
  "*.{js,jsx,ts,tsx}": [
    buildEslint,
    "jest --bail --findRelatedTests --passWithNoTests",
  ],
  "*.{js,jsx,ts,tsx,md,mdx,json,css,scss,html}": "prettier --write",
};
