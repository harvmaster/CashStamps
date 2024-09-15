<template>
  <div class="row q-col-gutter-x-md">
    <!-- Form and Summary -->
    <div class="col-md-9 col-12">
      <div class="column q-col-gutter-y-md">
        <CollectionFormComponent
          :oracles="app.oracles"
          :wallet="props.wallet"
          v-model="collection"
        />

        <CollectionSummaryComponent
          :oracles="app.oracles"
          :stampCollection="collection"
          :wallet="props.wallet"
        />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="col-md-3 col-12">
      <div class="column q-col-gutter-y-md">
        <!-- Fund Stamps -->
        <div>
          <q-btn
            :disable="
              props.wallet.isFunded.value ||
              !collection.quantity ||
              !collection.amount
            "
            :label="t('fundStamps')"
            color="primary"
            @click="showFundingDialog"
            class="full-width"
          />
        </div>

        <!-- Reclaim Stamps -->
        <div>
          <q-btn
            :disable="
              !props.wallet.isFunded.value || props.wallet.isClaimed.value
            "
            :label="t('reclaimStamps')"
            color="secondary"
            @click="showReclaimDialog"
            class="full-width"
          />
        </div>

        <!-- Funded/Not Funded -->
        <div class="flex justify-center">
          <q-chip
            v-if="props.wallet.isClaimed.value"
            color="primary"
            text-color="white"
            icon="check_circle"
            >{{ t('allClaimed') }}</q-chip
          >
          <q-chip
            v-else-if="props.wallet?.isFunded.value"
            color="primary"
            text-color="white"
            icon="check_circle"
            >{{ t('funded') }}</q-chip
          >
          <q-chip v-else color="warning" text-color="white">{{ t('notFunded') }}</q-chip>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal for showing Funding TX Qr Code -->
  <FundingDialog
    ref="fundingQrCode"
    :oracles="app.oracles"
    :stampCollection="collection"
    :wallet="props.wallet"
  />

  <!-- Modal to display instructions for Redeeming unclaimed wallets -->
  <ReclaimDialog
    ref="reclaimDialog"
    :electrum="app.electrum"
    :wallet="props.wallet"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

// App / Service / Utils Imports
import type { StampCollection } from 'src/types.js';
import { App } from 'src/services/app.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

// Components
import CollectionFormComponent from './CollectionFormComponent.vue';
import CollectionSummaryComponent from './CollectionSummaryComponent.vue';
import FundingDialog from './FundingDialog.vue';
import ReclaimDialog from './ReclaimDialog.vue';

// Translations
import translations from './CollectionManagerComponent.i18n.json' 

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const collection = defineModel<Required<StampCollection>>({
  required: true,
});

const props = defineProps<{
  app: App;
  wallet: WalletHD;
}>();

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: translations.messages
});

// Elements
const fundingQrCode = ref<typeof FundingDialog | null>(null);
const reclaimDialog = ref<typeof ReclaimDialog | null>(null);

//---------------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------------

async function showFundingDialog() {
  fundingQrCode.value?.toggleVisible();
}

async function showReclaimDialog() {
  reclaimDialog.value?.toggleVisible();
}
</script>
