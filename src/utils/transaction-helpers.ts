import {
  AddressGetHistory,
  AddressListUnspent,
} from 'src/services/electrum-types';
import { app } from '../boot/app';
import { DERIVATION_PATH, ADDRESS_GAP } from 'src/services/stamp-collection';
import { HDPrivateNode } from './hd-private-node';

export type KeyHistory = {
  history: AddressGetHistory['response'];
  node: HDPrivateNode;
  address: string;
};

// Get the addresses for a given parent node
export const getAddresses = (
  parentNode: HDPrivateNode,
  offset = 0,
  count = ADDRESS_GAP
) => {
  // Declare an array to store our addresses
  const addresses = [];

  // Derive a node for each stamp
  for (let i = 0; i < count; i++) {
    const node = parentNode.derivePath(`${DERIVATION_PATH}/0/${offset + i}`);
    const address = node
      .deriveHDPublicNode()
      .publicKey()
      .deriveAddress()
      .toCashAddr();
    addresses.push({ node, address });
  }

  // Return the addresses
  return addresses;
};

export const getUsedKeys = async (
  parentNode: HDPrivateNode,
  offset = 0,
  count = ADDRESS_GAP
): Promise<KeyHistory[]> => {
  const addresses = getAddresses(parentNode, offset, count);

  const historyPromises: Promise<KeyHistory>[] = addresses.map(
    async ({ address, node }) => {
      // Get the history of the key from electrum
      const res = (await app.electrum.request(
        'blockchain.address.get_history',
        address
      )) as AddressGetHistory['response'];
      return {
        history: res,
        node,
        address,
      };
    }
  );

  // Wait for all the promises to resolve
  const history = await Promise.all(historyPromises);

  // If all the keys are used, check the next batch of keys and append to the array of used jeys
  if (history.every((key) => key.history.length)) {
    history.push(
      ...(await getUsedKeys(parentNode, offset + ADDRESS_GAP, count))
    );
  }

  // Return the history of all the keys
  return history.filter((key) => key.history.length);
};

export const getKeyUnspent = async (
  key: HDPrivateNode
): Promise<AddressListUnspent['response']> => {
  const address = key
    .deriveHDPublicNode()
    .publicKey()
    .deriveAddress()
    .toCashAddr();
  const res = (await app.electrum.request(
    'blockchain.address.listunspent',
    address
  )) as AddressListUnspent['response'];

  return res;
};

export const getTransactionData = async (key: KeyHistory) => {
  const res = (await app.electrum.request(
    'blockchain.transaction.get',
    key.history[0].tx_hash,
    true
  )) as any;
  return res;
};

export const getTransactionBlocktime = async (
  key: KeyHistory
): Promise<number> => {
  const res = await getTransactionData(key);
  return res.blocktime;
};
