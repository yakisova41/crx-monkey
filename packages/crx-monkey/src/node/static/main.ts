import fse from 'fs-extra';

/**
 * Get static file to load for chrome extension in develop mode.
 * @param filePath Static file path.
 * @param vars Variables to inject into static code.
 * @returns
 */
export function loadStaticFile(filePath: string, vars: Record<string, string> = {}) {
  const buffer = fse.readFileSync(filePath);
  let contents = buffer.toString();

  Object.keys(vars).forEach((varName) => {
    const value = vars[varName];
    const reg = `\${${varName}}`;

    contents = contents.replaceAll(reg, value);
  });

  return contents;
}
