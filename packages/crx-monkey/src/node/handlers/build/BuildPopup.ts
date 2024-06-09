import { Build, BuildImplements } from './Build';
import fse from 'fs-extra';
import path from 'path';
import { parse, HTMLElement } from 'node-html-parser';

export class BuildPopup extends Build implements BuildImplements {
  private requestLocalScripts: Record<string, HTMLElement> = {};
  private requestLocalHrefFiles: Record<string, HTMLElement> = {};
  private requestLocalSrcFiles: Record<string, HTMLElement> = {};

  public async build(): Promise<void> {
    const popupHtml = this.manifest.action?.default_popup;

    if (popupHtml !== undefined) {
      const popupPath = path.join(path.dirname(this.config.manifestPath!), popupHtml);

      const root = this.getParser(popupHtml);
      this.loadRequestLocalJsResources(root);
      this.loadRequestLocalHrefResources(root);
      this.loadRequestLocalSrcResources(root);

      await this.buildLocalScripts(popupPath);
      await this.copyLocalHrefFiles(popupPath);
      await this.copyLocalSrcFiles(popupPath);

      this.outputHTML(root);

      this.manifestFactory.resolvePopup('popup/popup.html');
    }
  }

  private async copyLocalHrefFiles(popupPath: string) {
    await Promise.all(
      Object.keys(this.requestLocalHrefFiles).map(async (href) => {
        const entryPath = path.join(path.dirname(popupPath), href);
        const copiedPath = path.resolve(this.config.chromeOutputDir, 'popup', href);
        fse.copy(entryPath, copiedPath, {
          errorOnExist: false,
          overwrite: true,
        });
      }),
    );
  }

  private async copyLocalSrcFiles(popupPath: string) {
    await Promise.all(
      Object.keys(this.requestLocalSrcFiles).map(async (src) => {
        const entryPath = path.join(path.dirname(popupPath), src);
        const copiedPath = path.resolve(this.config.chromeOutputDir, 'popup', src);
        fse.copy(entryPath, copiedPath, {
          errorOnExist: false,
          overwrite: true,
        });
      }),
    );
  }

  /**
   * Build scripts that loaded in popup html.
   * @param popupPath
   */
  private async buildLocalScripts(popupPath: string) {
    await Promise.all(
      Object.keys(this.requestLocalScripts).map(async (src) => {
        const scriptElem = this.requestLocalScripts[src];

        const entryPath = path.join(path.dirname(popupPath), src);

        await this.buildByJsFilePaths(
          [entryPath],
          (result) => {
            const { metafile } = result;
            if (metafile !== undefined) {
              const outputPathes = Object.keys(metafile.outputs);
              const outputFile = path.basename(path.basename(outputPathes[0]));
              scriptElem.setAttribute('src', outputFile);
            }
          },
          {
            outdir: path.join(this.config.chromeOutputDir!, 'popup'),
            logLevel: 'info',
          },
          [],
        );
      }),
    );
  }

  /**
   * Get Html parser instance.
   * @param htmlPath
   * @returns
   */
  private getParser(htmlPath: string) {
    const content = fse.readFileSync(htmlPath).toString();
    const root = parse(content);

    return root;
  }

  /**
   * Load paths of local script loaded by popup html.
   * @param root
   */
  private loadRequestLocalJsResources(root: HTMLElement) {
    const scriptElems = root.querySelectorAll('script');

    const requestLocalScripts: Record<string, HTMLElement> = {};

    scriptElems.forEach((elem) => {
      const noBundleAttr = elem.getAttribute('no-bundle');

      if (noBundleAttr !== '' && noBundleAttr !== 'true') {
        const src = elem.getAttribute('src');
        if (src !== undefined && src !== null) {
          // Except the script href that start http.
          if (src.match('^http.*') === null) {
            requestLocalScripts[src] = elem;
          }
        }
      }
    });

    this.requestLocalScripts = requestLocalScripts;
  }

  /**
   * Load paths of local file loaded by popup html.
   * @param root
   */
  private loadRequestLocalHrefResources(root: HTMLElement) {
    const hrefElems = root.querySelectorAll('link');

    const requestLocalHrefFiles: Record<string, HTMLElement> = {};

    hrefElems.forEach((elem) => {
      const noBundleAttr = elem.getAttribute('no-bundle');

      if (noBundleAttr !== '' && noBundleAttr !== 'true') {
        const href = elem.getAttribute('href');
        if (href !== undefined && href !== null) {
          // Except the script href that start http.
          if (href.match('^http.*') === null) {
            requestLocalHrefFiles[href] = elem;
          }
        }
      }
    });

    this.requestLocalHrefFiles = requestLocalHrefFiles;
  }

  /**
   * Load paths of local file loaded by popup html.
   * @param root
   */
  private loadRequestLocalSrcResources(root: HTMLElement) {
    const linkElems = root.querySelectorAll('video, img, iframe');

    const requestLocalSrcFiles: Record<string, HTMLElement> = {};

    linkElems.forEach((elem) => {
      const noBundleAttr = elem.getAttribute('no-bundle');

      if (noBundleAttr !== '' && noBundleAttr !== 'true') {
        const rel = elem.getAttribute('src');
        if (rel !== undefined && rel !== null) {
          // Except the script href that start http.
          if (rel.match('^http.*') === null) {
            requestLocalSrcFiles[rel] = elem;
          }
        }
      }
    });

    this.requestLocalSrcFiles = requestLocalSrcFiles;
  }

  /**
   * Output html data in parser instance to dist.
   * @param parserRoot
   */
  private outputHTML(parserRoot: HTMLElement) {
    fse.outputFile(
      path.join(this.config.chromeOutputDir!, 'popup/popup.html'),
      parserRoot.toString(),
    );
  }
}
