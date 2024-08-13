import { ElectrumService } from 'src/services/electrum.js';
import { WalletHDVue } from 'src/libcash/vue/index.js';

import { computed } from 'vue';

export class StampsWallet extends WalletHDVue {
  // Computeds.
  public rIsFunded = computed(() => {
    return this.rWallets.value.every(
      (node) => node.rTransactions.value.length > 0
    );
  });
  public rIsClaimed = computed(() => {
    return this.rIsFunded.value && this.rBalance.value <= 0;
  });
  public rClaimedStamps = computed(() => {
    return this.rWallets.value.filter(
      (wallet) =>
        wallet.rTransactions.value.length && wallet.rBalance.value === 0
    ).length;
  });

  constructor(mnemonic: string, electrum: ElectrumService) {
    super(mnemonic, electrum);
  }
}
