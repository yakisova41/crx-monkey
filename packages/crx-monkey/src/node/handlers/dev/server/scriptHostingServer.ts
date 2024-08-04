import express from 'express';
import { getConfig } from 'src/node/config';
import path from 'path';
import fse from 'fs-extra';
import * as http from 'http';
import consola from 'consola';

/**
 * The server of send to script code.
 */
export class ScriptHostingServer {
  private readonly app: express.Express;
  private readonly host: string;
  private readonly port: number;
  private server: null | http.Server = null;

  constructor(host: string, port: number) {
    this.app = express();
    this.host = host;
    this.port = port;
  }

  /**
   * Start server.
   * @returns
   */
  public async start() {
    this.setup();
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, this.host, () => {
        resolve(1);
      });
    });
  }

  public async dispose() {
    if (this.server === null) {
      throw consola.error(new Error('Dispose can be used after Watch is started'));
    }

    this.server.close();
  }

  private setup() {
    const config = getConfig();

    this.app.get('/', (req, res) => {
      res.send('<h1>Crx monkey file hosting server</h1>');
    });

    this.app.get('/userscript', (req, res) => {
      let filepath = config.userscriptOutput;
      if (!path.isAbsolute(config.userscriptOutput)) {
        filepath = path.join(path.dirname(config.manifestPath), config.userscriptOutput);
      }

      if (fse.existsSync(filepath)) {
        res.sendFile(filepath);
      } else {
        res.send(400);
      }
    });

    this.app.get('/dev.user.js', (req, res) => {
      const filepath = path.join(path.dirname(config.userscriptOutput), 'crx-monkey-dev.user.js');

      if (fse.existsSync(filepath)) {
        res.sendFile(filepath);
      } else {
        res.send(400);
      }
    });
  }
}
