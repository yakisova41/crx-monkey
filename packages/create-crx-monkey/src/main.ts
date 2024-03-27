import consola from 'consola';
import pkg from '../package.json';
import chalk from 'chalk';

const projectName = await consola.prompt('Project name', { type: 'text' });

const language = await consola.prompt('Select a Language', {
  type: 'select',
  options: [chalk.blueBright('Typescript'), chalk.yellow('Javascript')],
});

const packageJsonPrototype = {
  name: projectName,
  version: '1.0.0',
  type: 'module',
  scripts: {
    build: 'crx-monkey build',
    dev: 'crx-monkey dev',
  },
  devDependencies: {},
};
