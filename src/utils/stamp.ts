import { app } from '../boot/app'

import { HdPrivateNodeValid } from "@bitauth/libauth";
import { HDPrivateNode } from "./hd-private-node";
import { ref, Ref } from "vue";

import { AddressListUnspent } from 'src/services/electrum-types';

export class Stamp extends HDPrivateNode {
  public balance: Ref<number> = ref(0);

  constructor(node: HdPrivateNodeValid) {
    super(node);
  }

  static fromHDPrivateNode (node: HDPrivateNode): Stamp {
    return new Stamp(node.node);
  }

  static fromSeed (seed: Uint8Array): Stamp {
    return new Stamp(HDPrivateNode.fromSeed(seed).node);
  }

  static fromXPriv (xpriv: string): Stamp {
    return new Stamp(HDPrivateNode.fromXPriv(xpriv).node);
  }

  static generateRandom (): Stamp {
    return new Stamp(HDPrivateNode.generateRandom().node);
  }

  derivePath (path: string): Stamp {
    return new Stamp(super.derivePath(path).node);
  }

  async getUnspentTransactions() {
      const address = this
      .deriveHDPublicNode()
      .publicKey()
      .deriveAddress()
      .toCashAddr();

    const unspentTransactions = (await app.electrum.request(
      'blockchain.address.listunspent',
      address
    )) as AddressListUnspent['response'];

    return unspentTransactions;
  }

  async getAvailableBalance(): Promise<number> {
    const unspentTransactions = await this.getUnspentTransactions()
    this.balance.value = unspentTransactions.reduce((acc, { value }) => acc + value, 0)

    return this.balance.value
  }
}

export default Stamp