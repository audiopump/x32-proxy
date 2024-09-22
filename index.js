#!/usr/bin/env node

import 'console.table';
import argv from './lib/argv.js';
import net from 'node:net';
import packageInfo from './lib/packageInfo.js';
import UdpServer from './lib/UdpServer.js';
import WsServer from './lib/WsServer.js';
import WwwServer from './lib/WwwServer.js';

function formatAddressPort(address, port) {
  if (net.isIPv6(address)) {
    address = `[${address}]`;
  }
  return `${address}:${port}`;
}

// Console output loop
let outputTimeout;
function output() {
  clearTimeout(outputTimeout);
  console.clear();

  // Header
  console.log(`${packageInfo.name} v${packageInfo.version} -- ${packageInfo.copyright}`);
  console.log(`Target X32: ${formatAddressPort(argv.target, argv.targetPort)}`);

  for (const server of servers) {
    if (server.listening) {
      console.log(`${server.type} Listening: ${formatAddressPort(server.address, server.port)}`);
    }
  }

  console.log(); // Blank line

  // Array of Objects containing string-based client data, for display
  const clientTableData = [...clients.values()].map((client) => {
    return {
      type: client.type,
      address: client.downstreamAddress,
      port: client.downstreamPort,
      'packets-tx': client.upstreamPacketCount.toLocaleString(),
      'packets-rx': client.downstreamPacketCount.toLocaleString()
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

// List of active clients, WS or UDP
const clients = new Set();

// List of servers
const servers = new Set();

for (const [type, constructor, defaultPort] of [
  ['udp', UdpServer, argv.targetPort],
  ['ws', WsServer, 8080],
  ['www', WwwServer, 80]
]) {
  for (const host of argv[type] || []) {
    const url = new URL(`fake-protocol://${host || '127.0.0.1'}`);
    servers.add(
      new constructor({
        target: argv.target,
        targetPort: argv.targetPort,
        port: url.port || defaultPort,
        address: url.hostname
      })
    );
  }
}

for (const server of servers) {
  server.addEventListener('connection', (e) => {
    clients.add(e.detail);

    e.detail.addEventListener('destroy', () => {
      clients.delete(e.detail);
      output();
    }, {once: true});

    output();
  });

  server.addEventListener('listening', output);
}

if (!servers.size) {
  throw new Error('No servers configured.  You must set at least one of --udp, --ws, or --www.  See --help for details.');
}

output();