import { tanstackConfig } from '@tanstack/eslint-config'

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...tanstackConfig,
  {
    // Config files are plain JS and are not part of the tsconfig program, so
    // the type-aware parser cannot lint them.
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
  {
    rules: {
      // Add custom rules here
    },
  },
]
