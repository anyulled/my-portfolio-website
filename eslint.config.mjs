import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import nextPlugin from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from 'typescript-eslint';
import noGenericNames from './.eslint-rules/no-generic-names.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const customRules = {
    plugins: {
        custom: {
            rules: {
                'no-generic-names': noGenericNames,
            },
        },
        import: importPlugin,
        '@next/next': nextPlugin
    },
};

export default tseslint.defineConfig(
    ...nx.configs['flat/base'],
    ...nx.configs['flat/typescript'],
    ...nx.configs['flat/javascript'],
    // ...compat.extends("next/core-web-vitals", "next/typescript"),
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
            '**/dist',
            '**/out-tsc',
            '**/node_modules',
            '**/.nx',
            '*.config.ts',
            'vitest.workspace.ts',
            '**/*.d.ts',
            '**/test-output',
            '**/api/generated/**',
            '**/.vitepress/cache/**',
        ],
    },
    eslintComments.recommended,
    {
        rules: {
            '@eslint-community/eslint-comments/no-use': ['error', { allow: ['eslint-disable', 'eslint-enable', 'eslint-disable-next-line'] }],
        },
    },
    customRules,
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            'import/extensions': [
                'error',
                'never',
                { ts: 'never', tsx: 'never', js: 'never', json: 'always', css: 'always', config: 'always' },
            ],

            // Custom rule: no generic names
            'custom/no-generic-names': 'error',

            // No comments - forces self-documenting code
            'no-warning-comments': 'off',
            'multiline-comment-style': 'off',
            'capitalized-comments': 'off',
            'no-inline-comments': 'error',
            'spaced-comment': 'off',

            // Ban let - use const only
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'VariableDeclaration[kind="let"]',
                    message: 'Use const. Avoid mutation.',
                },
            ],
            'prefer-const': 'error',
            'no-var': 'error',

            // No any types
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-return': 'error',

            // Type assertions - allow 'as' for practical reasons, but ban angle-bracket
            '@typescript-eslint/consistent-type-assertions': [
                'error',
                { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow-as-parameter' },
            ],

            // Next.js rules
            '@next/next/no-img-element': 'error',
            '@next/next/no-html-link-for-pages': 'error',
            '@next/next/google-font-display': 'error',

            // No non-null assertions - handle errors properly
            '@typescript-eslint/no-non-null-assertion': 'error',

            // Ban generic folder imports (not lib - that's NX convention)
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['*/utils/*', '*/utils'],
                            message: 'No utils folders. Use domain-specific names.',
                        },
                        {
                            group: ['*/helpers/*', '*/helpers'],
                            message: 'No helpers folders. Use domain-specific names.',
                        },
                        {
                            group: ['*/common/*', '*/common'],
                            message: 'No common folders. Use domain-specific names.',
                        },
                        {
                            group: ['*/shared/*', '*/shared'],
                            message: 'No shared folders. Use domain-specific names.',
                        },
                        {
                            group: ['*/core/*', '*/core'],
                            message: 'No core folders. Use domain-specific names.',
                        },
                        {
                            group: ['*/src/lib/*', '*/src/lib', './lib/*', './lib', '../lib/*', '../lib'],
                            message: 'No lib folders in projects. Use domain-specific names.',
                        },
                    ],
                },
            ],

            // Complexity limits
            'max-lines': [
                'error',
                { max: 400, skipBlankLines: true, skipComments: true },
            ],
            'max-depth': ['error', 3],
            complexity: ['error', 12],

            // Naming conventions
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'variable',
                    format: ['camelCase'],
                },
                {
                    selector: 'variable',
                    modifiers: ['const'],
                    format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
                },
                {
                    selector: 'function',
                    format: ['camelCase', 'PascalCase'],
                },
                {
                    selector: 'parameter',
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: 'typeLike',
                    format: ['PascalCase'],
                },
                {
                    selector: 'enumMember',
                    format: ['PascalCase'],
                },
                {
                    selector: 'objectLiteralProperty',
                    format: null,
                },
            ],
        },
    },
    {
        files: ['src/__tests__/**/*.ts', 'src/__tests__/**/*.tsx'],
        rules: {
            '@typescript-eslint/consistent-type-assertions': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            'custom/no-generic-names': 'off',
            '@eslint-community/eslint-comments/disable-enable-pair': 'off',
            '@next/next/no-img-element': 'off',
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: __dirname,
            },
        },
    },
    {
        files: ['src/services/**/*.{ts,tsx}', 'src/data/**/*.{ts,tsx}'],
        rules: {
            'custom/no-generic-names': 'off',
        },
    },
);