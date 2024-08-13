import { WalletP2PKH } from 'src/libcash/wallet/index.js';

import { type AddressListUnspent } from 'src/services/electrum-types';
import { ElectrumService } from 'src/services/electrum.js';
import { Transaction } from 'src/libcash/primitives/index.js';

import { computed, shallowRef } from 'vue';

export class WalletP2PKHVue extends WalletP2PKH {
  // Reactive State.
  public rUnspents = shallowRef<AddressListUnspent['response']>([]);
  public rTransactions = shallowRef<Array<Transaction>>([]);

  // Computeds.
  public rBalance = computed(() => {
    return this.rUnspents.value.reduce(
      (total, unspent) => total + unspent.value,
      0
    );
  });

  constructor(privateKeyBytes: Uint8Array, electrum: ElectrumService) {
    super(privateKeyBytes, electrum);

    this.events.on('unspentsUpdated', (unspents) => {
      this.rUnspents.value = unspents;
    });

    this.events.on('transactionsUpdated', (transactions) => {
      this.rTransactions.value = transactions;
    });
  }
}
