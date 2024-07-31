<template>
  <div class="row q-col-gutter-md">
    <!-- Total value of the TX in BCH -->
    <div class="col-auto">
      <div class="text-body2">Total Value (BCH)</div>
      <div class="text-h6">
        {{ totalAmountSats.toBCH() }}
        {{ currencyName }}
      </div>
    </div>

    <!-- Total value of the TX in Fiat -->
    <div class="col-auto">
      <div class="text-body2">Total Value ({{ currencyName }})</div>
      <div class="text-h6">
        {{ totalAmount }}
        {{ currencyName }}
      </div>
    </div>

    <!-- Number of Claimed Stamps -->
    <div v-if="props.wallet.state.funded" class="col-auto">
      <div class="text-body2">Claimed</div>
      <div class="text-h6">
        {{ claimedStamps }} / {{ totalStamps }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { computed } from 'vue';

import { StampCollection } from 'src/types.js';
import { OraclesService } from 'src/services/oracles.js';
import { Satoshis } from 'src/utils/satoshis.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

const props = defineProps<{
  stampCollection: StampCollection;
  oracles: OraclesService;
  wallet: WalletHD;
  funded: boolean;
}>();

//---------------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------------

const currencyName = computed(() => {
  return props.oracles.getOracleUnitCode(props.stampCollection.currency);
});

const totalAmountSats = computed(() => {
  return Satoshis.fromSats(
    props.stampCollection.amountSats * props.stampCollection.quantity || 0
  );
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
  return props.wallet.state.stamps.filter((node) => node.state.balance === 0).length;
});

const totalStamps = computed(() => {
  return props.wallet.state.stamps.length;
});
</script>
