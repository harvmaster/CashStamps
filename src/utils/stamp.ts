import { HdPrivateNodeValid } from '@bitauth/libauth';
import { HDPrivateNode } from './hd-private-node';

import { AddressListUnspent } from 'src/services/electrum-types';
import { ElectrumService } from 'src/services/electrum';

export class Stamp extends HDPrivateNode {
  public balance = 0;
  public electrum: ElectrumService;

  constructor(node: HdPrivateNodeValid, electrum: ElectrumService) {
    super(node);
    this.electrum = electrum;
  }

  static fromHDPrivateNode(node: HDPrivateNode, electrum: ElectrumService): Stamp {
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

  async getUnspentTransactions() {
    const address = this.deriveHDPublicNode()
      .publicKey()
      .deriveAddress()
      .toCashAddr();

    const unspentTransactions = (await this.electrum.request(
      'blockchain.address.listunspent',
      address
    )) as AddressListUnspent['response'];

    return unspentTransactions;
  }

  async getAvailableBalance(): Promise<number> {
    const unspentTransactions = await this.getUnspentTransactions();
    this.balance = unspentTransactions.reduce(
      (acc, { value }) => acc + value,
      0
    );

    return this.balance;
  }
}

export default Stamp;
