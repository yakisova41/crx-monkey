import { Watch, WatchImplements } from './Watch';
import { BuildContext, BuildOptions, BuildResult } from 'esbuild';
import fse from 'fs-extra';
import path from 'path';
import consola from 'consola';
import { parse, HTMLElement } from 'node-html-parser';
import { FSWatcher } from 'chokidar';
import { getConfig } from 'src/node/config';

export class WatchPopup extends Watch implements WatchImplements {
  private requestLocalScripts: Record<string, HTMLElement> = {};
  private requestLocalHrefFiles: Record<string, HTMLElement> = {};
  private requestLocalSrcFiles: Record<string, HTMLElement> = {};

  private watchingLocalScripts: Record<string, BuildContext<BuildOptions>> = {};
  private watchingLocalHrefFiles: Record<string, FSWatcher> = {};
  private watchingLocalSrcFiles: Record<string, FSWatcher> = {};

  private outputFileNameMap: Record<string, string> = {};

  private popupHtmlWacher: FSWatcher | null = null;

  private isWatched = false;

  public async dispose() {
    if (this.popupHtmlWacher === null) {
      throw consola.error(new Error('Dispose can be used after Watch is started'));
    }

    /**
     * Dispose contexts of local scripts
     */
    Promise.all(
      Object.keys(this.watchingLocalScripts).map(async (localScriptsKey) => {
        const watchingLocalScript = this.watchingLocalScripts[localScriptsKey];
        await watchingLocalScript.dispose();
      }),
    );

    /**
     * Dispose watcher of LocalHrefFiles
     */
    Promise.all(
      Object.keys(this.watchingLocalHrefFiles).map(async (watchingLocalHrefFilesKey) => {
        const watchingLocalHrefFile = this.watchingLocalHrefFiles[watchingLocalHrefFilesKey];
        await watchingLocalHrefFile.close();
      }),
    );

    /**
     * Dispose watcher of LocalSrcFiles
     */
    Promise.all(
      Object.keys(this.watchingLocalSrcFiles).map(async (watchingLocalSrcFilesKey) => {
        const watchingLocalSrcFile = this.watchingLocalSrcFiles[watchingLocalSrcFilesKey];
        await watchingLocalSrcFile.close();
      }),
    );

    this.popupHtmlWacher.close();
  }

  public async watch(): Promise<void> {
    const popupHtml = this.manifest.action?.default_popup;

    if (popupHtml !== undefined) {
      const popupPath = path.join(path.dirname(this.config.manifestPath!), popupHtml);

      const root = this.getParser(popupHtml);

      this.loadRequestLocalJsResources(root);
      this.loadRequestLocalHrefResources(root);
      this.loadRequestLocalSrcResources(root);

      await this.watchLocalHrefFiles(popupPath);
      await this.watchLocalScripts(popupPath);
      await this.watchLocalSrcFiles(popupHtml);

      this.outputHTML(root);

      this.manifestFactory.resolvePopup('popup/popup.html');

      this.popupHtmlWacher = this.watchFiles([popupPath], (filePath) => {
        consola.info(`Popup html updated. | ${filePath}`);

        const root = this.getParser(popupHtml);
        this.loadRequestLocalJsResources(root);
        this.loadRequestLocalHrefResources(root);
        this.loadRequestLocalSrcResources(root);

        /**
         * Dispose watch of removed file.
         */
        this.removeResourcesCheck();
        /*
        removed.forEach((removedFile) => {
          this.watchingLocalScripts[removedFile].dispose();
          delete this.watchingLocalScripts[removedFile];

          consola.start(`Popup script watch is disposed. | ${removedFile}`);
        });*/

        this.watchLocalScripts(popupPath);
        this.watchLocalHrefFiles(popupPath);
        this.watchLocalSrcFiles(popupHtml);

        this.outputHTML(root);

        this.reloadServer.reload('RELOAD_POPUP_HTML');
      });
    }
  }

  private async watchLocalHrefFiles(popupPath: string) {
    await Promise.all(
      Object.keys(this.requestLocalHrefFiles).map(async (href) => {
        // const hrefElem = this.requestLocalHrefFiles[href];

        if (!Object.keys(this.watchingLocalHrefFiles).includes(href)) {
          consola.start(`Popup resource watch is started. | ${href}`);
          const entryPath = path.join(path.dirname(popupPath), href);
          const copiedPath = path.resolve(this.config.chromeOutputDir, 'popup', href);
          this.outputFileNameMap[href] = copiedPath;

          fse.copy(entryPath, copiedPath, {
            errorOnExist: false,
            overwrite: true,
          });

          this.watchingLocalHrefFiles[href] = this.watchFiles([entryPath], () => {
            fse.copy(entryPath, copiedPath);
            this.watchFileOnChange(href);
          });
        }

        //hrefElem.setAttribute('href', this.outputFileNameMap[href]);
      }),
    );
  }

