import http from 'http';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';
import Server from './Server.js';

export default class HttpServer extends Server {
  constructor(opts, ...args) {
    super(opts, ...args);
    const serve = serveStatic('.', { index: ['index.html', 'index.htm'] })
    this.server = http.createServer((req, res) => {
      serve(req, res, finalhandler(req, res))
    })
    this.server.listen(opts.port, opts.address);
  }

  get type() {
    return 'HTTP';
  }
}