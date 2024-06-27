import { HDPrivateNode } from 'src/utils/hd-private-node.js';

import {
  deriveSeedFromBip39Mnemonic,
  generateBip39Mnemonic,
} from '@bitauth/libauth';

// Import a simple key-value storage that uses the IndexedDB feature of modern browsers.
import { get, set } from 'idb-keyval';

// Import the CashPayServer library for generating transactions
import CashPayServer from '@developers.cash/cash-pay-server-js';
import { CashPayServer_Invoice } from 'src/types';

export const DERIVATION_PATH = `m/44'/145'/0'`;
export const ADDRESS_GAP = 20;

export type FundingOptions = {
  amount: number;
  currency: string;
  funded: boolean;
};
export const DEFAULT_FUNDING_OPTIONS: Readonly<FundingOptions> = {
  amount: 0,
  currency: 'BCH',
  funded: false,
};

export type GenerateOptions = {
  count: number;
  name?: string;
  mnemonic?: string;
  funding?: FundingOptions;
};

export class StampCollection {
  constructor(
    private readonly mnemonic: string,
    private readonly hdNodes: Array<HDPrivateNode> = [],
    private readonly funding: FundingOptions = { ...DEFAULT_FUNDING_OPTIONS },
    private readonly name: string = ''
  ) {}

  static generate(options: GenerateOptions): StampCollection {
    // Use default funding options if none are provided.
    const fundingOptions = options.funding || DEFAULT_FUNDING_OPTIONS;

    // Generate a random mnemonic.
    if (!options.mnemonic) options.mnemonic = generateBip39Mnemonic();

    console.log(options.mnemonic);

    // Derive the seed from the mnemonic.
    const seed = deriveSeedFromBip39Mnemonic(options.mnemonic);

    // Create a node from the seed.
    const parentNode = HDPrivateNode.fromSeed(seed);

    // Declare an array to store our nodes.
    const nodes: Array<HDPrivateNode> = [];

    // Derive a node for each stamp.
    for (let i = 0; i < options.count; i++) {
      nodes.push(parentNode.derivePath(`${DERIVATION_PATH}/${i}/0`));
    }

    // Create instance of StampCollection using generated mnemonic.
    return new StampCollection(
      options.mnemonic,
      nodes,
      fundingOptions,
      options.name
    );
  }

  static fromMnemonic(mnemonic: string): StampCollection {
    // Derive the seed from the mnemonic.
    const seed = deriveSeedFromBip39Mnemonic(mnemonic);

    // Create a node from the seed.
    const parentNode = HDPrivateNode.fromSeed(seed);

    // Declare an array to store our nodes.
    const nodes: Array<HDPrivateNode> = [];

    // TODO: Scan each node using electron
    // Derive a node for each stamp.
    // for(let i = 0; i < count; i++) {
    //   nodes.push(parentNode.derivePath(`${derivationPath}/${i}`));
    // }

    // Create instance of StampCollection using generated mnemonic.
    return new StampCollection(mnemonic, nodes);
  }

  getMnemonic(): string {
    return this.mnemonic;
  }

  getStamps(): Array<HDPrivateNode> {
    return this.hdNodes;
  }

  createFundingTx(): CashPayServer_Invoice {
    if (this.funding.funded) throw new Error('Funding already complete');

    // Create BIP70 invoice instance
    const invoice = new CashPayServer.Invoice();

    // Add addresses to transaction
    for (const node of this.hdNodes) {
      const address = node
        .deriveHDPublicNode()
        .publicKey()
        .deriveAddress()
        .toCashAddr();
      invoice.addAddress(
        address,
        `${this.getFundingOptions().amount / 10000}${
          this.getFundingOptions().currency
        }`
      );
    }

    // Name invoice to show up in cryptocurrency wallet
    invoice.setMemo(`CashStamps: ${this.name}`);

    console.log(JSON.stringify(invoice));

    // Return invoice object, Need to call create from here, but we need to be able to call "intoContainer" to load the invoice into the browser
    return invoice;
  }

  // Set stamp as funded to disable funding button
  fundStamps() {
    console.log('fund stamps');
    this.funding.funded = true;
  }

  redeemRemainingStamps() {
    console.log('redeem stamps');
  }

  getName() {
    return this.name;
  }

  getFundingOptions() {
    return this.funding;
  }

  // Save stamps into IDB
  async saveStamps() {
    // Get the name or use the mnemonic as the name
    const name = this.getName() || this.mnemonic;

    // Get the existing collections or create a new one
    const collections = (await get('stampCollections')) || [];

    // If the value is already in there, no need to put it in there again
    if (Object.values(collections).includes(this.mnemonic)) return;

    // Add the mnemonic to the collections
    collections[name] = this.mnemonic;

    // Save the collections back to IDB
    await set('stampCollections', collections);
  }
}
