const dgram = require('dgram');
const net = require('net');

/**
 * Client Class
 * Collection of data and objects tracked for each "connected" client.
 */
class Client {
  constructor(opts) {
    Object.assign(this, {
      // Timestamp for last time this client had activity
      lastActive: new Date(),
      
      // Client address/port (to be set in `opts`)
      downstreamAddress: null,
      downstreamPort: null,
      
      // Socket to send/receive from client (same as the `server` socket)
      downstreamSocket: null, // ... to be set in `opts`
      
      // Socket to send/receive from X32
      upstreamSocket: dgram.createSocket(
        net.isIPv6(opts.upstreamAddress) ? 'udp6' : 'udp4'
      ),
      
      // Packet Counts
      upstreamPacketCount: 0,
      downstreamPacketCount: 0
      
    }, opts);
  }
  
  /**
   * bindUpstream
   * Create socket with which to communicate with the X32.  Each client needs
   * its own socket on a different port to disambiguate which client the reply
   * packets are being sent to.  (The X32 replies back to the same port from
   * which data was sent.)  Once this socket is listening, we're ready for
   * replies and can proceed with forwarding the original request message
   * upstream.
   */
  bindUpstream() {
    this.bindPromise = this.bindPromise || new Promise((resolve, reject) => {
      this.upstreamSocket.once('error', reject);
      this.upstreamSocket.once('listening', resolve);
      this.upstreamSocket.bind();
    });
    return this.bindPromise;
  }
  
  /**
   * destroy
   * Once we're done with a client (such as when they timeout), let's clean up
   * our upstream socket to the X32.
   */
  destroy() {
    this.upstreamSocket.close();
  }
}

module.exports = Client;