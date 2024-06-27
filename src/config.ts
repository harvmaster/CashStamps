// NOTE: If you add ANY process.env vars here, you MUST also add them to quasar.conf.js
//       Otherwise, they WILL REMAIN UNDEFINED!

// Block Explorer.
export const BLOCKEXPLORER_URL =
  process.env.BLOCKEXPLORER_URL || 'https://explorer.salemkode.com/tx/';

// Electrum Servers.
export const ELECTRUM_SERVERS = process.env.ELECTRUM_SERVERS
  ? process.env.ELECTRUM_SERVERS.split(',')
  : ['bch.imaginary.cash', 'cashnode.bch.ninja', 'electrum.imaginary.cash'];

// Oracle Relay Server.
export const ORACLE_RELAY = 'https://oracles.generalprotocols.com';

// An array of Oracle Public Keys that we support.
export const ORACLE_PUBLIC_KEYS = [
  // USD/BCH
  '02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818',
  // EUR/BCH
  '02bb9b3324df889a66a57bc890b3452b84a2a74ba753f8842b06bba03e0fa0dfc5',
  // AUD/BCH
  '034e1d3be2ee29b3d9e53b354b09d9a5a2803c568d8c6520bc72d97494c9a100c2',
  // INR/BCH
  '02e82ad82eb88fcdfd02fd5e2e0a67bc6ef4139bbcb63ce0b107a7604deb9f7ce1',
  // CNY/BCH
  '030654b9598186fe4bc9e1b0490c6b85b13991cdb9a7afa34af1bbeee22a35487a',
];
