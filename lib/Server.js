export default class Server extends EventTarget {
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