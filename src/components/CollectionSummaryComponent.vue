<template>
  <div class="row q-col-gutter-md">
    <!-- If Wallet is NOT Funded... -->
    <template v-if="!props.wallet?.isFunded.value">
      <!-- Total value of the TX in Fiat -->
      <div class="col-auto">
        <div class="text-body2">{{ t('totalDue') }}</div>
        <div class="text-h6">
          {{ fundingDue }}
          <small>{{ currencyName }}</small>
        </div>
      </div>

      <!-- Total value of the TX in BCH -->
      <div class="col-auto">
        <div class="text-body2">{{ t('totalDue') }}</div>
        <div class="text-h6">
          {{ fundingDueBCH }}
          <small>BCH</small>
        </div>
      </div>
    </template>

    <!-- If Wallet IS Funded... -->
    <template v-else>
      <!-- Number of Claimed Stamps/Total Stamps -->
      <div class="col-auto">
        <div class="text-body2">{{ t('claimed') }}</div>
        <div class="text-h6">
          {{ props.wallet.claimedStamps.value }} /
          {{ props.wallet.wallets.value.length }}
        </div>
      </div>

      <!-- Balance Fiat -->
      <!--
      <div class="col-auto">
        <div class="text-body2">{{ t('currentStampValue') }}</div>
        <div class="text-h6">
          {{ convertToFiat(props.stampCollection.currency, currentStampValue) }}
          <small>{{ currencyName }}</small>
        </div>
      </div>
      -->

      <!-- Balance Fiat -->
      <div class="col-auto">
        <div class="text-body2">{{ t('totalRemaining') }}</div>
        <div class="text-h6">
          {{
            convertToFiat(
              props.stampCollection.currency,
              props.wallet?.balance.value
            )
          }}
          <small>{{ currencyName }}</small>
        </div>
      </div>

      <!-- Balance BCH -->
      <div class="col-auto">
        <div class="text-body2">{{ t('totalRemaining') }}</div>
        <div class="text-h6">
          {{ Satoshis.fromSats(props.wallet?.balance.value || 0).toBCH() }}
          <small>BCH</small>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { StampCollection } from 'src/types.js';
import { OraclesService } from 'src/services/oracles.js';
import { Satoshis } from 'src/utils/satoshis.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

// Translations
import translations from './CollectionSummaryComponent.i18n.json';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: translations.messages,
});

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const props = defineProps<{
  stampCollection: StampCollection;
  oracles: OraclesService;
  wallet: WalletHD;
}>();

const currencyName = computed(() => {
  return props.oracles.getOracleUnitCode(props.stampCollection.currency);
});

const fundingDue = computed(() => {
  const decimalPlaces = props.oracles.getOracleDecimalPlaces(
    props.stampCollection.currency
  );
  return (
    props.stampCollection.quantity * props.stampCollection.amount || 0
  ).toFixed(decimalPlaces);
});

const fundingDueBCH = computed(() => {
  const fundingBch =
    Number(fundingDue.value) /
    props.oracles.getOraclePriceCommonUnits(props.stampCollection.currency);
  return fundingBch.toFixed(8);
});

const totalStamps = computed(() => {
  return props.wallet.wallets.value.length;
});

const fundingSats = computed(() => {
  const sats = props.wallet.wallets.value.reduce(
    (sats, wallet) =>
      (sats +=
        wallet.transactions.value[0]?.getOutputs()[0]?.valueSatoshis || 0n),
    0n
  );

  return sats;
});

const _currentStampValue = computed(() => {
  // Calculate the current value of each stamp in BCH.
  const eachStampBch = Number(fundingSats.value) / totalStamps.value;

  return eachStampBch;
});

//---------------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------------

function convertToFiat(oraclePublicKey: string, sats: number) {
  const commonUnits = props.oracles.convertFromSats(oraclePublicKey, sats);
  return props.oracles.formatCommonUnits(oraclePublicKey, commonUnits);
}
</script>
