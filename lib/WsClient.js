import Client from './Client.js';

class WsClient extends Client {
  constructor(...args) {
    super(...args);
    this.downstreamSocket.on('message', (data) => {
      this.sendUpstream(data);
    });
    this.downstreamSocket.on('close', this.destroy.bind(this));
    this.downstreamSocket.on('error', (err) => {
      // Prevent crash on error
      // TODO: Log error?
      this.destroy();
    });
  }

  get type() {
    return 'WS';
  }

  sendDownstream(data) {
    super.sendDownstream(data);
    this.downstreamSocket.send(data, (err) => {
      if (err) {
        // TODO: Log error?
        // console.error(err);
      }
    });
  }
}

export default WsClient;