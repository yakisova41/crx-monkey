// @ts-check

/** @typedef {import('eslint').ESLint.ConfigData} ConfigData */

/** @type {ConfigData} */
export const config = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2022
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ]
};