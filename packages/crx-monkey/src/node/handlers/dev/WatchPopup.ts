import { Watch, WatchImplements } from './Watch';
import { BuildContext, BuildOptions, BuildResult, Plugin } from 'esbuild';
import fse, { remove } from 'fs-extra';
import path from 'path';
import consola from 'consola';
import { CrxMonkeyConfig } from '../../types';
import { parse, HTMLElement, Node, NodeType } from 'node-html-parser';

export class WatchPopup extends Watch implements WatchImplements {
  private requestLocalScripts: Record<string, HTMLElement> = {};
  private watchingLocalScripts: Record<string, BuildContext<BuildOptions>> = {};
  private outputFileNameMap: Record<string, string> = {};

  public async watch(): Promise<void> {
    const popupHtml = this.manifest.action?.default_popup;

    if (popupHtml !== undefined) {
      const popupPath = path.join(
        path.dirname(this.config.manifestJsonPath!),
        popupHtml,
      );

      const root = this.getParser(popupHtml);
      this.loadRequestLocalResources(root);
      await this.watchLocalScripts(popupPath, root);
      this.outputHTML(root);

      this.manifestFactory.resolvePopup('popup/popup.html');

      this.watchByCssPaths([popupPath], (filePath) => {
        consola.info(`Popup html updated. | ${filePath}`);

        const root = this.getParser(popupHtml);
        this.loadRequestLocalResources(root);

        const removed = this.removeResourcesCheck();

        removed.forEach((removedFile) => {
          this.watchingLocalScripts[removedFile].dispose();
          delete this.watchingLocalScripts[removedFile];

          consola.start(`Popup script watch is disposed. | ${removedFile}`);
        });

        this.watchLocalScripts(popupPath, root);
        this.outputHTML(root);

        this.reloadServer.reload('RELOAD_POPUP_HTML');
      });
    }
  }

  private async watchLocalScripts(popupPath: string, root: HTMLElement) {
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
                const outputFile = path.basename(
                  path.basename(outputPathes[0]),
                );

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

  private getParser(htmlPath: string) {
    const content = fse.readFileSync(htmlPath).toString();
    const root = parse(content);

    return root;
  }

  private loadRequestLocalResources(root: HTMLElement) {
    const scriptElems = root.querySelectorAll('script');

    const requestLocalScripts: Record<string, HTMLElement> = {};

    scriptElems.forEach((elem) => {
      const src = elem.getAttribute('src');
      if (src !== undefined && src !== null) {
        if (src.match('^http.*') === null) {
          requestLocalScripts[src] = elem;
        }
      }
    });

    this.requestLocalScripts = requestLocalScripts;
  }

  private watchJsOnBuild(
    result: BuildResult<BuildOptions>,
    jsFilePath: string,
  ) {
    this.reloadServer.reload('RELOAD_POPUP_JS');
    consola.info(`Popup script updated. | ${jsFilePath}`);
  }

  private outputHTML(parserRoot: HTMLElement) {
    fse.outputFile(
      path.join(this.config.chromeOutputDir!, 'popup/popup.html'),
      parserRoot.toString(),
    );
  }

  private removeResourcesCheck() {
    const removedResources: string[] = [];

    Object.keys(this.watchingLocalScripts).forEach((watchingLocalScript) => {
      if (
        !Object.keys(this.requestLocalScripts).includes(watchingLocalScript)
      ) {
        removedResources.push(watchingLocalScript);
      }
    });

    return removedResources;
  }
}
