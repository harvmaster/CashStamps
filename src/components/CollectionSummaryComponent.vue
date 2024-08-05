<template>
  <div class="row q-col-gutter-md">
    <!-- Not Funded -->
    <template v-if="!props.wallet?.isFunded.value">
      <!-- Total value of the TX in Fiat -->
      <div class="col-auto">
        <div class="text-body2">Total Due ({{ currencyName }})</div>
        <div class="text-h6">
          {{ totalAmount }}
          {{ currencyName }}
        </div>
      </div>
    </template>

    <!-- Funded -->
    <template v-else>
      <!-- Number of Claimed Stamps -->
      <div v-if="props.wallet?.isFunded.value" class="col-auto">
        <div class="text-body2">Claimed</div>
        <div class="text-h6">{{ claimedStamps }} / {{ totalStamps }}</div>
      </div>

      <!-- Balance Fiat -->
      <div v-if="props.wallet?.isFunded.value" class="col-auto">
        <div class="text-body2">Each Stamp</div>
        <div class="text-h6">{{ convertToFiat(props.stampCollection.currency, eachStampAmount) }} {{ currencyName }}</div>
      </div>

      <!-- Balance Fiat -->
      <div v-if="props.wallet?.isFunded.value" class="col-auto">
        <div class="text-body2">Total Remaining</div>
        <div class="text-h6">{{ convertToFiat(props.stampCollection.currency, props.wallet?.balance.value) }} {{ currencyName }}</div>
      </div>

      <!-- Balance BCH -->
      <div v-if="props.wallet?.isFunded.value" class="col-auto">
        <div class="text-body2">Total Remaining</div>
        <div class="text-h6">{{ Satoshis.fromSats(props.wallet?.balance.value || 0).toBCH() }} BCH</div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { computed } from 'vue';

import { StampCollection } from 'src/types.js';
import { OraclesService } from 'src/services/oracles.js';
import { Satoshis } from 'src/utils/satoshis.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const props = defineProps<{
  stampCollection: StampCollection;
  oracles: OraclesService;
  wallet?: WalletHD;
}>();

const currencyName = computed(() => {
  return props.oracles.getOracleUnitCode(props.stampCollection.currency);
});

const totalAmount = computed(() => {
  const decimalPlaces = props.oracles.getOracleDecimalPlaces(
    props.stampCollection.currency
  );
  return (
    props.stampCollection.quantity * props.stampCollection.amount || 0
  ).toFixed(decimalPlaces);
});

const claimedStamps = computed(() => {
  if (!props.wallet) {
    return 0;
  }

  return props.wallet.wallets.value.filter(
    (wallet) => wallet.balance.value === 0
  ).length;
});

const totalStamps = computed(() => {
  if (!props.wallet) {
    return 0;
  }

  return props.wallet.wallets.value.length;
});

const eachStampAmount = computed(() => {
  if (!props.wallet) {
    return 0;
  }

  if(props.wallet.balance.value <= 0) {
    return 0;
  }

  // Calculate the current value of each stamp in BCH.
  const eachStampBch = props.wallet?.balance.value / (totalStamps.value - claimedStamps.value);

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
