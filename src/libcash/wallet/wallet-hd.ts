// Import the Stamp class to derive the private keys
import { HDPrivateNode } from 'src/libcash/primitives/index.js';
import { EventEmitter } from 'src/libcash/utils/index.js';
import { ElectrumService } from 'src/services/electrum';
import {
  WalletP2PKH,
  WalletP2PKHFactory,
  useWalletP2PKH,
} from './wallet-p2pkh.js';

import {
  deriveSeedFromBip39Mnemonic,
  encodeTransaction,
  generateTransaction,
  getMinimumFee,
} from '@bitauth/libauth';

export const DERIVATION_PATH = "m/44'/145'/0'";
export const ADDRESS_GAP = 20;

export type WalletHDEvents<WalletType> = {
  walletsUpdated: Array<WalletType>;
};

export class WalletHD<
  WalletType extends WalletP2PKH = WalletP2PKH
> extends HDPrivateNode {
  // Events.
  public events: EventEmitter<WalletHDEvents<WalletType>> = new EventEmitter();

  // Mutable State.
  public wallets: Array<WalletType> = [];
  public shouldMonitor = false;

  constructor(
    public mnemonic: string,
    public electrum: ElectrumService,
    private walletFactory: WalletP2PKHFactory<WalletType> = useWalletP2PKH
  ) {
    // Derive the seed from the mnemonic.
    const seed = deriveSeedFromBip39Mnemonic(mnemonic);

    // Derive node from mnemonic.
    const hdPrivateNode = HDPrivateNode.fromSeed(seed);

    // Instantiate parent class.
    super(hdPrivateNode.node);

    // Monitor the following properties and emit an event when they change.
    this.events.monitorProperty(this, 'wallets', 'walletsUpdated');
  }

  static fromMnemonic<T extends WalletHD<any>>(
    this: new (
      mnemonic: string,
      electrum: ElectrumService,
      walletFactory?: WalletP2PKHFactory<any>
    ) => T,
    mnemonic: string,
    electrum: ElectrumService,
    walletFactory?: WalletP2PKHFactory<any>
  ): T {
    return new this(mnemonic, electrum, walletFactory);
  }

  async destroy() {
    this.events.removeAllListeners();
  }

  async setQuantity(quantity: number) {
    // Clear existing nodes.
    this.wallets = this.deriveWallets(quantity);
  }

  async startMonitoring() {
    this.shouldMonitor = true;

    await Promise.all(this.wallets.map((wallet) => wallet.startMonitoring()));
  }

  async stopMonitoring() {
    this.shouldMonitor = false;

    await Promise.all(this.wallets.map((wallet) => wallet.stopMonitoring()));
  }

  deriveWallets(count: number, startIndex = 0) {
    // Create an array to store our wallets.
    const wallets: Array<WalletType> = [];

    // Create the given count of wallets.
    for (let i = 0; i < count; i++) {
      const childNode = this.derivePath(
        `${DERIVATION_PATH}/0/${startIndex + i}`
      );
      const wallet = this.walletFactory(
        childNode.privateKey().toBytes(),
        this.electrum
      );

      if (this.shouldMonitor) {
        wallet.startMonitoring();
      }

      wallets.push(wallet);
    }

    this.wallets = wallets;

    // Return the wallets.
    return wallets;
  }

  async scan(startIndex = 0, addressGap = 20) {
    // Array to store active wallet nodes
    const nodes: Array<WalletType> = [];

    let currentIndex = startIndex;
    let emptyAddressCount = 0;

    // Continue scanning until we find 'addressGap' consecutive empty addresses
    while (emptyAddressCount < addressGap) {
      // Derive a number of wallets equivalent to our addressGap.
      const batch: Array<WalletType> = this.deriveWallets(
        addressGap,
        currentIndex
      );

      // Get the transaction history of each wallet in the batch
      const results = await Promise.all(
        batch.map((wallet) => wallet.fetchHistory())
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

    this.wallets = nodes;

    return nodes;
  }

  async refreshChildNodes() {
    await Promise.all(this.wallets.map((node) => node.refresh()));
  }

  async sweep(payoutBytecode: Uint8Array) {
    // Get a list of inputs belonging to each wallet.
    const inputs = await Promise.all(
      this.wallets.map((wallet) => wallet.getUnspentDirectives())
    );

    // Flatten the inputs.
    const inputsFlattened = inputs.flat();

    // Calculate the total sats available in our inputs.
    const totalSats = inputsFlattened.reduce((total, input) => {
      if (input.unlockingBytecode instanceof Uint8Array) {
        return (total += 0n);
      }

      return (total += input.unlockingBytecode.valueSatoshis);
    }, 0n);

    // We need to calculate the number of bytes so that we can calculate the fee.
    // So we loop twice and store the final transaction here each time.
    // 1st time will have zero fee. 2nd time will accommodate the fee.
    let encodedTransaction = new Uint8Array();

    // Create the transaction by looping twice.
    // 1st loop: Transaction without a fee.
    // 2nd loop: Accommodate the fee.
    for (let i = 0; i < 2; i++) {
      // Get the fee using 1000 sats/KB.
      const feeSats = getMinimumFee(BigInt(encodedTransaction.length), 1000n);

      // Attempt to generate the transaction.
      const generatedTransaction = generateTransaction({
        version: 2,
        locktime: 0,
        inputs: inputsFlattened,
        outputs: [
          {
            lockingBytecode: payoutBytecode,
            valueSatoshis: totalSats - feeSats,
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

export type WalletHDFactory<T extends WalletHD = WalletHD> = (
  mnemonic: string,
  electrum: ElectrumService,
  walletFactory?: WalletP2PKHFactory<any>
) => T;

export function useWalletHD<T extends WalletHD = WalletHD>(
  mnemonic: string,
  electrum: ElectrumService,
  walletFactory?: WalletP2PKHFactory<any>
): T {
  return new WalletHD(mnemonic, electrum, walletFactory) as T;
}
