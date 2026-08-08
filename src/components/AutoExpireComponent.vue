<template>
  <!-- Auto-Expiry -->
  <div>
    <q-toggle
      v-if="app.autoExpire.isServiceAvailable.value"
      :model-value="app.autoExpire.isAutoExpireEnabled.value"
      @update:model-value="onAutoExpireToggled"
      label="Auto-Expire"
      :disable="!props.wallet?.isFunded.value || props.wallet.isClaimed.value"
    >
      <q-tooltip v-if="!props.wallet?.isFunded.value"
        >You must fund your Stamps before you can enable Auto-Expiry</q-tooltip
      >
      <q-tooltip v-else
        >Automatically reclaim stamps after Expiry Date passes</q-tooltip
      >
    </q-toggle>
  </div>

  <!-- Modal for collecting Payout Address for Auto-Expiry -->
  <AutoExpireDialog
    ref="autoExpireDialog"
    :app="app"
    :stampCollection="props.stampCollection"
    :wallet="props.wallet"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { type App } from 'src/services/app.js';
import { StampCollection } from 'src/types.js';
import { OraclesService } from 'src/services/oracles.js';
import { Satoshis } from 'src/utils/satoshis.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

// Translations
import translations from './CollectionSummaryComponent.i18n.json';

// Components
import AutoExpireDialog from './AutoExpireDialog.vue';

import { SettlementServiceClient } from '@infracash/settlement-service';
import { binToHex, sha256 } from '@bitauth/libauth';

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

// Elements
const autoExpireDialog = ref<typeof AutoExpireDialog | null>(null);

//---------------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------------

async function onAutoExpireToggled(newValue: boolean) {
  // If auto-expiry is being enabled...
  if (newValue) {
    showAutoExpireDialog();
  }

  // If it is being disabled...
  else {
    await props.app.autoExpire.disable();
  }
}

async function showAutoExpireDialog() {
  autoExpireDialog.value?.toggleVisible();
}
</script>
