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

// Import the Stamp class to derive the private keys
import { HDPrivateNode } from './hd-private-node';
import { WalletP2PKH } from './wallet-p2pkh.js';
// Import the ElectrumService as a type to use in the constructor
import { ElectrumService } from 'src/services/electrum';

import { HdPrivateNodeValid } from '@bitauth/libauth';

export const DERIVATION_PATH = `m/44'/145'/0'`;
export const ADDRESS_GAP = 20;

export class WalletHD extends HDPrivateNode {
  // Services/Dependencies
  private electrum: ElectrumService;

  // Reactives.
  // TODO: Move these out of here.
  //       They should either extend or hook into events (still TBD).
  public mnemonic = ref<string>('');
  public wallets = shallowRef<Array<WalletP2PKH>>([]);
  public balance = computed(() => {
    return this.wallets.value.reduce(
      (total, node) => total + node.balance.value,
      0
    );
  });

  public isFunded = computed(() => {
    return this.wallets.value.every(
      (node) => node.transactions.value.length > 0
    );
  });
  public isClaimed = computed(() => {
    return this.isFunded.value && this.balance.value <= 0;
  });
  public claimedStamps = computed(() => {
    return this.wallets.value.filter(
      (wallet) => wallet.transactions.value.length && wallet.balance.value === 0
    ).length;
  });

  shouldMonitor = false;

  constructor(
    node: HdPrivateNodeValid,
    mnemonic: string,
    electrum: ElectrumService
  ) {
    super(node);

    this.mnemonic.value = mnemonic;

    // Dependencies.
    this.electrum = electrum;
  }

  static async fromMnemonic(
    mnemonic: string,
    electrum: ElectrumService
  ): Promise<WalletHD> {
    // Derive the seed from the mnemonic.
    const seed = deriveSeedFromBip39Mnemonic(mnemonic);

    const hdPrivateNode = HDPrivateNode.fromSeed(seed);

    return new WalletHD(hdPrivateNode.node, mnemonic, electrum);
  }

  async setQuantity(quantity: number) {
    // Clear existing nodes.
    this.wallets.value = this.deriveWallets(quantity);
  }

  async startMonitoring() {
    this.shouldMonitor = true;

    await Promise.all(
      this.wallets.value.map((wallet) => wallet.startMonitoring())
    );
  }

  async stopMonitoring() {
    this.shouldMonitor = false;

    await Promise.all(
      this.wallets.value.map((wallet) => wallet.stopMonitoring())
    );
  }

  deriveWallets(count: number, startIndex = 0) {
    // Create an array to store our wallets.
    const wallets: Array<WalletP2PKH> = [];

    // Create the given count of wallets.
    for (let i = 0; i < count; i++) {
      const childNode = this.derivePath(
        `${DERIVATION_PATH}/0/${startIndex + i}`
      );
      const wallet = new WalletP2PKH(
        childNode.privateKey().toBytes(),
        this.electrum
      );

      if (this.shouldMonitor) {
        wallet.startMonitoring();
      }

      wallets.push(wallet);
    }

    // Return the wallets.
    return wallets;
  }

  async scan(startIndex = 0, addressGap = 20) {
    // Array to store active wallet nodes
    const nodes: Array<WalletP2PKH> = [];

    let currentIndex = startIndex;
    let emptyAddressCount = 0;

    // Continue scanning until we find 'addressGap' consecutive empty addresses
    while (emptyAddressCount < addressGap) {
      // Derive a number of wallets equivalent to our addressGap.
      const batch: Array<WalletP2PKH> = this.deriveWallets(
        addressGap,
        currentIndex
      );

      // Get the transaction history of each wallet in the batch
      const results = await Promise.all(
        batch.map((wallet) => wallet.getHistory())
      );

      // Process the results
      for (let i = 0; i < results.length; i++) {
        if (results[i].length > 0) {
          // This address has transactions, add it to nodes and reset empty address count
          nodes.push(batch[i]);
          emptyAddressCount = 0;
        } else {
          // This address is empty, increment the empty address count
          emptyAddressCount++;
        }

        currentIndex++;

        // If we've found 'addressGap' consecutive empty addresses, stop scanning
        if (emptyAddressCount >= addressGap) {
          break;
        }
      }
    }

    this.wallets.value = nodes;

    return nodes;
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
