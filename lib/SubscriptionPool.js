import argv from './argv.js';
import dgram from 'node:dgram';
import net from 'node:net';

const whitelist = new Set([
  '/xremote~~~~,~~~',
  '/meters~,s~~/meters/1~~~',
  '/meters~,s~~/meters/2~~~',
  '/meters~,s~~/meters/3~~~',
  '/meters~,s~~/meters/4~~~',
  '/meters~,s~~/meters/5~~~',
  '/meters~,s~~/meters/6~~~',
  '/meters~,s~~/meters/7~~~',
  '/meters~,s~~/meters/8~~~',
  '/meters~,s~~/meters/9~~~',
  '/meters~,s~~/meters/10~~',
  '/meters~,s~~/meters/11~~',
  '/meters~,s~~/meters/12~~',
  '/meters~,s~~/meters/13~~',
  '/meters~,s~~/meters/14~~',
  '/meters~,s~~/meters/15~~',
  '/meters~,s~~/meters/16~~',
].map(s => s.replace(/~/g, '\0')));

export default class SubscriptionPool {
  constructor() {
    this.pool = new Map();
  }

  async sendUpstream(data, client) {
    const key = data.toString();
    if (!whitelist.has(key)) {
      return false;
    }

    if (!this.pool.has(key)) {
      const clients = new Set();
      this.pool.set(key, {
        clients,
        socketPromise: new Promise((resolve, reject) => {
          const socket = dgram.createSocket(
            net.isIPv6(argv.target) ? 'udp6' : 'udp4'
          );
          socket.once('error', reject);
          socket.once('listening', resolve.bind(this, socket));
          socket.on('message', (data) => {
            for (const client of clients) {
              client.sendDownstream(data);
            }
          });
          socket.bind();
        })
      });
    }

    const {socketPromise, clients} = this.pool.get(key);
    const socket = await socketPromise;

    if (!clients.has(client)) {
      clients.add(client);
      client.addEventListener('destroy', () => {
        clients.delete(client);
        if (!clients.size) { // No more clients subscribed?  Clean up...
          socket.close();
          this.pool.delete(key);
        }
      }, {once: true});
    }

    socket.send(data, argv.targetPort, argv.target);
    return true;
  }
}