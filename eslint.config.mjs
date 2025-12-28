import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

export default [
    {
        ignores: [
            ".next/**",
            "node_modules/**",
            "coverage/**",
            "*.config.js",
            "*.config.mjs",
            ".lintstagedrc.js",
            "global.d.ts",
            "next-env.d.ts",
            "jest.setup.js",
        ],
    },
    ...compat.extends("next/core-web-vitals", "next/typescript"),
];