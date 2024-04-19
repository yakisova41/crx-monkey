import { WebSocketServer } from 'ws';

/**
 * The websocket server of manage auto reload.
 */
export class ReloadServer {
  private readonly wserver: WebSocketServer;
  private readonly host: string;
  private readonly port: number;

  /**
   * Start and setup server.
   * @param host
   * @param port
   */
  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
    this.wserver = new WebSocketServer({
      port,
      host,
    });

    this.setup();
  }

  /**
   * Send reload signal to websocket client.
   * @param token
   */
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

export type ReloadTokens =
  | 'RELOAD_CONTENT_SCRIPT'
  | 'RELOAD_CSS'
  | 'RELOAD_SW'
  | 'RELOAD_POPUP_JS'
  | 'RELOAD_POPUP_HTML';
export type ReloadServerTokens = ReloadTokens | 'CONNECTED';
