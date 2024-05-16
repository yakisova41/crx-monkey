import fse from 'fs-extra';

/**
 * Get static file to load for chrome extension in develop mode.
 * @param filePath Static file path.
 * @param vars Variables to inject into static code.
 * @returns
 */
export function loadStaticFile(filePath: string, vars: Record<string, string | boolean> = {}) {
  const buffer = fse.readFileSync(filePath);
  let contents = buffer.toString();

  Object.keys(vars).forEach((varName) => {
    const value = vars[varName];
    const reg = `\${${varName}}`;

    contents = contents.replaceAll(reg, String(value));
  });

  const templateIfs = contents.match(/\/\/<if ".*">[^/]*\/\/<\/if>/g);

  if (templateIfs !== null) {
    templateIfs.forEach((templateIfString) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [match, ifVarName, templateCode] = templateIfString.match(
        /\/\/<if "(.*)">([^/]*)\/\/<\/if>/,
      )!;

      if (vars[ifVarName] !== true) {
        contents = contents.replaceAll(`//<if "${ifVarName}">${templateCode}//</if>`, '');
      }
    });
  }

  return contents;
}
