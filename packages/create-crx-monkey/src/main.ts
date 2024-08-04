import consola from 'consola';
import chalk from 'chalk';
import fse from 'fs-extra';
import path from 'path';

async function getLatestVersion(packageName: string) {
  return fetch(`https://registry.npmjs.org/${packageName}/latest`)
    .then((res) => res.json())
    .then((data) => {
      return data.version;
    });
}

const projectName = await consola.prompt('Project name', { type: 'text' });
const language = await consola.prompt('Select a Language', {
  type: 'select',
  options: [chalk.blueBright('Typescript'), chalk.yellow('Javascript')],
});
const isTs = language === chalk.blueBright('Typescript') ? true : false;

const packageJsonPrototype = {
  name: projectName,
  version: '1.0.0',
  private: true,
  type: 'module',
  scripts: {
    build: 'npx crx-monkey build',
    dev: 'npx crx-monkey dev',
  },
  devDependencies: {
    'crx-monkey': '^' + (await getLatestVersion('crx-monkey')),
    '@types/chrome': '^' + (await getLatestVersion('@types/chrome')),
  },
};

const manifestJsonPrototype = {
  name: projectName,
  version: '1.0.0',
  manifest_version: 3,
  description: 'description',
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: [`src/contentScripts/contentScript.${isTs ? 'ts' : 'js'}`],
    },
  ],
  action: {
    default_popup: 'src/popup/index.html',
  },
  background: {
    service_worker: `src/sw/sw.${isTs ? 'ts' : 'js'}`,
  },
};

const manifestJs = `
// @ts-check

/** @type {import('crx-monkey').CrxMonkeyManifest} */
const manifest = ${JSON.stringify(manifestJsonPrototype, undefined, 2)};

export default manifest;
`;

fse.mkdir(projectName);

fse.outputFile(
  path.join(projectName, `src/contentScripts/contentScript.${isTs ? 'ts' : 'js'}`),
  "console.log('contentscirpt');",
);

fse.outputFile(
  path.join(projectName, `src/sw/sw.${isTs ? 'ts' : 'js'}`),
  "console.log('service worker');",
);

fse.outputFile(
  path.join(projectName, `src/popup/popup.${isTs ? 'ts' : 'js'}`),
  "console.log('popup');",
);

fse.outputFile(
  path.join(projectName, `src/popup/index.html`),
  `<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Popup</title>
</head>
<body>
  <p>Crx monkey popup</p>
  <script src="./popup.js"></script>
</body>
</html>
`,
);

fse.outputFile(
  path.join(projectName, 'package.json'),
  JSON.stringify(packageJsonPrototype, undefined, 2),
);

fse.outputFile(path.join(projectName, 'manifest.js'), manifestJs);

fse.outputFile(
  path.join(projectName, 'crx-monkey.config.js'),
  [
    '// @ts-check',
    '',
    "/** @type {import('crx-monkey').CrxMonkeyConfig} */",
    'const config = {};',
    '',
    'export default config;',
  ].join('\n'),
);

if (isTs) {
  fse.outputFile(
    path.join(projectName, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          allowJs: false,
          skipLibCheck: true,
          esModuleInterop: false,
          strict: true,
          forceConsistentCasingInFileNames: true,
          module: 'ESNext',
          moduleResolution: 'Bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          baseUrl: '.',
          types: ['chrome'],
        },
        include: ['src'],
      },
      undefined,
      2,
    ),
  );
}

console.log('\n');
consola.success('Project created!');
consola.info('Build the project environment with the following commands');
consola.box([`cd ${projectName}`, 'npm install'].join('\n'));
