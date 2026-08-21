<template>
  <q-card style="max-width: 500px; width: 100%">
    <q-card-section class="text-h6 text-center"> Auto-Expire </q-card-section>

    <q-card-section class="column q-gutter-md">
      <div class="text-body1">
        Enter the Bitcoin Cash Address that the remaining balances should be
        sent to on the expiry date ({{ props.stampCollection.expiry }}).
      </div>
      <q-form @submit="submitToSettlementService">
        <q-input
          :label="t('payoutAddress')"
          v-model="state.payoutAddress"
          :rules="[(val) => Address.isValid(val) || t('invalidBCHAddress')]"
          filled
        />
        <q-btn
          color="primary"
          label="Enable Auto-Expire"
          type="submit"
          class="full-width"
        />
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import { type App } from 'src/services/app.js';
import { type StampCollection } from 'src/types.js';
import { Address } from 'src/utils/address.js';
import { type AsyncDialogProps } from 'src/utils/ui.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

import translations from './AutoExpireDialog.i18n.json';

const $q = useQuasar();
const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: translations.messages,
});

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const props = defineProps<
  AsyncDialogProps<boolean> & {
    app: App;
    stampCollection: StampCollection;
    wallet: WalletHD;
  }
>();

const state = reactive<{
  payoutAddress: string;
}>({
  payoutAddress: '',
});

//---------------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------------

async function submitToSettlementService() {
  try {
    $q.loading.show();

    const address = Address.fromCashAddrOrLegacy(state.payoutAddress);

    await props.app.autoExpire.enable({
      payoutBytecode: address.toLockscriptBytes(),
    });

    props.onDialogOK?.(true);

    $q.loading.hide();

    $q.notify({
      color: 'primary',
      message: 'Auto-Expire Enabled',
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
