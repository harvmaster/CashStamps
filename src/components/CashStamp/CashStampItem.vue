<template>
  <div class="" style="height: fit-content">
    <div class="cash-stamp_item q-pa-md column items-center">
      
      <!-- QR Code -->
      <div class="col-auto row square q-pa-md">
        <div ref="qrElement" class="col-12" />
      </div>

      <!-- Value -->
      <div class="col-auto row justify-center">
        <div class="col-12 text-h4 no-margin no-padding text-weight-medium">{{ props.wallet.value.amount }} {{ props.wallet.value.denotion.toUpperCase() }}</div>
      </div>
      
      <!-- Create-date -->
      <div class="col-auto row justify-center">
        <div class="col-12 no-margin no-padding text-weight-medium text-grey-8">{{ createdAt }}</div>
      </div>

    </div>
  </div>
</template>

<style lang="scss" scoped>
.cash-stamp_item {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  border: dashed 2px #73ce6b;
}
</style>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import QRCode from 'easyqrcodejs'
import { Wallet } from 'src/types';

export type CashStampItemProps = {
  id: number;
  wallet: Wallet;

  message?: string;
}

const props = defineProps<CashStampItemProps>();
const qrElement = ref<HTMLDivElement | null>(null);

// Create human readable time and date `HH:MMam/pm DD/MM/YYYY`
const createdAt = computed(() => {
  const date = new Date(props.wallet.create_date)
  const hours = date.getHours()
  const minutes = date.getMinutes()

  return `${hours < 10 ? '0'+hours : hours}:${minutes < 10 ? '0'+minutes : minutes}${hours/12 < 1 ? 'am' : 'pm'} ${date.toLocaleDateString()}`
})

// Create QR Code when loaded
onMounted(() => {
  if (qrElement.value) {
    new QRCode(qrElement.value, {
      text: props.wallet.wif,
      width: 128,
      height: 128,
      logo: 'bch.svg',
      logoBackgroundTransparent: true,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }
})

</script>