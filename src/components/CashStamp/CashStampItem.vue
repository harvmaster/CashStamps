<template>
  <div class="" style="height: fit-content">
    <div class="cash-stamp_item q-pa-md column items-center">
      
      <!-- QR Code -->
      <div class="col-auto row square q-pa-md">
        <div ref="qrElement" class="col-12" />
      </div>

      <div class="col-auto row justify-center">
        <div class="col-12 text-h4 no-margin no-padding text-weight-medium">{{ props.wallet.value }} BCH</div>
      </div>


      <!-- <div class="col row q-pa-md items-center">
        <div class="col-12 text-subtitle2 text-grey-8">Created: {{ props.create_date }}</div>
        <div class="col-12 text-h4 text-weight-medium">{{ props.wallet.value }} BCH</div>
        <div class="col-12 text-subtitle2 text-grey-8">Private Key: {{ props.wallet.privateKey }}</div>
      </div> -->

    </div>
  </div>
</template>

<style lang="scss" scoped>
.cash-stamp_item {
  background-color: white;
  border-radius: 8px;
  // box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  padding: 16px;
  border: dashed 2px #73ce6b;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import QRCode from 'easyqrcodejs'
import { Wallet } from 'src/types';

export type CashStampItemProps = {
  id: number;
  wallet: Wallet;

  message?: string; 
  create_date?: string;
}

const props = defineProps<CashStampItemProps>();

const qrElement = ref<HTMLDivElement | null>(null);

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