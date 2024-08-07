<template>
  <div class="row q-col-gutter-md">
    <!-- If Wallet is NOT Funded... -->
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

    <!-- If Wallet IS Funded... -->
    <template v-else>
      <!-- Number of Claimed Stamps -->
      <div class="col-auto">
        <div class="text-body2">Claimed</div>
        <div class="text-h6">{{ claimedStamps }} / {{ totalStamps }}</div>
      </div>

      <!-- Balance Fiat -->
      <div class="col-auto">
        <div class="text-body2">Current Stamp Value</div>
        <div class="text-h6">
          {{ convertToFiat(props.stampCollection.currency, currentStampValue) }}
          <small>{{ currencyName }}</small>
        </div>
      </div>

      <!-- Balance Fiat -->
      <div class="col-auto">
        <div class="text-body2">Total Remaining</div>
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
        <div class="text-body2">Total Remaining</div>
        <div class="text-h6">
          {{ Satoshis.fromSats(props.wallet?.balance.value || 0).toBCH() }}
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
import { Satoshis } from 'src/utils/satoshis.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

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

const totalAmount = computed(() => {
  const decimalPlaces = props.oracles.getOracleDecimalPlaces(
    props.stampCollection.currency
  );
  return (
    props.stampCollection.quantity * props.stampCollection.amount || 0
  ).toFixed(decimalPlaces);
});

const claimedStamps = computed(() => {
  return props.wallet.wallets.value.filter(
    (wallet) => wallet.balance.value === 0
  ).length;
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

const currentStampValue = computed(() => {
  if (!props.wallet) {
    return 0;
  }

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
