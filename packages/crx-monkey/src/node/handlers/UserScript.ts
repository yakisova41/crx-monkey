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
}
