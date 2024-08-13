<template>
  <q-dialog v-model="state.visible">
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
import { reactive } from 'vue';
import { useQuasar } from 'quasar';

import { ElectrumService } from 'src/services/electrum.js';
import type { TransactionBroadcast } from 'src/services/electrum-types';
import { Address } from 'src/libcash/primitives/index.js';
import { waitFor } from 'src/utils/misc.js';
import { StampsWallet } from 'src/utils/stamps-wallet.js';

import { binToHex } from '@bitauth/libauth';

const $q = useQuasar();

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

// Props.
const props = defineProps<{
  electrum: ElectrumService;
  wallet: StampsWallet;
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
    await waitFor(props.wallet.rIsClaimed, true);

    // Hide the dialog
    toggleVisible();

    // Hide the loading indicator.
    $q.loading.hide();

    // Create a notification to notify user stamps were reclaimed.
    $q.notify({
      color: 'primary',
      message: 'Stamps reclaimed successfully!',
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
