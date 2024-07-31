import { HdPrivateNodeValid } from '@bitauth/libauth';
import { HDPrivateNode } from './hd-private-node.js';
import { Transaction } from './transaction.js';

import {
  AddressListUnspent,
  AddressGetHistory,
  TransactionGet,
} from 'src/services/electrum-types';
import { ElectrumService } from 'src/services/electrum';
import { reactive } from 'vue';

export class Stamp extends HDPrivateNode {
  // Dependencies/Services
  public electrum: ElectrumService;

  // Reactive State
  public readonly state = reactive<{
    balance: number;
    transactions: Array<Transaction>;
  }>({
    balance: 0,
    transactions: [],
  });

  constructor(node: HdPrivateNodeValid, electrum: ElectrumService) {
    super(node);
    this.electrum = electrum;
  }

  static fromHDPrivateNode(
    node: HDPrivateNode,
    electrum: ElectrumService
  ): Stamp {
    return new Stamp(node.node, electrum);
  }

  static fromStampSeed(seed: Uint8Array, electrum: ElectrumService): Stamp {
    return new Stamp(HDPrivateNode.fromSeed(seed).node, electrum);
  }

  static fromStampXPriv(xpriv: string, electrum: ElectrumService): Stamp {
    return new Stamp(HDPrivateNode.fromXPriv(xpriv).node, electrum);
  }

  static generateRandomStamp(electrum: ElectrumService): Stamp {
    return new Stamp(HDPrivateNode.generateRandom().node, electrum);
  }

  derivePath(path: string): Stamp {
    return new Stamp(super.derivePath(path).node, this.electrum);
  }

  getAddress() {
    return this.deriveHDPublicNode().publicKey().deriveAddress().toCashAddr();
  }

  async refreshHistory() {
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
    this.state.transactions = decodedTransactions;
  }

  async getUnspentTransactions() {
    const address = this.deriveHDPublicNode()
      .publicKey()
      .deriveAddress()
      .toCashAddr();

    const unspentTransactions = await this.electrum.request<AddressListUnspent>(
      'blockchain.address.listunspent',
      address,
      'include_tokens'
    );

    return unspentTransactions;
  }

  async getAvailableBalance(): Promise<number> {
    const unspentTransactions = await this.getUnspentTransactions();
    this.state.balance = unspentTransactions.reduce(
      (acc, { value }) => acc + value,
      0
    );

    return this.state.balance;
  }
}
