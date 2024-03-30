/**
 * Create post-build manifest from original manifest
 */
export class ManifestFactory {
  private readonly originalManifest: chrome.runtime.ManifestV3;
  private workspace: chrome.runtime.ManifestV3;

  constructor(originalManifest: chrome.runtime.ManifestV3) {
    this.originalManifest = originalManifest;
    this.workspace = structuredClone(this.originalManifest);
  }

  public getWorkspace() {
    return this.workspace;
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

  public addContentScript(js: string[], css: string[], matches: string[]) {
    if (this.workspace.content_scripts !== undefined) {
      this.workspace.content_scripts.push({
        matches,
        js,
        css,
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
}
