<template>
  <!-- Auto-Expiry -->
  <div>
  <div class="row items-center no-wrap">
    <q-toggle
      v-if="app.autoExpire.isServiceAvailable.value"
      :label="t('autoExpire')"
      :model-value="app.autoExpire.isAutoExpireEnabled.value"
      @update:model-value="onAutoExpireToggled"
      :disable="!props.wallet?.isFunded.value || props.wallet.isClaimed.value"
    >
      <q-tooltip v-if="!props.wallet?.isFunded.value">{{ t('mustFundFirst') }}</q-tooltip>
      <q-tooltip v-else-if="app.autoExpire.isAutoExpireEnabled.value">
        {{ t('autoExpireOn', { date: app.autoExpire.expiryDate.value }) }}
      </q-tooltip>
      <q-tooltip v-else>
        {{ t('autoReclaimInfo') }}<br /><strong>{{ t('experimentalNote') }}</strong>
      </q-tooltip>
    </q-toggle>
    <!-- Legacy: enabled with no stored payout address — refunds can't rebuild.
         Warning icon at the right; tooltip explains why, click re-enables
         via the existing dialog. -->
    <q-icon
      v-if="app.autoExpire.missingPayoutAddress.value"
      name="warning"
      color="warning"
      size="20px"
      class="q-ml-xs cursor-pointer"
      @click="onAutoExpireToggled(true)"
    >
      <q-tooltip>{{ t('reEnablePrompt') }}</q-tooltip>
    </q-icon>
  </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { type App } from 'src/services/app.js';
import { StampCollection } from 'src/types.js';
import { OraclesService } from 'src/services/oracles.js';
import { showAsyncDialog } from 'src/utils/ui.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

// Translations
import translations from './AutoExpireComponent.i18n.json';

// Components
import AutoExpireDialog from './AutoExpireDialog.vue';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: translations.messages,
});

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const props = defineProps<{
  app: App;
  stampCollection: StampCollection;
  wallet: WalletHD;
}>();

//---------------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------------

async function onAutoExpireToggled(newValue: boolean) {
  // If auto-expiry is being enabled...
  if (newValue) {
    await showAsyncDialog(AutoExpireDialog, {
      app: props.app,
      stampCollection: props.stampCollection,
      wallet: props.wallet,
    });
  }

  // If it is being disabled...
  else {
    await props.app.autoExpire.disable();
  }
}
</script>
