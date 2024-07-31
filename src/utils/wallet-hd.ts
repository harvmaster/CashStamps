// -------------------
// 3rd party imports
// -------------------
import { reactive, Reactive, shallowReactive, shallowRef } from 'vue';

import {
  deriveSeedFromBip39Mnemonic,
  generateBip39Mnemonic,
} from '@bitauth/libauth';

// -------------------
//  Local imports
// -------------------
// Import the Stamp class to derive the private keys
import { Stamp } from 'src/utils/stamp.js';
// Import the functions to get the used keys and unspent transactions
import { getUsedKeys, getTransactionData } from 'src/utils/transaction-helpers';
// Import the ElectrumService as a type to use in the constructor
import { ElectrumService } from 'src/services/electrum';

export const DERIVATION_PATH = `m/44'/145'/0'`;
export const ADDRESS_GAP = 20;

export class WalletHD {
  public readonly state = shallowReactive<{
    mnemonic: string;
    stamps: Array<Stamp>;
    funded: boolean;
  }>({
    mnemonic: '',
    stamps: [],
    funded: false,
  });

  constructor(
    public readonly mnemonic: string,
    stamps: Array<Stamp> = [],
    funded = false
  ) {
    this.state.stamps = stamps;
    this.state.funded = funded;
  }

  static async fromMnemonic(
    electrum: ElectrumService,
    mnemonic: string,
    minQuantity = 0
  ): Promise<WalletHD> {
    // Derive the seed from the mnemonic.
    const seed = deriveSeedFromBip39Mnemonic(mnemonic);

    // Create a node from the seed.
    const parentNode = Stamp.fromStampSeed(seed, electrum);

    // Declare an array to store our nodes.
    const nodes: Array<Stamp> = [];

    // Declare a variable to store whether this collection has been funded.
    let funded = false;

    // Get all the addresses that have been a tx history
    const usedKeys = await getUsedKeys(electrum, parentNode);

    if (usedKeys.length) {
      funded = true;
    }

    // Get the nodes from the used keys
    usedKeys.forEach((key, _i) => {
      nodes.push(new Stamp(key.node.node, electrum));
    });

    // Get the balance of each node
    nodes.forEach(async (node) => node.getAvailableBalance());

    // Derive a node for each stamp.
    for (let i = nodes.length; i < minQuantity; i++) {
      nodes.push(parentNode.derivePath(`${DERIVATION_PATH}/0/${i}`));
    }

    // Create instance of StampCollection using generated mnemonic.
    return new WalletHD(mnemonic, nodes, funded);
  }

  async refreshStampValues() {
    // Get the balance of each node
    this.state.stamps.forEach(async (node) => node.getAvailableBalance());
  }

  redeemRemainingStamps() {
    console.log('redeem stamps');
  }
}
