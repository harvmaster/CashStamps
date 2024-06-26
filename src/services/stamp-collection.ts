import { HDPrivateNode } from 'src/utils/hd-private-node.js';

import {
  deriveSeedFromBip39Mnemonic,
  generateBip39Mnemonic,
} from '@bitauth/libauth';

export const DERIVATION_PATH = `m/44'/145'/0'`;
export const ADDRESS_GAP = 20;

export class StampCollection {
  constructor(
    private readonly mnemonic: string,
    private readonly hdNodes: Array<HDPrivateNode> = []
  ) {}

  static generate(count: number) {
    // Generate a random mnemonic.
    const mnemonic = generateBip39Mnemonic();

    console.log(mnemonic);

    // Derive the seed from the mnemonic.
    const seed = deriveSeedFromBip39Mnemonic(mnemonic);

    // Create a node from the seed.
    const parentNode = HDPrivateNode.fromSeed(seed);

    // Declare an array to store our nodes.
    const nodes: Array<HDPrivateNode> = [];

    // Derive a node for each stamp.
    for (let i = 0; i < count; i++) {
      nodes.push(parentNode.derivePath(`${DERIVATION_PATH}/${i}`));
    }

    // Create instance of StampCollection using generated mnemonic.
    return new StampCollection(mnemonic, nodes);
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
  }

  redeemRemainingStamps() {
    console.log('redeem stamps');
  }
}