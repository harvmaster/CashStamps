// -------------------
// 3rd party imports
// -------------------
import { computed, ref, shallowRef } from 'vue';

import {
  deriveSeedFromBip39Mnemonic,
  encodeTransaction,
  generateTransaction,
  getMinimumFee,
} from '@bitauth/libauth';

// -------------------
//  Local imports
// -------------------
// Import the Stamp class to derive the private keys
import { Wallet } from 'src/utils/wallet.js';
// Import the functions to get the used keys and unspent transactions
import { getUsedKeys } from 'src/utils/transaction-helpers';
// Import the ElectrumService as a type to use in the constructor
import { ElectrumService } from 'src/services/electrum';

export const DERIVATION_PATH = `m/44'/145'/0'`;
export const ADDRESS_GAP = 20;

export class WalletHD {
  // Reactives.
  public mnemonic = ref<string>('');
  public wallets = shallowRef<Array<Wallet>>([]);
  public balance = computed(() => {
    return this.wallets.value.reduce(
      (total, node) => total + node.balance.value,
      0
    );
  });
  public isFunded = computed(() => {
    return this.wallets.value.some(
      (node) => node.transactions.value.length > 0
    );
  });

  constructor(mnemonic: string, stamps: Array<Wallet> = []) {
    this.mnemonic.value = mnemonic;
    this.wallets.value = stamps;
  }

  static async fromMnemonic(
    electrum: ElectrumService,
    mnemonic: string,
    minQuantity = 0
  ): Promise<WalletHD> {
    // Derive the seed from the mnemonic.
    const seed = deriveSeedFromBip39Mnemonic(mnemonic);

    // Create a node from the seed.
    const parentNode = Wallet.fromStampSeed(seed, electrum);

    // Declare an array to store our nodes.
    const nodes: Array<Wallet> = [];

    // Get all the addresses that have been a tx history
    const usedKeys = await getUsedKeys(electrum, parentNode);

    // Get the nodes from the used keys
    usedKeys.forEach((key, _i) => {
      nodes.push(new Wallet(key.node.node, electrum));
    });

    // Get the balance of each node
    nodes.forEach(async (node) => node.refresh());

    // Derive a node for each stamp.
    for (let i = nodes.length; i < minQuantity; i++) {
      nodes.push(parentNode.derivePath(`${DERIVATION_PATH}/0/${i}`));
    }

    // Create instance of StampCollection using generated mnemonic.
    return new WalletHD(mnemonic, nodes);
  }

  async refreshChildNodes() {
    await Promise.all(this.wallets.value.map((node) => node.refresh()));
  }

  async sweep(payoutBytecode: Uint8Array) {
    // Get a list of inputs belonging to each wallet.
    const inputs = await Promise.all(
      this.wallets.value.map((stamp) => stamp.getUnspentDirectives())
    );

    // Flatten the inputs.
    const inputsFlattened = inputs.flat();

    // Calculate the total sats availabel in our inputs.
    const totalSats = inputsFlattened.reduce(
      (total, input) => total + input.unlockingBytecode.valueSatoshis,
      0n
    );

    // We need to estimate the number of bytes so that we can calculate the fee.
    let encodedTransaction = new Uint8Array();

    // Create the transaction by looping twice.
    // 1st loop: Transaction without a fee.
    // 2nd loop: Accommodate the fee.
    for (let i = 0; i < 2; i++) {
      // Get the fee using 1000 sats/KB.
      const fee = getMinimumFee(BigInt(encodedTransaction.length), 1000n);

      // Attempt to generate the transaction.
      const generatedTransaction = generateTransaction({
        version: 2,
        locktime: 0,
        inputs: inputsFlattened,
        outputs: [
          {
            lockingBytecode: payoutBytecode,
            valueSatoshis: totalSats - fee,
          },
        ],
      });

      if (!generatedTransaction.success) {
        console.error(generatedTransaction.errors);

        throw new Error('Failed to generate transaction');
      }

      // Encode the transaction for broadcasting (and fee estimation).
      encodedTransaction = encodeTransaction(generatedTransaction.transaction);
    }

    return encodedTransaction;
  }
}
