import CustomEvent from './CustomEvent.js';
import dgram from 'node:dgram';
import net from 'node:net';
import Server from './Server.js';
import UdpClient from './UdpClient.js';

export default class UdpServer extends Server {
  constructor(opts, ...args) {
    super(opts, ...args);

    this.clients = new Map();

    this.server = dgram.createSocket(
      net.isIPv6(opts.address) ? 'udp6' : 'udp4'
    );

    this.server.on('error', (err) => {
      console.error('Error with upstream socket.', err);
      this.server.close();
      process.exit(1); // TODO: Move to outer scripts
    });

    // When receiving a message from a client...
    this.server.on('message', (msg, clientRemoteInfo) => {
      const key = `${clientRemoteInfo.address}~${clientRemoteInfo.port}`;

      let client;
      client = this.clients.get(key); // Check for existing client

      if (!client) {
        // Instantiate a new Client
        client = new UdpClient({
          downstreamAddress: clientRemoteInfo.address,
          downstreamPort: clientRemoteInfo.port,
          downstreamSocket: this.server,
          server: this,
          upstreamAddress: opts.target,
          upstreamPort: opts.targetPort
        });

        // Cache the new Client for future use
        this.clients.set(key, client);

        client.addEventListener('destroy', () => {
          this.clients.delete(key);
        }, {once: true});

        this.dispatchEvent(new CustomEvent('connection', {
          detail: client
        }));
      }

      client.sendUpstream(msg);
    });

    // Start listening for packets.  When ready, start the output loop.
    this.server.bind(opts.port, opts.address, () => {
      this.dispatchEvent(new Event('listening'));
    }); 
  }

  // For UDP servers, the only way to determine if they're currently bound is
  // to check to see if there is a bound address.  The `.address()` function
  // throws an error if it isn't bound yet.
  get listening() {
    try {
      this.server.address();
      return true;
    } catch(e) {
      // Do nothing
    }

    return false;
  }

  get type() {
    return 'UDP';
  }
}