import { Transaction } from 'src/libcash/primitives/index.js';
import { EventEmitter } from 'src/libcash/utils/index.js';
import {
  type AddressListUnspent,
  type AddressGetHistory,
  type TransactionGet,
} from 'src/services/electrum-types';
import { ElectrumService } from 'src/services/electrum';

import { WalletBase } from './wallet-base.js';

import {
  hexToBin,
  walletTemplateP2pkhNonHd,
  walletTemplateToCompilerBCH,
} from '@bitauth/libauth';

export type WalletP2PKHEvents = {
  transactionsUpdated: Array<Transaction>;
  unspentsUpdated: AddressListUnspent['response'];
};

export class WalletP2PKH extends WalletBase {
  // Events.
  public events: EventEmitter<WalletP2PKHEvents> = new EventEmitter();

  // State.
  public transactions: Array<Transaction> = [];
  public unspents: AddressListUnspent['response'] = [];

  constructor(privateKeyBytes: Uint8Array, electrum: ElectrumService) {
    super(privateKeyBytes, electrum);

    // Monitor the following properties and emit an event when they change.
    this.events.monitorProperty(this, 'transactions', 'transactionsUpdated');
    this.events.monitorProperty(this, 'unspents', 'unspentsUpdated');
  }

  async destroy() {
    this.events.removeAllListeners();
  }

  async startMonitoring() {
    await this.electrum.subscribeAddress(
      this.getAddress(),
      this.onAddressNotification.bind(this)
    );
  }

  async stopMonitoring() {
    await this.electrum.unsubscribeAddress(
      this.getAddress(),
      this.onAddressNotification.bind(this)
    );
  }

  getAddress() {
    return this.derivePublicKey().deriveAddress().toCashAddr();
  }

  async fetchHistory() {
    // Get this node's address.
    const address = this.getAddress();

    // Get the history of the address from electrum
    const history = await this.electrum.request<AddressGetHistory>(
      'blockchain.address.get_history',
      address,
      0,
      -1
    );

    // Get the transactions for each history item.
    const transactions = await Promise.all(
      history.map((item) =>
        this.electrum.request<TransactionGet>(
          'blockchain.transaction.get',
          item.tx_hash,
          false
        )
      )
    );

    // Decode the transactions.
    const decodedTransactions = transactions.map((tx) =>
      Transaction.fromHex(tx)
    );

    // Store the transactions.
    this.transactions = decodedTransactions;

    return decodedTransactions;
  }

  async fetchUnspentOutputs() {
    const address = this.getAddress();

    const unspentOutputs = await this.electrum.request<AddressListUnspent>(
      'blockchain.address.listunspent',
      address,
      'include_tokens'
    );

    // Emit event with unspent outputs.
    this.unspents = unspentOutputs;

    return unspentOutputs;
  }

  async getUnspentDirectives() {
    // Get a list of unspent outputs.
    const unspentOutputs = await this.fetchUnspentOutputs();

    // Create our P2PKH Compiler.
    const compilerP2PKH = walletTemplateToCompilerBCH(walletTemplateP2pkhNonHd);

    // Compile our inputs.
    const inputDirectives = unspentOutputs.map((unspent) => ({
      outpointIndex: unspent.tx_pos,
      outpointTransactionHash: hexToBin(unspent.tx_hash),
      sequenceNumber: 0,
      unlockingBytecode: {
        compiler: compilerP2PKH,
        data: {
          keys: { privateKeys: { key: this.toBytes() } },
        },
        script: 'unlock',
        valueSatoshis: BigInt(unspent.value),
      },
    }));

    // Return the directives.
    return inputDirectives;
  }

  async refresh(): Promise<void> {
    await Promise.all([this.fetchUnspentOutputs(), this.fetchHistory()]);
  }

  async onAddressNotification(status: string | null) {
    // If status is null, it simply means that our subscribe call to Electrum was successful.
    if (!status) {
      return;
    }

    // Refresh our wallet's state.
    await this.refresh();
  }
}

export type WalletP2PKHFactory<T> = (
  privateKeyBytes: Uint8Array,
  electrum: ElectrumService
) => T;

export const WalletP2PKHDefault = <T extends WalletP2PKH>(
  privateKeyBytes: Uint8Array,
  electrum: ElectrumService
): T => new WalletP2PKH(privateKeyBytes, electrum) as T;
