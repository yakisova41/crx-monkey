import fse from 'fs-extra';

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
