import { WebSocketServer } from 'ws';

export class ReloadServer {
  private readonly wserver: WebSocketServer;
  private readonly host: string;
  private readonly port: number;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
    this.wserver = new WebSocketServer({
      port,
      host,
    });

    this.setup();
  }

  public reload(token: ReloadTokens) {
    this.wserver.clients.forEach((client) => {
      client.send(token);
    });
  }

  private setup() {
    this.wserver.on('connection', (socket) => {
      const data: ReloadServerTokens = 'CONNECTED';
      socket.send(data);
    });
  }
}

export type ReloadTokens = 'RELOAD_CONTENT_SCRIPT' | 'RELOAD_CSS' | 'RELOAD_SW';
export type ReloadServerTokens = ReloadTokens | 'CONNECTED';
