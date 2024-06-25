<template>
  <q-dialog v-model="visible">
    <q-card class="q-pa-md">
      <q-card-section class="text-h6 no-margin text-weight-medium row justify-center items-center text-center">
        Scan to fill the stamps with BCH
      </q-card-section>
      <q-card-section class="row justify-center">
        <div ref="qrElement" />
      </q-card-section>
      <q-card-section class="row justify-center text-center">
        This QR code is not yet functional.<br> It is a placeholder for future functionality.
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style lang="scss" scoped>

</style>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import QRCode from 'easyqrcodejs'

export type FundingQRCodeProps = {
  content: string;
}

const props = defineProps<FundingQRCodeProps>();

const visible = ref(false);
const toggleVisible = () => {
  visible.value = !visible.value;
  nextTick(() => {
    generateQrCode();
  })
}

const qrElement = ref<HTMLElement | null>(null);
const generateQrCode = async () => {
  if (qrElement.value) {
    new QRCode(qrElement.value, {
      text: props.content,
      width: 256,
      height: 256,
      logo: 'bch.svg',
      logoBackgroundTransparent: true,
      colorDark: '#000000',
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}

defineExpose({
  toggleVisible
})
</script>