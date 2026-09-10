// -------------------
// 3rd party imports
// -------------------
import { computed, ref } from 'vue';

import {
  deriveSeedFromBip39Mnemonic,
  encodeTransaction,
  generateTransaction,
  getMinimumFee,
} from '@bitauth/libauth';

import { HDPrivateNode } from './hd-private-node';
import { WalletP2PKH } from './wallet-p2pkh.js';
import { ElectrumService } from 'src/services/electrum';

import { HdPrivateNodeValid } from '@bitauth/libauth';

export const DERIVATION_PATH = `m/44'/145'/0'`;
export const ADDRESS_GAP = 20;

export class WalletHD extends HDPrivateNode {
  private electrum: ElectrumService;

  public mnemonic = ref<string>('');

  // Cache of every wallet we've ever derived, keyed by derivation index.
  // Ensures an index is only ever derived (and monitored) once, no matter
  // which method needed it first.
  private walletCache = new Map<number, WalletP2PKH>();

  // Indices the user wants shown because of setQuantity().
  private displayIndices = ref<Set<number>>(new Set());

  // Indices scan() found to actually have transaction history.
  private scannedIndices = ref<Set<number>>(new Set());

  // The list exposed to the UI: union of "display" + "scanned" indices.
  // setQuantity() and scan() each own one half of this set, so neither
  // can clobber what the other contributed.
  public wallets = computed<Array<WalletP2PKH>>(() => {
    const indices = new Set([
      ...this.displayIndices.value,
      ...this.scannedIndices.value,
    ]);

    return [...indices]
      .sort((a, b) => a - b)
      .map((i) => this.walletCache.get(i))
      .filter((w): w is WalletP2PKH => Boolean(w));
  });

  public balance = computed(() => {
    return this.wallets.value.reduce(
      (total, node) => total + node.balance.value,
      0
    );
  });
  public balanceTokens = computed(() => {
    return this.wallets.value.reduce(
      (total, node) => total + node.balanceTokens.value,
      0
    );
  });

