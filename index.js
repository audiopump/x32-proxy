#!/usr/bin/env node

import 'console.table';
import argv from './lib/argv.js';
import Client from './lib/Client.js';
import dgram from 'node:dgram';
import net from 'node:net';
import packageInfo from './lib/packageInfo.js';

function formatAddressPort(address, port) {
  if (net.isIPv6(address)) {
    address = '[' + address + ']';
  }
  return address + ':' + port;
}

// Console output loop
let outputTimeout;
function output() {
  clearTimeout(outputTimeout);
  console.clear();

  // Header
  console.log(`${packageInfo.name} v${packageInfo.version} -- ${packageInfo.copyright}`);
  console.log(`Upstream X32: ${formatAddressPort(upstreamAddress, argv.upstreamPort)}`);
  console.log(`Listening: ${formatAddressPort(server.address().address, server.address().port)}`);
  console.log();

  // Array of Objects containing string-based client data, for display
  const clientTableData = [...clients.entries()].map(([clientKey, client]) => {
    return {
      type: 'UDP',
      address: client.downstreamAddress,
      port: client.downstreamPort,
      'packets-rx': client.downstreamPacketCount.toLocaleString(),
      'packets-tx': client.upstreamPacketCount.toLocaleString(),
    }
  });

  // If no clients, say so
  if (!clientTableData.length) {
    console.log('No connected clients');
  }

  // Output table of clients
  console.table('Clients', clientTableData);

  outputTimeout = setTimeout(output, 1000);
}

// Non-flagged arguments
const bindAddress = argv._[0];
const upstreamAddress = argv._[1];

if (bindAddress === undefined || upstreamAddress === undefined) {
  process.exit(1);
}

// List of clients who have sent packets through recently
// We track sockets for each one, so the X32 knows what port to reply to.
const clients = new Map();

// Socket for inbound packets
const server = dgram.createSocket(
  net.isIPv6(bindAddress) ? 'udp6' : 'udp4'
);

server.on('error', (err) => {
  console.error('Error with upstream socket.', err);
  server.close();
  process.exit(1);
});

// When receiving a message from a client...
server.on('message', (msg, clientRemoteInfo) => {
  const key = formatAddressPort(clientRemoteInfo.address, clientRemoteInfo.port);

  let client;
  client = clients.get(key); // Check for existing client

  if (!client) {
    // Instantiate a new Client
    client = new Client({
      downstreamAddress: clientRemoteInfo.address,
      downstreamPort: clientRemoteInfo.port,
      downstreamSocket: server,
      upstreamAddress: upstreamAddress
    });

    // Cache the new Client for future use
    clients.set(key, client);

    output(); // Force immediate update of clients table on-screen

    // Send messages from the X32 back to the client
    client.upstreamSocket.on('message', (msg) => {
      client.upstreamPacketCount++;
      client.lastActive = new Date();

      // Rewrite `/status` packet, as it contains the IP of the X32.
      // Older versions of Behringer's X32-Edit use the IP address in this
      // packet, rather than the IP that the user said they wanted.
      const statusPacketPrefix = new Buffer.from('/status');
      const xinfoPacketPrefix = new Buffer.from('/xinfo');
      if (
        !argv['disable-status-rewrite'] && (
          // If the packet starts with `/status` or `/xinfo`...
          !statusPacketPrefix.compare(
            msg.slice(0, statusPacketPrefix.length)
          ) ||
          !xinfoPacketPrefix.compare(
            msg.slice(0, xinfoPacketPrefix.length)
          )
        )
      ) {
        // Parse the `/status` OSC packet into its individual fields by splitting on NULL (0x00)
        const statusPacketFields = msg.toString().split('\0').filter(field => field);

        switch (statusPacketFields[0]) {
          // /status ,sss    active  192.0.2.1   X32C-FF-EE-DD
          case '/status':
            statusPacketFields[3] = bindAddress;
            if (argv.name) {
              statusPacketFields[4] = argv.name;
            }
            break;
          // /xinfo  ,ssss   192.0.2.1   X32C-FF-EE-DD   X32C    3.09
          case '/xinfo':
            statusPacketFields[2] = bindAddress;
            if (argv.name) {
              statusPacketFields[3] = argv.name;
            }
            break;
        }

        // Rebuild OSC message
        msg = Buffer.from(statusPacketFields.reduce((msg, field) => {
          msg += field;
          msg += '\0'.repeat(4 - (msg.length % 4));
          return msg;
        }, ''));
      }

      // Proxy message to client
      client.downstreamSocket.send(
        msg,
        client.downstreamPort,
        client.downstreamAddress
      );
    });
  }

  client.downstreamPacketCount++;
  client.lastActive = new Date();

  // Ensure we have a socket bound, and then send the data
  client.bindUpstream().then(() => {
    client.upstreamSocket.send(msg, argv['upstream-port'], upstreamAddress);
  });
});

// Start listening for packets.  When ready, start the output loop.
server.bind(argv['bind-port'], bindAddress, output);

// Prune old clients
setInterval(() => {
  let clientsPruned = false;
  clients.forEach((client, clientKey) => {
    // Prune stale/inactive clients
    if ((new Date() - client.lastActive) > argv['client-timeout']) {
      client.destroy();
      clients.delete(clientKey);
      clientsPruned = true;
      return;
    }
  });
  
  if (clientsPruned) {
    output(); // Force immediate update of clients table on-screen
  }
}, Math.min(argv['client-timeout'] / 5, 1000));