/**
 * Common methods for userscript
 */
export class UsersScript {
  /**
   * Start conditional statement of if for branch of href.
   * @param matches
   */
  public static genarateCodeOfStartIfStatementByMatches(
    matches: string[] | undefined,
    excludes: string[] | undefined,
  ) {
    let scriptContent = '';

    let isAnd = false;

    scriptContent = scriptContent + 'if (';

    if (matches !== undefined) {
      // Does the matches has multiple match href?
      let isOrInMatches = false;

      scriptContent = scriptContent + `${isAnd ? ' &&' : ''} ( `;

      matches.forEach((matchPattern) => {
        scriptContent =
          scriptContent +
          `${isOrInMatches ? ' ||' : ''}location.href.match('${matchPattern}') !== null`;

        isOrInMatches = true;
      });

      scriptContent = scriptContent + ' )';

      isAnd = true;
    }

    if (excludes !== undefined) {
      // Does the excludes has multiple match href?
      let isOrInExcludes = false;

      scriptContent = scriptContent + `${isAnd ? ' &&' : ''} ( `;

      excludes.forEach((matchPattern) => {
        scriptContent =
          scriptContent +
          `${isOrInExcludes ? ' ||' : ''} location.href.match('${matchPattern}') === null`;

        isOrInExcludes = true;
      });

      scriptContent = scriptContent + ' )';

      isAnd = true;
    }

    // End conditional statement.
    scriptContent = scriptContent + ') {\n';

    return scriptContent;
  }

  /**
   * File path convert to base64 and it included "=" convert to "$".
   * @param filePath
   * @returns
   */
  public static convertFilePathToFuncName(filePath: string) {
    return btoa(filePath).replaceAll('=', '$');
  }

  /**
   * Generate code containing code to control timing of inject.
   * @param run_at
   * @param js
   * @param css
   * @param directInject Add code to insert scripts using the DOM
   * @param bindGM
   * @param defineGM
   * @returns
   */
  public static generateCodeIncludingInjectTiming(
    run_at: string | undefined,
    jsFilePaths: string[] | undefined,
    cssFilePaths: string[] | undefined,
    directInject: boolean = false,
    bindGM: boolean = false,
    defineGMHash: string | false = false,
  ) {
    const syntaxs = {
      document_end: {
        start: "document.addEventListener('DOMContentLoaded', () => {",
        end: '});',
      },
      document_idle: {
        start: "document.addEventListener('DOMContentLoaded', () => {setTimeout(() => {",
        end: '}, 1)});',
      },
    };

    let scriptContent = '';
    const runAt = run_at === undefined ? 'document_end' : run_at;

    if (runAt === 'document_end') {
      scriptContent = scriptContent + syntaxs['document_end'].start;
    }

    if (runAt === 'document_idle') {
      scriptContent = scriptContent + syntaxs['document_idle'].start;
    }

    /**
     * Code that executes the function corresponding to the file path.
     */
    if (jsFilePaths !== undefined) {
      const functionNames: string[] = [];

      jsFilePaths.forEach((filePath) => {
        if (directInject) {
          const funcName = UsersScript.convertFilePathToFuncName(filePath);
          functionNames.push(funcName);
        } else {
          let args = '';

          if (defineGMHash) {
            args = args + defineGMHash;
          }

          scriptContent =
            scriptContent + `${UsersScript.convertFilePathToFuncName(filePath)}(${args});\n`;
        }
      });

      if (directInject) {
        const directScriptContent = ['const script = document.createElement("script");'];

        if (bindGM) {
          directScriptContent.push(
            "const bindGMverName = btoa(crypto.randomUUID()).replaceAll('=', '$');",
          );
          directScriptContent.push('unsafeWindow[bindGMverName] = GM;');
          directScriptContent.push('script.innerHTML = `const GM = window["${bindGMverName}"];`;');
        }

        functionNames.forEach((name) => {
          directScriptContent.push(
            `script.innerHTML = script.innerHTML + \`(\${${name}.toString()})();\``,
          );
        });

        directScriptContent.push('unsafeWindow.document.body.appendChild(script)\n');

        scriptContent = scriptContent + directScriptContent.join('\n');
      }
    }

    /**
     * Code that executes the function injecting css corresponding to the file path.
     */
    if (cssFilePaths !== undefined) {
      cssFilePaths.forEach((filePath) => {
        scriptContent = scriptContent + `${UsersScript.convertFilePathToFuncName(filePath)}();\n`;
      });
    }

    if (runAt === 'document_end') {
      scriptContent = scriptContent + syntaxs['document_end'].end;
    }

    if (runAt === 'document_idle') {
      scriptContent = scriptContent + syntaxs['document_idle'].end;
    }

    return scriptContent;
  }
}
