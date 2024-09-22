import argv from './argv.js';
import HttpServerPool from './HttpServerPool.js';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';
import Server from './Server.js';

export default class WwwServer extends Server {
  constructor(opts, ...args) {
    super(opts, ...args);

    this.server = HttpServerPool.getServer(opts.port, opts.address);

    this.server.on('request', (req, res) => {
      const serve = serveStatic(
        argv.wwwRoot,
        {
          index: ['index.html', 'index.htm']
        }
      );
      serve(req, res, finalhandler(req, res));
    });

    this.server.on('listening', () => this.dispatchEvent(new Event('listening')));
    if (this.listening) {
      this.dispatchEvent(new Event('listening'));
    }
  }

  get type() {
    return 'WWW';
  }
}