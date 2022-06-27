import yargs from 'yargs';

const argv = yargs(process.argv.slice(2))
  .usage('$0 [options] <local bind address> <X32 console address>')
  .scriptName('x32-proxy')
  .options({
    'bind-port': {
      default: 10023,
      describe: 'Port on which to listen for remote connections',
      number: true
    },
    'client-timeout': {
      default: 5000,
      describe: 'Number of milliseconds of inactivity, before assuming a client is no longer connected',
      number: true
    },
    'disable-status-rewrite': {
      default: false,
      boolean: true,
      describe: 'By default, the proxy will rewrite the upstream console address in \`/status\` and \`/xinfo\` packets.  This flag disables that functionality.'
    },
    'name': {
      default: null,
      describe: 'Name of the X32 to send to clients.  If left unset, the upstream name will be used.  Status rewrite must be enabled for this option to work.'
    },
    'upstream-port': {
      default: 10023,
      describe: 'Port on which to connect to the upstream X32 console',
      number: true
    }
  })
  .help()
  .argv;

console.log(argv);

export default argv;