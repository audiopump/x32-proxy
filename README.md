x32-proxy
--------

*UDP and Web Socket proxy server for Behringer and Midas digital mixer control.*

Use cases:

 - Use your mixers over a VPN.
 - Connect over IPv6.
 - Use Web Sockets to control mixers from a web application.

Compatible mixers include:

 - **X32/M32 Series**<br/>X32 Core, X32 Rack, X32 Producer, X32 Compact, X32, M32C, M32R, M32R Live, M32 Live
 - **X-Air/MR Series**<br/>XR12, XR16, XR18, X18, MR18, MR12

# Installation

1. Install [Node.js for your platform](https://nodejs.org/en/download/).

2. Install x32-proxy via NPM.  (It is recommended you install x32-proxy globally, as this is a CLI.)

```
npm install -g x32-proxy
```

# Usage

To start a simple proxy server:

```
x32-proxy --udp <local bind address> --target <mixer address>
```

For example, suppose your X32/M32 mixer has an IP address of `192.0.2.20`.  Also suppose your PC is on the `192.0.2.0/24` LAN with the mixer, as well as on a VPN with the address of `203.0.113.10`.  You would like to share access to the mixer with everyone on the VPN.  To do that, you bind the proxy to the VPN, and specify the mixer's address on your LAN:

```
x32-proxy --udp 203.0.113.10 --target 192.0.2.20
```

Once running, VPN users should be able to access the mixer using their normal X32/M32 OSC clients (such as X32 Edit) on `203.0.113.10`.


## Options

### `--target <address[:port]>` (required)

Specifies the address of the mixer to connect to.  Port defaults to `10023`, which is used for the X32/M32 series mixers.  If you are using the XR/MR series mixers, you should specify port `10024`.

### `--udp [bind address[:port]]`

Start a UDP server, compatible with standard tools such as X32 Edit and X-Air Edit.

It is recommended that you specify an IP address to bind to.  Otherwise `127.0.0.1` will be used.  You should **not** use `0.0.0.0` to listen on all interfaces, as this setting would be incompatible with Behringer/Midas software.  (The bind address is used in status messages when initially connecting, and therefore has to be an address reachable by X32 Edit or X-Air Edit.)

The port will default to match the target port (`10023` for X32 series, or `10024` for X-Air series), but you may want to change it for special use cases.

You may specify `--udp` multiple times to listen on multiple interfaces and/or ports.

### `--ws [bind address[:port]]`

Start a Web Socket server, for use from web applications.

As with `--udp`, the default bind address is `127.0.0.1`.  Unlike `--udp`, you **may** use `0.0.0.0` or `[::]` to listen on all IPv4 or IPv4/IPv6 interfaces, respectively.

The default port is `8080`.

Web clients can connect as follows:

```javascript
const ws = new WebSocket('http://127.0.0.1:8080/');
ws.binaryType = 'arraybuffer';

ws.addEventListener('open', (() => {
  // Send /xinfo~~,~~~
  ws.send(new Uint8Array([47, 120, 105, 110, 102, 111, 0, 0, 44, 0, 0, 0]).buffer);
}), {once: true});

ws.addEventListener('message', (e) => {
  console.log(e.data);
});
```

You may specify `--ws` multiple times to listen on multiple interfaces and/or ports.

### `--http [bind address[:port]]`

Start a minimal HTTP server, to host a web application. Will serve files from the current directory. See [serve-static](https://www.npmjs.com/package/serve-static) for details.

As with `--udp`, the default bind address is `127.0.0.1`.  Unlike `--udp`, you **may** use `0.0.0.0` or `[::]` to listen on all IPv4 or IPv4/IPv6 interfaces, respectively.

The default port is `8088`.

### `--help`
Shows all the options and usage.

### `--name <name>`
You may want to rewrite the display name of the upstream mixer for clients to display in their setup dialog.  This option allows specifying the name.  (Requires status rewrite to be left enabled.)

## Advanced Options

### `--disable-status-rewrite`
By default, the proxy will rewrite the upstream console address in `/status` and `/xinfo` packets.  This flag disables that functionality.  (Conflicts with `--name` and `--model` options.)

### `--disable-subscription-pool`
The proxy will combine requests for `/xremote` and `/meter` subscriptions, when possible.  This will reduce load on the mixer, enabling more simultaneous clients.  You can disable this feature with this flag.

### `--model`
You can rewrite the model name of your mixer with this option.  It might be useful to make newer mixer variants work with legacy software.  For example, you may have a newer model `XR18V2` mixer that you need to appear as a regular `XR18` for compatibility.

### `--udp-client-timeout <timeout in ms>`
If the proxy hasn't heard from the client in awhile (5 seconds by default), it will remove them from the list of active clients and will close the socket that the X32 would normally respond on.  You can adjust this timeout if you wish.  There should be no practical reason to change this.  If a client is assumed inactive, its upstream socket is closed.  A new one will be reopened immediately if a new packet is received from the client.

## Example: IPv6 VPN with stock X32 Edit
Unfortunately, the mixers don't support IPv6, and [probably never will](https://community.musictribe.com/discussions/89151/166716/ipv6-support-for-osc-control).  Even more unfortunate is that the standard X32 Edit/X-Air Edit applications are hardcoded to only use IPv4 addresses.  They doesn't even support hostnames.  What are you to do if you must access your mixer over an IPv6-only VPN?  You can run this proxy utility on two sides of it.

Example Address:

 - X32 LAN: `192.0.2.1`
 - PC1 LAN: `192.0.2.5`
 - PC1 VPN: `2001:0db8::19aa:5035`
 - PC2 VPN: `2001:0db8::19ac:75fc`
 
Suppose you want to access the X32 from PC2.  On PC1, run the following:

```
x32-proxy --udp [2001:0db8::19aa]:5035 --target 192.0.2.1
```

On PC2, run the following:

```
x32-proxy --udp --target [2001:0db8::19aa]:5035
```

Now, on PC2, you can open your software and connect to `127.0.0.1` with X32 Edit as if you were directly connected to the console.


# Security
It is important to note that the X32/M32 OSC implementation has no security at all.  You urged to only connect trustworthy devices to its network which require full access to the console.  When proxying data from other networks, you must be careful and be absolutely sure you trust every device on that network.  If you enable access to the mixer from the internet, you're probably going to have a bad day.

# License
See license in LICENSE file.

This project is not associated with Behringer, Midas, MUSIC Group, or any of those folks.  Please do not contact them for support for this tool.

Copyright © 2022 AudioPump, Inc.