import CustomEvent from './CustomEvent.js';
import HttpServerPool from './HttpServerPool.js';
import Server from './Server.js';
import { WebSocketServer } from 'ws';
import WsClient from './WsClient.js';


export default class WsServer extends Server {
  constructor(opts, ...args) {
    super(opts, ...args);

    this.server = HttpServerPool.getServer(opts.port, opts.address);

    this.wss = new WebSocketServer({
      server: this.server
    });

    this.wss.on('connection', (stream, req) => {
      const client = new WsClient({
        downstreamAddress: req.socket.remoteAddress,
        downstreamPort: req.socket.remotePort,
        downstreamSocket: stream,
        server: this,
        upstreamAddress: opts.target,
        upstreamPort: opts.targetPort
      });

      this.dispatchEvent(new CustomEvent('connection', {
        detail: client
      }));

      // TODO: Track client?
    });

    this.server.on('listening', () => this.dispatchEvent(new Event('listening')));
    if (this.listening) {
      this.dispatchEvent(new Event('listening'));
    }
  }

  get type() {
    return 'WS';
  }
}