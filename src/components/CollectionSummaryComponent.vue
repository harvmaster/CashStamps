<template>
  <div class="row q-col-gutter-md">
    <!-- If Wallet is NOT Funded... -->
    <template v-if="!props.wallet?.rIsFunded.value">
      <!-- Total value of the TX in Fiat -->
      <div class="col-auto">
        <div class="text-body2">Total Due</div>
        <div class="text-h6">
          {{ fundingDue }}
          <small>{{ currencyName }}</small>
        </div>
      </div>

      <!-- Total value of the TX in BCH -->
      <div class="col-auto">
        <div class="text-body2">Total Due</div>
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
        <div class="text-body2">Claimed</div>
        <div class="text-h6">
          {{ props.wallet.rClaimedStamps.value }} /
          {{ props.wallet.rWallets.value.length }}
        </div>
      </div>

      <!-- Balance Fiat -->
      <!-- TODO: This is currently broken and a hard value to retrieve -->
      <!--
      <div class="col-auto">
        <div class="text-body2">Current Stamp Value</div>
        <div class="text-h6">
          {{ convertToFiat(props.stampCollection.currency, currentStampValue) }}
          <small>{{ currencyName }}</small>
        </div>
      </div>
      -->

      <!-- Balance Fiat -->
      <div class="col-auto">
        <div class="text-body2">Total Remaining</div>
        <div class="text-h6">
          {{
            convertToFiat(
              props.stampCollection.currency,
              props.wallet.rBalance.value
            )
          }}
          <small>{{ currencyName }}</small>
        </div>
      </div>

      <!-- Balance BCH -->
      <div class="col-auto">
        <div class="text-body2">Total Remaining</div>
        <div class="text-h6">
          {{ Satoshis.fromSats(props.wallet.rBalance.value || 0).toBCH() }}
          <small>BCH</small>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { computed } from 'vue';

import { StampCollection } from 'src/types.js';
import { OraclesService } from 'src/services/oracles.js';
import { Satoshis } from 'src/libcash/primitives/satoshis.js';
import { StampsWallet } from 'src/utils/stamps-wallet.js';

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const props = defineProps<{
  stampCollection: StampCollection;
  oracles: OraclesService;
  wallet: StampsWallet;
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
  return props.wallet.rWallets.value.length;
});

const fundingSats = computed(() => {
  const sats = props.wallet.rWallets.value.reduce(
    (sats, wallet) =>
      (sats +=
        wallet.rTransactions.value[0]?.getOutputs()[0]?.valueSatoshis || 0n),
    0n
  );

  return sats;
});

const currentStampValue = computed(() => {
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
