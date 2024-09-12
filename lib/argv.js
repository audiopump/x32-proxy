import yargs from 'yargs';

const argv = yargs(process.argv.slice(2))
  .usage('$0 [options]')
  .scriptName('x32-proxy')
  .options({
    // UDP OSC server config
    udp: {
      array: true,
      type: 'string',
      description: 'Enables the UDP OSC server, and optionally specify a bind address and/or port'
    },
    'udp-client-timeout': {
      default: 5000,
      type: 'number',
      description: 'Number of milliseconds of inactivity before assuming a client is no longer connected'
    },

    // WebSocket server config
    ws: {
      array: true,
      type: 'string',
      description: 'Enable the Web Socket server, and optionally specify a bind address and/or port'
    },

    // HTTP server config
    http: {
      array: true,
      type: 'string',
      description: 'Enable the HTTP server, and optionally specify a bind address and/or port'
    },

    // Target config
    target: {
      type: 'string',
      required: true,
      description: 'Address and (optional) port of the upstream X32 mixer to proxy to'
    },

    // Status message rewrite config
    name: {
      default: null,
      description: 'Name of the X32 to send to clients.  If left unset, the target mixer\'s name will be used.  Status rewrite must be enabled for this option to work.'
    },
    model: {
      default: null,
      description: 'Make the mixer appear as if it is a different model than what it is.  Status rewrite must be enabled for this option to work.'
    },
    'disable-status-rewrite': {
      default: false,
      type: 'boolean',
      description: 'By default, the proxy will rewrite the upstream console address in \`/status\` and \`/xinfo\` packets.  This flag disables that functionality.'
    },

    // Subscription Pool (to reduce traffic to the mixer when many clients are in use)
    'disable-subscription-pool': {
      default: false,
      type: 'boolean',
      description: 'By default, meter and remote updates will be pooled into a single connection, to reduce load on the X32.  You can disable it with this flag.'
    }
  })
  .help()
  .argv;

// Add missing `null` values for array params --ws, --udp, and --http.
// (Yargs normally filters these out from the array.  However, we actually
// *want* these parameters, because no value for --ws, --udp, or --http signifies
// that the proxy server should use the default address and port.)
for (const [index, arg] of process.argv.entries()) {
  switch (arg) {
    case '--ws':
    case '--udp':
    case '--http': {
      if (!process.argv[index + 1] || process.argv[index + 1].startsWith('-')) {
        argv[arg.replace(/^--/, '')].push(null);
      }
      break;
    }
  }
}

// Split the target host:port into a separate hostname and port
[argv.target, argv.targetPort] = (() => {
  const url = new URL(`fake-protocol://${argv.target}`);
  return [
    url.hostname,
    url.port || 10023
  ]
})();

export default argv;