  public isFunded = computed(() => {
    return this.wallets.value.some(
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
    this.electrum = electrum;
  }

  static async fromMnemonic(
    mnemonic: string,
    electrum: ElectrumService
  ): Promise<WalletHD> {
    const seed = deriveSeedFromBip39Mnemonic(mnemonic);
    const hdPrivateNode = HDPrivateNode.fromSeed(seed);

    return new WalletHD(hdPrivateNode.node, mnemonic, electrum);
  }

  // Derive (or reuse) the wallet at a given index. This is the only
  // place wallets get created, so caching + monitoring stay consistent
  // regardless of which caller triggered the derivation.
  private getOrDeriveWallet(index: number): WalletP2PKH {
    let wallet = this.walletCache.get(index);

    if (!wallet) {
      const childNode = this.derivePath(`${DERIVATION_PATH}/0/${index}`);
      wallet = new WalletP2PKH(childNode.privateKey().toBytes(), this.electrum);
      this.walletCache.set(index, wallet);

      if (this.shouldMonitor) {
        wallet.startMonitoring();
      }
    }

    return wallet;
  }

  async setQuantity(quantity: number) {
    const indices = new Set<number>();

    for (let i = 0; i < quantity; i++) {
      this.getOrDeriveWallet(i);
      indices.add(i);
    }

    this.displayIndices.value = indices;
  }

  async startMonitoring() {
    this.shouldMonitor = true;

    await Promise.all(
      [...this.walletCache.values()].map((wallet) => wallet.startMonitoring())
    );
  }

  async stopMonitoring() {
    this.shouldMonitor = false;

    await Promise.all(
      [...this.walletCache.values()].map((wallet) => wallet.stopMonitoring())
    );
  }

  // Kept for compatibility with existing callers; now backed by the cache.
  deriveWallets(count: number, startIndex = 0): Array<WalletP2PKH> {
    const wallets: Array<WalletP2PKH> = [];

    for (let i = 0; i < count; i++) {
      wallets.push(this.getOrDeriveWallet(startIndex + i));
    }

    return wallets;
  }

  async scan(startIndex = 0, addressGap = ADDRESS_GAP) {
    const foundIndices: number[] = [];

    let currentIndex = startIndex;
    let emptyAddressCount = 0;

    while (emptyAddressCount < addressGap) {
      const batchIndices = Array.from(
        { length: addressGap },
        (_, i) => currentIndex + i
      );
      const batch = batchIndices.map((i) => this.getOrDeriveWallet(i));

      const results = await Promise.all(
        batch.map((wallet) => wallet.getHistory())
      );

      for (let i = 0; i < results.length; i++) {
        if (results[i].length > 0) {
          foundIndices.push(batchIndices[i]);
          emptyAddressCount = 0;
        } else {
          emptyAddressCount++;
        }

        currentIndex++;

        if (emptyAddressCount >= addressGap) {
          break;
        }
      }
    }

    this.scannedIndices.value = new Set(foundIndices);

    return foundIndices.map((i) => this.walletCache.get(i)!);
  }

  async refreshChildNodes() {
    await Promise.all(this.wallets.value.map((node) => node.refresh()));
  }

  async sweep(payoutBytecode: Uint8Array) {
    // Gather every wallet's unspent inputs (BCH-only and token-bearing alike).
    const inputs = await Promise.all(
      this.wallets.value.map((wallet) => wallet.getUnspentDirectives())
    );
    const inputsFlattened = inputs.flat();

    // Separate token-bearing inputs from pure-BCH inputs. Only used to know
    // which inputs need token accounting below — all inputs still get spent.
    const tokenInputs = inputsFlattened.filter(
      (input) => input.unlockingBytecode.token
    );

    // Fungible token amounts only need to balance per-category across the
    // whole transaction, so they get merged into one output per category.
    // NFTs cannot be merged — each needs its own dedicated output preserving
    // capability + commitment. A single input can carry both an amount and
    // an NFT simultaneously (e.g. a stamp topped up after being minted with
    // an NFT), so both tracks are accumulated independently per input.
    const fungibleByCategory = new Map<string, bigint>(); // category -> total amount
    const nftInputsList: typeof tokenInputs = [];

    for (const input of tokenInputs) {
      const token = input.unlockingBytecode.token!;

      if (token.amount && token.amount > 0n) {
        const prev = fungibleByCategory.get(token.category) ?? 0n;
        fungibleByCategory.set(token.category, prev + token.amount);
      }

      if (token.nft) {
        nftInputsList.push(input);
      }
    }

    const totalSats = inputsFlattened.reduce(
      (total, input) => total + input.unlockingBytecode.valueSatoshis,
      0n
    );

    // Dust minimum for a token-carrying output. This is a placeholder —
    // confirm against libauth's current token-aware dust calculation rather
    // than hardcoding, since the correct value depends on the serialized
    // size of the token prefix (larger for NFTs with long commitments).
    const TOKEN_DUST = 1000n;
    const BCH_DUST = 546n;

    let encodedTransaction = new Uint8Array();

    // Loop twice: 1st pass with zero fee to measure size, 2nd pass to
    // accommodate the fee once we know the transaction's actual byte length.
    for (let i = 0; i < 2; i++) {
      const feeSats = getMinimumFee(BigInt(encodedTransaction.length), 1000n);

      const outputs: Array<{
        lockingBytecode: Uint8Array;
        valueSatoshis: bigint;
        token?: {
          category: string;
          amount?: bigint;
          nft?: { capability: string; commitment: Uint8Array };
        };
      }> = [];

      // One merged output per fungible token category.
      for (const [category, amount] of fungibleByCategory) {
        outputs.push({
          lockingBytecode: payoutBytecode,
          valueSatoshis: TOKEN_DUST,
          token: { category, amount },
        });
      }

      // One dedicated output per NFT — never merged, amount omitted since
      // that category's fungible total (if any) already has its own output.
      for (const input of nftInputsList) {
        const token = input.unlockingBytecode.token!;
        outputs.push({
          lockingBytecode: payoutBytecode,
          valueSatoshis: TOKEN_DUST,
          token: {
            category: token.category,
            nft: token.nft,
          },
        });
      }

      // Whatever BCH is left after covering token-output dust and the fee
      // goes to a plain payout output. Token outputs' valueSatoshis is BCH
      // too, so it's already reserved above — this is just the remainder.
      const reservedForTokenOutputs = outputs.reduce(
        (sum, o) => sum + o.valueSatoshis,
        0n
      );
      const remainder = totalSats - reservedForTokenOutputs - feeSats;

      if (remainder > BCH_DUST) {
        outputs.push({
          lockingBytecode: payoutBytecode,
          valueSatoshis: remainder,
        });
      } else if (remainder < 0n) {
        throw new Error('Insufficient satoshis to cover token outputs and fee');
      }
      // If remainder is dust-sized but nonzero, it's absorbed into the fee
      // rather than creating an unspendable output. Confirm this tolerance
      // matches your fee policy.

      const generatedTransaction = generateTransaction({
        version: 2,
        locktime: 0,
        inputs: inputsFlattened,
        outputs,
      });

      if (!generatedTransaction.success) {
        console.error(generatedTransaction.errors);
        throw new Error('Failed to generate transaction');
      }

      encodedTransaction = encodeTransaction(generatedTransaction.transaction);
    }

    return encodedTransaction;
  }
}
