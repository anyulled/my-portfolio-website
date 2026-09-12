const path = require("node:path");

const buildEslint = (filenames) =>
  `eslint --fix ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" ")}`;

module.exports = {
  "*.{js,jsx,ts,tsx}": [
    buildEslint,
    "jest --bail --findRelatedTests --passWithNoTests",
  ],
  "*.{js,jsx,ts,tsx,md,mdx,json,css,scss,html}": "prettier --write",
};
