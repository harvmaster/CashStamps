// -------------------
// 3rd party imports
// -------------------

import {
  deriveSeedFromBip39Mnemonic,
  generateBip39Mnemonic,
} from '@bitauth/libauth';

// Import a simple key-value storage that uses the IndexedDB feature of modern browsers.
import { get, set } from 'idb-keyval';

// Import the CashPayServer library for generating transactions
import CashPayServer from '@developers.cash/cash-pay-server-js';

// ---------------
//  Type imports
// ---------------
// Made type for CashPayServer as it was not defined in the library
import { CashPayServer_Invoice } from 'src/types';

// -------------------
//  Local imports
// -------------------
// Import the app instance to access the oracle
import { app } from 'src/boot/app';

// Import the HDPrivateNode class to derive the private keys
import { HDPrivateNode } from 'src/utils/hd-private-node.js';
// Import the functions to get the used keys and unspent transactions
import { getUsedKeys, getTransactionData } from 'src/utils/transaction-helpers';


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
  mnemonic?: string;
  funding?: FundingOptions;
};

export class StampCollection {
  constructor(
    private readonly mnemonic: string,
    private readonly hdNodes: Array<HDPrivateNode> = [],
    private readonly funding: FundingOptions = { ...DEFAULT_FUNDING_OPTIONS },
    private name: string = ''
  ) {}

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
    const parentNode = HDPrivateNode.fromSeed(seed);

    // Declare an array to store our nodes.
    const nodes: Array<HDPrivateNode> = [];

    // Derive a node for each stamp.
    for (let i = 0; i < options.quantity; i++) {
      nodes.push(parentNode.derivePath(`${DERIVATION_PATH}/0/${i}`));
    }

    // Create instance of StampCollection using generated mnemonic.
    return new StampCollection(
      options.mnemonic,
      nodes,
      fundingOptions,
      options.name
    );
  }

  static async fromMnemonic(mnemonic: string): Promise<StampCollection> {
    // Derive the seed from the mnemonic.
    const seed = deriveSeedFromBip39Mnemonic(mnemonic);

    // Create a node from the seed.
    const parentNode = HDPrivateNode.fromSeed(seed);

    // Declare an array to store our nodes.
    const nodes: Array<HDPrivateNode> = [];

    // Get all the addresses that have been a tx history
    const usedKeys = await getUsedKeys(parentNode);

    // Get the unspent transactions for each key, Not sure if we need each key or just the first one.
    // Its used to get the funding amount in BCH. This can be used to convert to other currencies with the Oracle
    // const unspentPromises = usedKeys.map(async (key) => {
    //   const unspent = await getKeyUnspent(key);
    //   return unspent
    // })

    // Wait for all the promises to resolve
    // const unspent = await Promise.all(unspentPromises);

    usedKeys.forEach((key, i) => {
      nodes.push(key.node);
    })
    
    // Get the blocktime of the first transaction to get the funding date
    // Bit of a hack with the Date.now(). Its there for when a transaction has not been confirmed yet
    const firstTransaction = await getTransactionData(usedKeys[0]);

    // Get the blocktime of the first transaction (they should all be the same), we can use this to get the price of the stamp from the oracle
    const blocktime = firstTransaction ? firstTransaction.blocktime : Date.now() / 1000;

    // Get the transaction's value to set the funding amount
    let txValue = 0
    if (firstTransaction) {
      txValue = firstTransaction.vout.find((output: any) => {
        return output.scriptPubKey.addresses.some((address: string) => {
          return address == usedKeys[0].address
        })
      }).value
    }

    // Set funding options to be used in the StampCollection
    const fundingOptions = {
      value: txValue,
      currency: 'BCH',
      funded: new Date(blocktime * 1000)
    }

    // Create instance of StampCollection using generated mnemonic.
    return new StampCollection(mnemonic, nodes, fundingOptions);
  }

  setName(name: string) {
    this.name = name;
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

    // Get amount without currency reference
    const rawAmount = this.getFundingOptions().value;

    // Get currency
    const currency = this.getFundingOptions().currency;

    // Initialise the output amount to be in BCH
    let bchAmount = rawAmount;

    // If the currency selected is not BCH, convert bchAmount to the equivalent amount in the selected currency
    if (currency !== 'BCH') {
      // Get the BCH price in the selected currency
      const bchPrice = app.oracles.getOraclePriceCommonUnits(this.getFundingOptions().currency);

      // Set BCH amount to the equivalent amount in the selected currency
      bchAmount = rawAmount / bchPrice;
    }

    // Add addresses to transaction
    for (const node of this.hdNodes) {
      const address = node
        .deriveHDPublicNode()
        .publicKey()
        .deriveAddress()
        .toCashAddr();
      invoice.addAddress(
        address,
        `${bchAmount}BCH` // Amount sent to CashPayServer is in BCH
      );
    }

    // Name invoice to show up in cryptocurrency wallet
    invoice.setMemo(`CashStamps: ${this.name}`);

    // Return invoice object, Need to call create from here, but we need to be able to call "intoContainer" to load the invoice into the browser
    return invoice;
  }

  // Set stamp as funded to disable funding button
  fundStamps() {
    console.log('fund stamps');
    this.funding.funded = new Date();
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
