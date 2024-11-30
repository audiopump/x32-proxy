import argv from './argv.js';
import { Buffer } from 'node:buffer';
import dgram from 'node:dgram';
import globalSubscriptionPool from './GlobalSubscriptionPool.js';
import net from 'node:net';

/**
 * Client Class
 * Collection of data and objects tracked for each "connected" client.
 */
class Client extends EventTarget {
  constructor(opts) {
    super();

    Object.assign(this, {
      // Timestamp for last time this client had activity
      lastActive: new Date(),

      // Client address/port (to be set in `opts`)
      downstreamAddress: null,
      downstreamPort: null,

      // Socket to send/receive from X32
      upstreamSocket: dgram.createSocket(
        net.isIPv6(opts.upstreamAddress) ? 'udp6' : 'udp4'
      ),

      // Packet Counts
      upstreamPacketCount: 0,
      downstreamPacketCount: 0
    }, opts);

    // Send messages from the X32 back to the client
    this.upstreamSocket.on('message', (data) => {
      this.sendDownstream(data);
    });
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
    this.dispatchEvent(new Event('destroy'));
    this.upstreamSocket?.close();
    this.upstreamSocket = null;
  }

  // Send data back to client
  // NOTE: This method **must** be implemented by subclasses.
  // This parent method just processes the message.  That's it.
  sendDownstream(data) {
    this.lastActive = new Date();
    this.downstreamPacketCount++;

    // Rewrite `/status` packet, as it contains the IP of the X32.
    // Older versions of Behringer's X32-Edit use the IP address in this
    // packet, rather than the IP that the user said they wanted.
    const statusPacketPrefix = new Buffer.from('/status');
    const xinfoPacketPrefix = new Buffer.from('/xinfo');
    if (
      !argv.disableStatusRewrite && (
        // If the packet starts with `/status` or `/xinfo`...
        !statusPacketPrefix.compare(
          data.slice(0, statusPacketPrefix.length)
        ) ||
        !xinfoPacketPrefix.compare(
          data.slice(0, xinfoPacketPrefix.length)
        )
      )
    ) {
      // Parse the `/status` OSC packet into its individual fields by splitting on NULL (0x00)
      const statusPacketFields = data.toString().split('\0').filter(field => field);

      switch (statusPacketFields[0]) {
        // /status ,sss    active  192.0.2.1   X32C-FF-EE-DD
        case '/status':
          statusPacketFields[3] = this.server.address;
          if (argv.name) {
            statusPacketFields[4] = argv.name;
          }
          break;
        // /xinfo  ,ssss   192.0.2.1   X32C-FF-EE-DD   X32C    3.09
        case '/xinfo':
          statusPacketFields[2] = this.server.address;
          if (argv.name) {
            statusPacketFields[3] = argv.name;
          }
          if (argv.model) {
            statusPacketFields[4] = argv.model;
          }
          break;
      }

      // Rebuild OSC message
      data = Buffer.from(statusPacketFields.reduce((data, field) => {
        data += field;
        data += '\0'.repeat(4 - (data.length % 4));
        return data;
      }, ''));
    }

    return data;
  }

  async sendUpstream(data) {
    this.lastActive = new Date();
    this.upstreamPacketCount++;
    await 
      (
        !argv.disableSubscriptionPool &&
        globalSubscriptionPool.sendUpstream(data, this)
      )
      ||
      (async () => {
        await this.bindUpstream();
        this.upstreamSocket.send(data, this.upstreamPort, this.upstreamAddress);
      })();
  }
}

export default Client;