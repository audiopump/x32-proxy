import http from 'http';

export default class HttpServerPool {
  static #pool = new Map();

  static getServer(port, address) {
    const key = `${port}:${address}`;

    return (
      // Use existing HTTP server instance
      this.#pool.get(key) ||

      // Create and cache a new HTTP server instance
      this.#pool.set(key, (() => {
        const server = http.createServer();

        server.on('clientError', (e, socket) => {
          console.error(`HTTP client error:`, e);
          socket.destroy();
        });

        setTimeout(() => server.listen(port, address));

        return server;

      })()).get(key)
    );
  }
}