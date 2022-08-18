import argv from './argv.js';
import Client from './Client.js';

class UdpClient extends Client {
  constructor(...args) {
    super(...args);
    this.resetTimeout();
  }

  resetTimeout() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(this.destroy.bind(this), argv.udpClientTimeout);
  }

  get type() {
    return 'UDP';
  }

  sendUpstream(...args) {
    this.resetTimeout();
    return super.sendUpstream(...args);
  }

  sendDownstream(data) {
    this.resetTimeout();
    data = super.sendDownstream(data);
    this.downstreamSocket.send(data, this.downstreamPort, this.downstreamAddress);
  }
}

export default UdpClient;