import { Build, BuildImplements } from './Build';
import fse from 'fs-extra';
import path from 'path';
import { parse, HTMLElement } from 'node-html-parser';

export class BuildPopup extends Build implements BuildImplements {
  private requestLocalScripts: Record<string, HTMLElement> = {};

  public async build(): Promise<void> {
    const popupHtml = this.manifest.action?.default_popup;

    if (popupHtml !== undefined) {
      const popupPath = path.join(
        path.dirname(this.config.manifestJsonPath!),
        popupHtml,
      );

      const root = this.getParser(popupHtml);
      this.loadRequestLocalResources(root);
      await this.buildLocalScripts(popupPath);
      this.outputHTML(root);

      this.manifestFactory.resolvePopup('popup/popup.html');
    }
  }

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

  private outputHTML(parserRoot: HTMLElement) {
    fse.outputFile(
      path.join(this.config.chromeOutputDir!, 'popup/popup.html'),
      parserRoot.toString(),
    );
  }
}
