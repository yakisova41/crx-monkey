// @ts-check
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

/** @typedef {import('rollup').RollupOptions} ConfigData */

/** @type {import('rollup').RollupOptions} */
const config = {
  input: 'src/main.ts',
  output: [
    {
      file: 'dist/main.js',
      format: 'esm',
      sourcemap: 'inline',
    },
  ],
  plugins: [
    commonjs({
      include: ['node_modules/**'],
    }),
    json(),
    typescript({
      declaration: true,
      declarationDir: 'dist/types',
      tsconfig: './tsconfig.json',
      exclude: ['**/__tests__/**'],
    }),
  ],
};

export default config;
