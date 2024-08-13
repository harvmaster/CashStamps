import { ElectrumService } from 'src/services/electrum.js';
import { WalletHD } from 'src/libcash/wallet/index.js';
import { WalletP2PKHVue } from './wallet-p2pkh-vue.js';

import { computed, shallowRef } from 'vue';

export class WalletHDVue extends WalletHD<WalletP2PKHVue> {
  // Reactive State.
  public rWallets = shallowRef<Array<WalletP2PKHVue>>([]);

  // Computeds.
  public rBalance = computed(() => {
    return this.rWallets.value.reduce(
      (total, node) => total + node.rBalance.value,
      0
    );
  });

  constructor(mnemonic: string, electrum: ElectrumService) {
    super(
      mnemonic,
      electrum,
      (privateKeyBytes, electrum) =>
        new WalletP2PKHVue(privateKeyBytes, electrum)
    );

    this.events.on(
      'walletsUpdated',
      (wallets) => (this.rWallets.value = wallets)
    );
  }
}
