import {
  hexToBin,
  walletTemplateP2pkhNonHd,
  walletTemplateToCompilerBCH,
} from '@bitauth/libauth';
import { PrivateKey } from './private-key.js';
import { Transaction } from './transaction.js';

import {
  AddressListUnspent,
  AddressGetHistory,
  TransactionGet,
} from 'src/services/electrum-types';
import { ElectrumService } from 'src/services/electrum';
import { computed, shallowRef } from 'vue';

export class WalletP2PKH extends PrivateKey {
  // Dependencies/Services
  public electrum: ElectrumService;

  // Reactives.
  public transactions = shallowRef<Array<Transaction>>([]);
  public unspents = shallowRef<AddressListUnspent['response']>([]);

  // Computeds.
  public balance = computed(() => {
    return this.unspents.value.reduce(
      (total, unspent) => total + unspent.value,
      0
    );
  });

  constructor(privateKeyBytes: Uint8Array, electrum: ElectrumService) {
    super(privateKeyBytes);
    this.electrum = electrum;
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

  async getHistory() {
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

    // Set the state.
    this.transactions.value = decodedTransactions;

    return decodedTransactions;
  }

  async getUnspentOutputs() {
    const address = this.getAddress();

    const unspentTransactions = await this.electrum.request<AddressListUnspent>(
      'blockchain.address.listunspent',
      address,
      'include_tokens'
    );

    this.unspents.value = unspentTransactions;

    return unspentTransactions;
  }

  async getUnspentDirectives() {
    // Get a list of unspent outputs.
    const unspentOutputs = await this.getUnspentOutputs();

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
    await Promise.all([this.getUnspentOutputs(), this.getHistory()]);
  }

  async onAddressNotification(status: string | null) {
    // If status is null, it simply means that our subscribe call to Electrum was successful.
    if (!status) {
      return;
    }

    // Refresh our wallet's state.
    await Promise.all([this.getHistory(), this.getUnspentOutputs()]);
  }
}
