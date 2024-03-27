import express from 'express';
import { getConfig } from 'src/node/config';
import path from 'path';

export class ScriptHostingServer {
  private readonly app: express.Express;
  private readonly host: string;
  private readonly port: number;

  constructor(host: string, port: number) {
    this.app = express();
    this.host = host;
    this.port = port;
  }

  public async start() {
    this.setup();
    return new Promise((resolve) => {
      this.app.listen(this.port, this.host, () => {
        resolve(1);
      });
    });
  }

  private setup() {
    const config = getConfig();

    this.app.get('/', (req, res) => {
      res.send('<h1>Crx monkey file hosting server</h1>');
    });

    this.app.get('/userscript', (req, res) => {
      if (config.userscriptOutput !== undefined) {
        res.sendFile(config.userscriptOutput);
      } else {
        res.send(400);
      }
    });

    this.app.get('/dev.user.js', (req, res) => {
      if (config.userscriptOutput !== undefined) {
        const userscriptDir = path.dirname(config.userscriptOutput);
        res.sendFile(path.join(userscriptDir, 'crx-monkey-dev.user.js'));
      } else {
        res.send(400);
      }
    });
  }
}
