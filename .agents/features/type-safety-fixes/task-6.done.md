# Task 6: Add Validation Tooling (ESLint + Prettier)

## Task Metadata

- **ACTION**: CREATE
- **TARGET**: `.opencode/eslint.config.mjs`, `.opencode/.prettierrc`, `.opencode/package.json`
- **FEATURE**: type-safety-fixes
- **ESTIMATED TIME**: 10 minutes

## Problem

L1 validation (lint/format) commands are not configured in `.claude/config.md`. The codebase has no eslint or prettier configuration.

## Solution

1. Create ESLint 9+ flat config (`eslint.config.mjs`)
2. Create Prettier config (`.prettierrc`)
3. Add lint/format scripts to `package.json`

## Implementation Steps

### Step 1: Create eslint.config.mjs

Create `.opencode/eslint.config.mjs`:

```javascript
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // Code quality
      'no-console': 'off', // Allow console in framework code
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '**/*.test.ts', // Tests may have different patterns
    ],
  },
]
```

### Step 2: Create .prettierrc

Create `.opencode/.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Step 3: Update package.json

Add to `.opencode/package.json` devDependencies:

```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  },
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "validate": "npm run typecheck && npm run lint && npm run test"
  }
}
```

### Step 4: Install dependencies

Run from `.opencode/`:

```bash
npm install
```

## Files to Modify

1. `.opencode/eslint.config.mjs` — Create ESLint 9+ flat config
2. `.opencode/.prettierrc` — Create Prettier config
3. `.opencode/package.json` — Add lint dependencies and scripts

## Pattern to Follow

```javascript
// Pattern: ESLint 9+ flat config format

// Must use .mjs extension for ESM
// Uses import/export syntax
// Array of config objects

export default [
  {
    files: ['**/*.ts'],
    // ... config
  },
  {
    ignores: ['node_modules/**'],
  },
]
```

## Gotchas

- ESLint 9+ requires flat config (`.eslintrc` deprecated)
- Must use `.mjs` extension for ESM format
- TypeScript parser needs `tsconfig.json` path
- Prettier and ESLint may conflict on formatting - ensure consistent rules
- Use `--write` for Prettier first pass to format existing code

## Validation

```bash
# From .opencode/ directory:
npm install
npx eslint . --max-warnings 0
npx prettier --check .
```

Should show: ESLint runs without fatal errors, Prettier checks pass

## Success Criteria

- ESLint config created and runs without crashing
- Prettier config created and matches existing code style
- `npm run lint` executes
- `npm run format:check` validates formatting
- `npm run validate` runs full validation pipeline