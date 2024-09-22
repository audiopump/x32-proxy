export default class Server extends EventTarget {
  /**
   * Underlying Node.js socket sever
   * @type { NodeJS.net.Server }
   */
  server;

  get address() {
    return this.server.address().address;
  }

  get port() {
    return this.server.address().port;
  }

  get listening() {
    return this.server.listening;
  }
}