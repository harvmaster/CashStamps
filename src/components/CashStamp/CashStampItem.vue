<template>
  <div class="" style="height: fit-content">
    <div class="cash-stamp_item q-pa-md column items-center relative">
      <!-- Claimed Badge -->
      <div v-if="claimed" class="col-auto row justify-end absolute" style="top: 0; right: 0; padding: 1em;">
        <q-badge class="q-pa-sm" style="background-color: #1DC18E; font-size: 1rem" label="Claimed" />
      </div>

      <!-- QR Code -->
      <div class="col-auto row square q-pa-md">
        <div ref="qrElement" class="col-12" />
      </div>

      <!-- Value -->
      <div class="col-auto row justify-center">
        <div v-if="loadingFunding" class="col-12 text-h5 no-margin no-padding text-weight-medium">
          <q-spinner />
        </div>
        <div v-else class="col-12 text-h5 no-margin no-padding text-weight-medium">
          {{ stampAmount}}
          {{ currencyName }}
        </div>
      </div>

      <!-- Create-date -->
      <div class="col-auto row justify-center">
        <div class="col-12 no-margin no-padding text-weight-medium text-grey-8">
          {{ createdAt }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cash-stamp_item {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  border: dashed 2px #1DC18E;
}
</style>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import QRCode from 'easyqrcodejs';

import { app } from 'src/boot/app';
import { HDPrivateNode } from 'src/utils/hd-private-node';
import { FundingOptions } from 'src/services/stamp-collection';

export type CashStampItemProps = {
  id: number;
  stamp: HDPrivateNode;
  funding: FundingOptions;
  loadingFunding: boolean;
  claimed: boolean;
};

const props = defineProps<CashStampItemProps>();
const qrElement = ref<HTMLDivElement | null>(null);

// Create human readable time and date `hh:MMam/pm DD/MM/YYYY`
const createdAt = computed(() => {
  const date = new Date(props.funding.funded || Date.now());
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Format hours and minutes
  const formattedHours = hours % 12 || 12;

  let formattedMinutes: string | number = minutes;
  if (formattedMinutes < 10) formattedMinutes = '0' + formattedMinutes;

  // Format date as `hh:MMam/pm DD/MM/YYYY`
  return `
          ${formattedHours}:${ formattedMinutes}${hours / 12 < 1 ? 'am' : 'pm'} 
          ${date.toLocaleDateString()}
        `;
});

// Get the currency name, Currencies are stored as the public key to that currency for the oracle
const currencyName = computed(() => {
  const currency = props.funding?.currency;
  if (currency === 'BCH') return 'BCH';

  return app.oracles.oracleMetadataStore[currency]
    .sourceNumeratorUnitCode || 'unknown';
});

// Create a human readable amount. Fiat get 2 decimal places, BCH gets 8 (empty 0s are removed for BCH)
const stampAmount = computed(() => {
  // Remove trailing zeros
  const removeTrailingZeros = (value: string) => {
    return value.replace(/\.?0+$/, '');
  };

  // Return the amount with the correct number of decimal places
  return currencyName.value === 'BCH' ?
    removeTrailingZeros(props.funding.value.toFixed(8))
    // props.wallet.funding.amount
    : props.funding.value.toFixed(2);
});

// Create QR Code when loaded
onMounted(() => {
  if (qrElement.value) {
    const wif = props.stamp.privateKey().toWif();

    new QRCode(qrElement.value, {
      text: wif,
      width: 128,
      height: 128,
      logo: 'bch.svg',
      logoBackgroundTransparent: true,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
  }
});
</script>
