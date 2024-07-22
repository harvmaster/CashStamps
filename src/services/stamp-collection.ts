// -------------------
// 3rd party imports
// -------------------
import {
  deriveSeedFromBip39Mnemonic,
  generateBip39Mnemonic,
} from '@bitauth/libauth';

// Import a simple key-value storage that uses the IndexedDB feature of modern browsers.
import { get, set } from 'idb-keyval';

// -------------------
//  Local imports
// -------------------
// Import the app instance to access the oracle
import { app } from 'src/boot/app';

// Import the Stamp class to derive the private keys
import { Stamp } from 'src/utils/stamp.js';
// Import the functions to get the used keys and unspent transactions
import { getUsedKeys, getTransactionData } from 'src/utils/transaction-helpers';
import { reactive, Reactive, ref, Ref } from 'vue';

export const DERIVATION_PATH = `m/44'/145'/0'`;
export const ADDRESS_GAP = 20;

export type FundingOptions = {
  value: number;
  currency: string;
  funded: false | Date;
};
export const DEFAULT_FUNDING_OPTIONS: FundingOptions = {
  value: 0,
  currency: 'BCH',
  funded: false,
};

export type GenerateOptions = {
  quantity: number;
  name?: string;
  expiry?: string;
  mnemonic?: string;
  funding?: FundingOptions;
};

export class StampCollection {
  private readonly stamps: Reactive<Array<Stamp>>;
  private readonly funding: Reactive<FundingOptions>;

  constructor(
    private readonly mnemonic: string,
    private readonly hdNodes: Array<Stamp> = [],
    private readonly fundingOptions: FundingOptions = {
      ...DEFAULT_FUNDING_OPTIONS,
    },
    private expiry: Date = new Date(),
    private name: string = ''
  ) {
    this.stamps = reactive(hdNodes);
    this.funding = reactive(fundingOptions);
  }

  static generate(options: GenerateOptions): StampCollection {
    // Use default funding options if none are provided.
    const fundingOptions = options.funding || DEFAULT_FUNDING_OPTIONS;

    // Make sure amount isnt stupid amount of digits
    if (fundingOptions.value?.toString()?.split('.')?.[1]?.length > 8) {
      fundingOptions.value = parseFloat(fundingOptions.value.toFixed(8));
    }

    // Generate a random mnemonic.
    if (!options.mnemonic) options.mnemonic = generateBip39Mnemonic();

    console.log(options.mnemonic);

    // Derive the seed from the mnemonic.
    const seed = deriveSeedFromBip39Mnemonic(options.mnemonic);

    // Create a node from the seed.
    const parentNode = Stamp.fromSeed(seed);

    // Declare an array to store our nodes.
    const nodes: Array<Stamp> = [];

    // Derive a node for each stamp.
    for (let i = 0; i < options.quantity; i++) {
      nodes.push(parentNode.derivePath(`${DERIVATION_PATH}/0/${i}`));
    }

    // Set the expiry date. Converted from string ('yyyy/mm/dd') to Date Object
    const expiry = options.expiry ? new Date(options.expiry) : new Date();

    // Create instance of StampCollection using generated mnemonic.
    return new StampCollection(
      options.mnemonic,
      nodes,
      fundingOptions,
      expiry,
      options.name
    );
  }

  static async fromMnemonic(
    mnemonic: string,
    expiry?: Date
  ): Promise<StampCollection> {
    // Derive the seed from the mnemonic.
    const seed = deriveSeedFromBip39Mnemonic(mnemonic);

    // Create a node from the seed.
    const parentNode = Stamp.fromSeed(seed);

    // Declare an array to store our nodes.
    const nodes: Array<Stamp> = [];

    // Get all the addresses that have been a tx history
    const usedKeys = await getUsedKeys(parentNode);

    // Get the nodes from the used keys
    usedKeys.forEach((key, i) => {
      nodes.push(new Stamp(key.node.node));
    });

    // Early return, otherwise we get an error when trying to get the blocktime of the first transaction
    if (nodes.length === 0) {
      return new StampCollection(mnemonic, nodes);
    }

    // Get the balance of each node
    nodes.forEach(async (node) => node.getAvailableBalance());

    // Get the blocktime of the first transaction to get the funding date
    // Bit of a hack with the Date.now(). Its there for when a transaction has not been confirmed yet
    const firstTransaction = await getTransactionData(usedKeys[0]);

    // Get the blocktime of the first transaction (they should all be the same), we can use this to get the price of the stamp from the oracle
    const blocktime = firstTransaction?.blocktime || Date.now() / 1000;
    console.log(blocktime);

    // Get the transaction's value to set the funding amount
    let txValue = 0;
    if (firstTransaction) {
      txValue =
        firstTransaction.vout.find((output: any) => {
          return output.scriptPubKey.addresses.some((address: string) => {
            return address == usedKeys[0].address;
          });
        })?.value || 0;
    }

    // Set funding options to be used in the StampCollection
    const fundingOptions = {
      value: txValue,
      currency: 'BCH',
      funded: new Date(blocktime * 1000),
    };

    // Create instance of StampCollection using generated mnemonic.
    return new StampCollection(mnemonic, nodes, fundingOptions, expiry);
  }

  setName(name: string) {
    this.name = name;
  }

  getMnemonic(): string {
    return this.mnemonic;
  }

  getStamps(): Reactive<Array<Stamp>> {
    return this.stamps;
  }

  // Set the funding options to the BCH value and the date it was funded.
  // This is generated after the funding tx is completed
  lockStampOptions(funding: { currency: 'BCH'; value: number }) {
    this.funding.currency = funding.currency;
    this.funding.value = funding.value;
    this.funding.funded = new Date();
  }

  // Set stamp as funded to disable funding button. Convert the value to BCH if it is not already in BCH
  // async fundStamps() {
  //   this.funding.funded = new Date();

  //   if (this.funding.currency !== 'BCH') {
  //     const bchPrice = app.oracles.getOraclePriceCommonUnits(
  //       this.getFundingOptions().currency
  //     );
  //     this.funding.value = this.funding.value / bchPrice;
  //     this.funding.currency = 'BCH';
  //   }
  // }

  redeemRemainingStamps() {
    console.log('redeem stamps');
  }

  getName() {
    return this.name;
  }

  getFundingOptions(): Reactive<FundingOptions> {
    return this.funding;
  }

  getExpiry() {
    return this.expiry;
  }

  // Save stamps into IDB
  async saveStamps() {
    // Get the name or use the mnemonic as the name
    const name = this.getName() || this.mnemonic;

    // Get the existing collections or create a new one
    const collections = await app.getStampCollections();

    // Check if the collection already exists
    const existingIndex = collections.findIndex((c) => c.name === name);

    // If the collection exists, Overwrite it
    if (existingIndex > -1) {
      collections[existingIndex] = {
        name,
        mnemonic: this.mnemonic,
        version: 2,
        expiry: this.expiry.getTime(),
      };
    } else {
      // If the collection does not exist, Add it
      collections.push({
        name,
        mnemonic: this.mnemonic,
        version: 2,
        expiry: this.expiry.getTime(),
      });
    }

    // Save the collections back to IDB
    await set('stampCollections', collections);
  }
}
