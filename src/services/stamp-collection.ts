import { HDPrivateNode } from 'src/utils/hd-private-node.js';

import {
  deriveSeedFromBip39Mnemonic,
  generateBip39Mnemonic,
} from '@bitauth/libauth';

// Import a simple key-value storage that uses the IndexedDB feature of modern browsers.
import { get, set } from 'idb-keyval';

export const DERIVATION_PATH = `m/44'/145'/0'`;
export const ADDRESS_GAP = 20;

export type FundingOptions = {
  amount: number;
  currency: string;
  funded: boolean;
}
export const DEFAULT_FUNDING_OPTIONS: Readonly<FundingOptions> = {
  amount: 0,
  currency: 'BCH',
  funded: false,
}

export type GenerateOptions = {
  count: number;
  name?: string;
  mnemonic?: string;
  funding?: FundingOptions;
}

export class StampCollection {
  constructor(
    private readonly mnemonic: string,
    private readonly hdNodes: Array<HDPrivateNode> = [], 
    private readonly funding: FundingOptions = {...DEFAULT_FUNDING_OPTIONS},
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
      nodes.push(parentNode.derivePath(`${DERIVATION_PATH}/${i}`));
    }

    // Create instance of StampCollection using generated mnemonic.
    return new StampCollection(options.mnemonic, nodes, fundingOptions, options.name);
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

  fundStamps() {
    console.log('fund stamps');
    this.funding.funded = true;
  }

  redeemRemainingStamps() {
    console.log('redeem stamps');
  }

  getName() {
    return this.name
    // const collections = await get('stampCollections') || [];
    // return collections.find((collection: string) => collection === this.mnemonic)
  }

  getFundingOptions () {
    return this.funding;
  }

  async saveStamps() {
    const name = this.getName() || this.mnemonic;

    const collections = await get('stampCollections') || [];
    if (Object.values(collections).includes(this.mnemonic)) return;

    collections[name] = this.mnemonic;
    await set('stampCollections', collections);
  }
}
