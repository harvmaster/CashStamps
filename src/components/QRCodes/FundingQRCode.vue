<template>
  <q-dialog v-model="visible">
    <div ref="qrElement" />
  </q-dialog>
</template>

<style lang="scss" scoped>

</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import QRCode from 'easyqrcodejs'

export type FundingQRCodeProps = {
  content: string;
}

const props = defineProps<FundingQRCodeProps>();

const visible = ref(false);
const toggleVisible = () => {
  visible.value = !visible.value;
  generateQrCode();
  console.log(props.content)
}

const qrElement = ref<HTMLElement | null>(null);
const generateQrCode = async () => {
  if (qrElement.value) {
    new QRCode(qrElement.value, {
      text: props.content,
      width: 256,
      height: 256,
      logo: '/bch.svg',
      logoBackgroundTransparent: true,
      colorDark: '#000000',
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}

onMounted(() => {
  generateQrCode();
})

defineExpose({
  toggleVisible
})
</script>