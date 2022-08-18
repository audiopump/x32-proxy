import Client from './Client.js';

class WsClient extends Client {
  constructor(...args) {
    super(...args);
    this.downstreamSocket.on('message', (data) => {
      this.sendUpstream(data);
    });
    this.downstreamSocket.on('close', this.destroy.bind(this));
  }

  get type() {
    return 'WS';
  }

  sendDownstream(data) {
    super.sendDownstream(data);
    this.downstreamSocket.send(data);
  }
}

export default WsClient;