  private async watchLocalSrcFiles(popupPath: string) {
    await Promise.all(
      Object.keys(this.requestLocalSrcFiles).map(async (src) => {
        if (!Object.keys(this.watchingLocalSrcFiles).includes(src)) {
          consola.start(`Popup resource watch is started. | ${src}`);
          const entryPath = path.join(path.dirname(popupPath), src);
          const copiedPath = path.resolve(this.config.chromeOutputDir, 'popup', src);
          this.outputFileNameMap[src] = copiedPath;

          fse.copy(entryPath, copiedPath, {
            errorOnExist: false,
            overwrite: true,
          });

          this.watchingLocalSrcFiles[src] = this.watchFiles([entryPath], () => {
            fse.copy(entryPath, copiedPath);
            this.watchFileOnChange(src);
          });
        }
      }),
    );
  }

  /**
   * Watch scripts that loaded in popup html.
   * @param popupPath
   */
  private async watchLocalScripts(popupPath: string) {
    await Promise.all(
      Object.keys(this.requestLocalScripts).map(async (src) => {
        const scriptElem = this.requestLocalScripts[src];

        if (!Object.keys(this.watchingLocalScripts).includes(src)) {
          consola.start(`Popup script watch is started. | ${src}`);

          const entryPath = path.join(path.dirname(popupPath), src);

          const buildContexts = await this.watchByJsFilePaths(
            [entryPath],
            (...args) => {
              this.watchJsOnBuild(...args);
            },
            {
              outdir: path.join(this.config.chromeOutputDir!, 'popup'),
            },
            (result) => {
              const { metafile } = result;
              if (metafile !== undefined) {
                const outputPathes = Object.keys(metafile.outputs);
                const outputFile = path.basename(path.basename(outputPathes[0]));

                this.outputFileNameMap[src] = outputFile;
              }
            },
          );

          const thisContext = buildContexts[entryPath];
          this.watchingLocalScripts[src] = thisContext;
        }

        scriptElem.setAttribute('src', this.outputFileNameMap[src]);
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

  private watchJsOnBuild(result: BuildResult<BuildOptions>, jsFilePath: string) {
    this.reloadServer.reload('RELOAD_POPUP_JS');

    if (!this.isWatched) {
      this.isWatched = true;
    } else {
      consola.info(`Popup script updated. | ${jsFilePath}`);
    }
  }

  private watchFileOnChange(filePath: string) {
    this.reloadServer.reload('RELOAD_POPUP_HTML');

    consola.info(`Popup script updated. | ${filePath}`);
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

  /**
   * Check to removed resouces.
   * @returns
   */
  private removeResourcesCheck() {
    const { chromeOutputDir } = getConfig();
    const removedResources: string[] = [];

    Object.keys(this.watchingLocalScripts).forEach((watchingLocalScript) => {
      if (!Object.keys(this.requestLocalScripts).includes(watchingLocalScript)) {
        this.watchingLocalScripts[watchingLocalScript].dispose();
        fse.remove(path.resolve(chromeOutputDir, this.outputFileNameMap[watchingLocalScript]));
        delete this.watchingLocalScripts[watchingLocalScript];

        consola.start(`Popup script watch is disposed. | ${watchingLocalScript}`);
      }
    });

    Object.keys(this.watchingLocalHrefFiles).forEach((watchingLocalHrefFile) => {
      if (!Object.keys(this.requestLocalHrefFiles).includes(watchingLocalHrefFile)) {
        this.watchingLocalHrefFiles[watchingLocalHrefFile].close();
        fse.remove(path.resolve(chromeOutputDir, this.outputFileNameMap[watchingLocalHrefFile]));
        delete this.watchingLocalHrefFiles[watchingLocalHrefFile];

        consola.start(`Popup resource watch is disposed. | ${watchingLocalHrefFile}`);
      }
    });

    Object.keys(this.watchingLocalSrcFiles).forEach((watchingLocalSrcFile) => {
      if (!Object.keys(this.requestLocalSrcFiles).includes(watchingLocalSrcFile)) {
        this.watchingLocalSrcFiles[watchingLocalSrcFile].close();
        fse.remove(path.resolve(chromeOutputDir, this.outputFileNameMap[watchingLocalSrcFile]));
        delete this.watchingLocalSrcFiles[watchingLocalSrcFile];

        consola.start(`Popup resource watch is disposed. | ${watchingLocalSrcFile}`);
      }
    });

    return removedResources;
  }
}
