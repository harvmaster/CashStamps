import { ElectrumService } from 'src/services/electrum.js';
import { WalletHD } from 'src/libcash/wallet/index.js';
import { WalletP2PKHVue, useWalletP2PKHVue } from './wallet-p2pkh-vue.js';

import { computed, ref, shallowRef } from 'vue';

import { HdPrivateNodeValid } from '@bitauth/libauth';

export class WalletHDVue extends WalletHD<WalletP2PKHVue> {
  // Reactive State.
  public rShouldMonitor = ref(false);
  public rWallets = shallowRef<Array<WalletP2PKHVue>>([]);

  // Computeds.
  public rBalance = computed(() => {
    return this.rWallets.value.reduce(
      (total, node) => total + node.rBalance.value,
      0
    );
  });

  constructor(
    node: HdPrivateNodeValid,
    electrum: ElectrumService,
    walletFactory = useWalletP2PKHVue
  ) {
    super(node, electrum, walletFactory);

    this.events.on(
      'walletsUpdated',
      (wallets) => (this.rWallets.value = wallets)
    );

    this.events.on(
      'shouldMonitorUpdated',
      (shouldMonitor) => (this.rShouldMonitor.value = shouldMonitor)
    );
  }
}
