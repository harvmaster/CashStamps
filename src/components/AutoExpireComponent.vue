<template>
  <!-- Auto-Expiry -->
  <div>
    <q-toggle
      v-if="app.autoExpire.isServiceAvailable.value"
      label="Auto Expire"
      :model-value="app.autoExpire.isAutoExpireEnabled.value"
      @update:model-value="onAutoExpireToggled"
      :disable="!props.wallet?.isFunded.value || props.wallet.isClaimed.value"
    >
      <q-tooltip v-if="!props.wallet?.isFunded.value"
        >You must fund your Stamps before you can enable Auto-Expiry</q-tooltip
      >
      <q-tooltip v-else-if="app.autoExpire.isAutoExpireEnabled.value">
        Stamps are set to auto-expire on {{ app.autoExpire.expiryDate.value }}
      </q-tooltip>
      <q-tooltip v-else
        >Automatically reclaim stamps after Expiry Date passes</q-tooltip
      >
    </q-toggle>
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
import translations from './CollectionSummaryComponent.i18n.json';

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
  oracles: OraclesService;
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
