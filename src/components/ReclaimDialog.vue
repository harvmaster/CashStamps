<template>
  <q-dialog v-model="state.visible">
    <q-card style="max-width: 500px; width: 100%">
      <q-card-section class="text-h6 text-center">
        {{ t('reclaimStamps') }}
      </q-card-section>

      <q-card-section class="column q-gutter-md">
        <div class="text-body1">
          {{ t('enterPayoutAddress') }}
        </div>
        <q-form @submit="sweepStamps" class="">
          <q-input
            :label="t('payoutAddress')"
            v-model="state.payoutAddress"
            :rules="[
              (val) => Address.isValid(val) || t('invalidBCHAddress'),
            ]"
            filled
          />
          <q-btn
            color="primary"
            :label="t('reclaim')"
            type="submit"
            class="full-width"
          />
        </q-form>
        <div>
          <small>{{ t('bip39Info') }}</small>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import { ElectrumService } from 'src/services/electrum.js';
import type { TransactionBroadcast } from 'src/services/electrum-types';
import { Address } from 'src/utils/address.js';
import { waitFor } from 'src/utils/misc.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

import { binToHex } from '@bitauth/libauth';

const $q = useQuasar();
const { t } = useI18n();

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

// Props.
const props = defineProps<{
  electrum: ElectrumService;
  wallet: WalletHD;
}>();

// Reactives.
const state = reactive<{
  visible: boolean;
  payoutAddress: string;
}>({
  visible: false,
  payoutAddress: '',
});

// Expose.
defineExpose({
  toggleVisible,
});

//---------------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------------

function toggleVisible() {
  state.visible = !state.visible;
}

async function sweepStamps() {
  try {
    $q.loading.show();

    const address = Address.fromCashAddrOrLegacy(state.payoutAddress);

    const transaction = await props.wallet.sweep(address.toLockscriptBytes());

    await props.electrum.request<TransactionBroadcast>(
      'blockchain.transaction.broadcast',
      binToHex(transaction)
    );

    // Wait for our collection to be marked as claimed.
    await waitFor(props.wallet.isClaimed, true);

    // Hide the dialog
    toggleVisible();

    // Hide the loading indicator.
    $q.loading.hide();

    // Create a notification to notify user stamps were reclaimed.
    $q.notify({
      color: 'primary',
      message: t('stampsReclaimed'),
    });
  } catch (error) {
    console.error(error);

    $q.loading.hide();

    $q.notify({
      color: 'negative',
      message: `${error}`,
    });
  }
}
</script>
