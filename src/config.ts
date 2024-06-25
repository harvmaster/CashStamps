// NOTE: If you add ANY process.env vars here, you MUST also add them to quasar.conf.js
//       Otherwise, they WILL REMAIN UNDEFINED!

// Block Explorer.
export const BLOCKEXPLORER_URL =
  process.env.BLOCKEXPLORER_URL || 'https://explorer.salemkode.com/tx/';

// Electrum Servers.
export const ELECTRUM_SERVERS = process.env.ELECTRUM_SERVERS
  ? process.env.ELECTRUM_SERVERS.split(',')
  : ['bch.imaginary.cash', 'cashnode.bch.ninja', 'electrum.imaginary.cash'];
