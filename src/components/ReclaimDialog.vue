<template>
  <q-dialog v-model="visible">
    <q-card style="max-width: 500px; width: 100%">
      <q-card-section class="text-h6 text-center">
        Reclaim Remaining Stamps
      </q-card-section>

      <q-card-section class="column q-gutter-md">
        <div class="text-body1">
          Enter the BitcoinCash Address that the remaining balances should be
          sent to.
        </div>
        <q-form @submit="sweepStamps" class="">
          <q-input
            label="Payout Address"
            v-model="state.payoutAddress"
            :rules="[
              (val) => Address.isValid(val) || 'Invalid Bitcoin Cash Address',
            ]"
            filled
          />
          <q-btn
            color="primary"
            label="Reclaim"
            type="submit"
            class="full-width"
          />
        </q-form>
        <div>
          <small
            >NOTE: Your stamp collection is a BIP39 HD Wallet using derivation
            path m/44'/145'/0'. This means that you can also import your
            mnemonic into Electron Cash (and other BIP39 compatible wallets) and
            manage stamp balances from there.</small
          >
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useQuasar } from 'quasar';

import { ElectrumService } from 'src/services/electrum.js';
import type { TransactionBroadcast } from 'src/services/electrum-types';
import { Address } from 'src/utils/address.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

import { binToHex } from '@bitauth/libauth';

const $q = useQuasar();

const visible = ref(false);
const toggleVisible = () => {
  visible.value = !visible.value;
};

// Props.
const props = defineProps<{
  electrum: ElectrumService;
  wallet: WalletHD;
}>();

const state = reactive({
  payoutAddress: '',
});

async function sweepStamps() {
  try {
    $q.loading.show();

    const address = Address.fromCashAddrOrLegacy(state.payoutAddress);

    const transaction = await props.wallet.sweep(address.toLockscriptBytes());

    await props.electrum.request<TransactionBroadcast>(
      'blockchain.transaction.broadcast',
      binToHex(transaction)
    );

    // NOTE: This is a hack.
    //       We have to wait for the tx to propagate before refreshing.
    //       Subscriptions in our current Electrum version are broken.
    //       So we just wait 5 seconds instead.
    setTimeout(async () => {
      await props.wallet.refreshChildNodes();

      $q.loading.hide();

      $q.notify({
        color: 'primary',
        message: 'Stamps reclaimed successfully!',
      });

      toggleVisible();
    }, 2500);
  } catch (error) {
    console.error(error);

    $q.loading.hide();

    $q.notify({
      color: 'negative',
      message: `${error}`,
    });
  }
}

defineExpose({
  toggleVisible,
});
</script>
