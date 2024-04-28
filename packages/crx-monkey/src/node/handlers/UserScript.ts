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
   * @returns
   */
  public static generateCodeIncludingInjectTiming(
    run_at: string | undefined,
    js: string[] | undefined,
    css: string[] | undefined,
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
    if (js !== undefined) {
      js.forEach((filePath) => {
        scriptContent = scriptContent + `${UsersScript.convertFilePathToFuncName(filePath)}();\n`;
      });
    }

    /**
     * Code that executes the function injecting css corresponding to the file path.
     */
    if (css !== undefined) {
      css.forEach((filePath) => {
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
