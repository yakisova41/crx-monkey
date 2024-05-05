import { CrxMonkeyManifest } from '../types';

/**
 * Create post-build manifest from original manifest
 */
export class ManifestFactory {
  private readonly originalManifest: CrxMonkeyManifest;
  private workspace: CrxMonkeyManifest;

  private definedCustomKeysByCrxMonkeyInContentScrpt = [
    'userscript_direct_inject',
    'connection_isolated',
  ];

  constructor(originalManifest: CrxMonkeyManifest) {
    this.originalManifest = originalManifest;
    this.workspace = structuredClone(this.originalManifest);
  }

  /**
   * Output the current manifest data.
   * @returns
   */
  public getWorkspace() {
    return this.workspace;
  }

  /**
   * Get manifest data absorbed defined custom keys by crx-monkey.
   * @returns
   */
  public getResult() {
    return this.absorbCustomKeys(this.workspace);
  }

  public resolveSw(distPath: string) {
    this.workspace.background = {
      ...this.workspace.background,
      service_worker: distPath,
    };
  }

  public resolvePopup(distPath: string) {
    this.workspace.action = {
      ...this.workspace.action,
      default_popup: distPath,
    };
  }

  public addContentScript(
    js: string[],
    css: string[],
    matches: string[],
    world: 'MAIN' | 'ISOLATED' = 'ISOLATED',
  ) {
    if (this.workspace.content_scripts !== undefined) {
      this.workspace.content_scripts.push({
        matches,
        js,
        css,
        world,
      });
    }
  }

  /**
   * Replaces the original manifest path
   * @param type
   * @param originalPath
   * @param distPath
   */
  public resolveContentScript(type: 'css' | 'js', originalPath: string, distPath: string) {
    if (this.workspace.content_scripts !== undefined) {
      this.workspace.content_scripts.forEach((script) => {
        if (type === 'js' && script.js !== undefined) {
          script.js = script.js.map((js) => {
            if (js === originalPath) {
              return distPath;
            } else {
              return js;
            }
          });
        }

        if (type === 'css' && script.css !== undefined) {
          script.css = script.css.map((css) => {
            if (css === originalPath) {
              return distPath;
            } else {
              return css;
            }
          });
        }
      });
    }
  }

  private absorbCustomKeys(original: CrxMonkeyManifest) {
    const result = original;

    if (original.content_scripts !== undefined && result.content_scripts !== undefined) {
      original.content_scripts.forEach((content_script, index) => {
        Object.keys(content_script).forEach((key) => {
          if (this.definedCustomKeysByCrxMonkeyInContentScrpt.includes(key)) {
            if (result.content_scripts !== undefined) {
              delete result.content_scripts[index][key];
            }
          }
        });
      });
    }

    return result;
  }
}
