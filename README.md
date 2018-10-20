x32-proxy
--------

*Proxy server for Behringer X32/Midas M32 series mixing consoles' remote control OSC commands over IPv4 and IPv6 networks, such as VPNs*

# Installation

1. Install [Node.js for your platform](https://nodejs.org/en/download/).

2. Install x32-proxy via NPM.  (It is recommended you install x32-proxy globally, as this is a CLI.)

```
npm install -g x32-proxy
```

# Usage

The basics will get you up and running in most cases.

```
x32-proxy <local bind address> <X32 console address>
```

For example, suppose your X32/M32 mixer has an IP address of `192.0.2.20`.  Also suppose your PC is on the `192.0.2.0/24` LAN with the mixer, as well as on a VPN with the address of `203.0.113.10`.  You would like to share access to the mixer with everyone on the VPN.  To do that, you bind the proxy to the VPN, and specify the mixer's address on your LAN:

```
x32-proxy 203.0.113.10 192.0.2.20
```

Once running, VPN users should be able to access the mixer using their normal X32/M32 OSC clients (such as X32-Edit) on `203.0.113.10`.

## Basic Options

### `--help`
Shows all the options and usage.

### `--name <name>`
You may want to rewrite the display name of the upstream mixer for clients to display in their setup dialog.  This option allows specifying the name.

### `--client-timeout <milliseconds>`
If the proxy hasn't heard from the client in awhile (5 seconds by default), it will remove them from the list of active clients and will close the socket that the X32 would normally respond on.  You can adjust this timeout if you wish.

## Advanced Options

### `--bind-port <port>`
The network port on which we will listen, accepting remote connections from clients.

### `--upstream-port <port>`
The network port on which to connect to the upstream X32/M32 console.  (Leave this at the default of 10023, unless you really have a particular use case for changing it.)

### `--disable-status-rewrite`
By default, the proxy will rewrite the upstream console address in `/status` and `/xinfo` packets.  This flag disables that functionality.

## Example: IPv6 VPN with stock X32-Edit
Unfortunately, the X32/M32 consoles don't support IPv6, and [probably never will](https://forum.musictribe.com/showthread.php?17399-IPv6-Support-for-OSC-Control).  Even more unfortunate is that the standard X32-Edit application is hardcoded to only use IPv4 addresses.  It doesn't even support hostnames.  What are you to do if you must access your X32 over an IPv6-only VPN?  You can run this proxy utility on two sides of it.

Example Address:

 - X32 LAN: `192.0.2.1`
 - PC1 LAN: `192.0.2.5`
 - PC1 VPN: `2001:0db8::19aa:5035`
 - PC2 VPN: `2001:0db8::19ac:75fc`
 
Suppose you want to access the X32 from PC2.  On PC1, run the following:

```
x32-proxy 2001:0db8::19aa:5035 192.0.2.1
```

On PC2, run the following:

```
x32-proxy 127.0.0.1 2001:0db8::19aa:5035
```

Now, on PC2, you can open your software and connect to `127.0.0.1` as if you were directly connected to the console.


# Security
It is important to note that the X32/M32 OSC implementation has no security at all.  You urged to only connect trustworthy devices to its network which require full access to the console.  When proxying data from other networks, you must be careful and be absolutely sure you trust every device on that network.  If you enable access to the mixer from the internet, you're probably going to have a bad day.

# License
See license in LICENSE file.

This project is not associated with Behringer, Midas, MUSIC Group, or any of those folks.  Please do not contact them for support for this tool.

Copyright © 2018, AudioPump, Inc.