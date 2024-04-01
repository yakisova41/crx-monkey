// @ts-check
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import { dts } from 'rollup-plugin-dts';
import copy from 'rollup-plugin-copy';

/** @typedef {import('rollup').RollupOptions} ConfigData */

/** @type {import('rollup').RollupOptions} */
const nodeConfig = {
  input: 'src/node/main.ts',
  output: [
    {
      file: 'dist/node/main.js',
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
      declaration: false,
      tsconfig: './tsconfig.json',
      exclude: ['**/__tests__/**'],
    }),
    copy({
      targets: [{ src: 'src/node/static/files/*', dest: 'dist/node/static' }],
    }),
  ],
};

const nodeTypes = {
  input: 'src/node/types.ts',
  output: [
    {
      file: 'dist/node/main.d.ts',
      format: 'esm',
    },
  ],
  plugins: [
    commonjs({
      include: ['node_modules/**'],
    }),
    typescript({
      declaration: false,
      tsconfig: './tsconfig.json',
      exclude: ['**/__tests__/**'],
    }),
    dts(),
  ],
};

/** @type {import('rollup').RollupOptions} */
const clientConfig = {
  input: 'src/client/main.ts',
  output: [
    {
      file: 'dist/client/main.js',
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
      declaration: false,
      tsconfig: './tsconfig.json',
      exclude: ['**/__tests__/**'],
    }),
  ],
};

const clientTypes = {
  input: 'src/client/main.ts',
  output: [
    {
      file: 'dist/client/main.d.ts',
      format: 'esm',
    },
  ],
  plugins: [
    commonjs({
      include: ['node_modules/**'],
    }),
    typescript({
      declaration: false,
      tsconfig: './tsconfig.json',
      exclude: ['**/__tests__/**'],
    }),
    dts(),
  ],
};

export default [nodeConfig, nodeTypes, clientConfig, clientTypes];
