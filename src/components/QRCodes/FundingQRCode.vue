<template>
  <q-dialog v-model="visible" class="blur-background">
    <div class="square row items-center">
      <q-card class="q-pa-md col-12 column square justify-center">
        <q-card-section
          class="col-auto text-h6 no-margin text-weight-medium row justify-center items-center text-center"
        >
          Scan to fill the stamps with BCH
        </q-card-section>
        <q-card-section class="col-auto row justify-center">
          <div ref="qrElement" id="invoice-container" />
        </q-card-section>
    
        <!-- Small text to inform user the qr code would not work in development -->
        <!-- <q-card-section class="row justify-center text-center">
          This QR code is not yet functional.<br />
          It is a placeholder for future functionality.
        </q-card-section> -->
      </q-card>
    </div>
  </q-dialog>
</template>

<style lang="scss">
.blur-background {
  backdrop-filter: blur(5px);
}

#invoice-container {
  margin: auto;
  max-width: 150px;
  font-size: 0.8em;
  min-height: 80px;
}

.cashpay-loading {
  fill: #00c58a !important;
}

.cashpay-tick {
  fill: #00c58a !important;
}

.cashpay-cross {
  fill: #f00 !important;
}
</style>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { app } from 'src/boot/app';

const visible = ref(false);
const toggleVisible = () => {
  visible.value = !visible.value;
  nextTick(() => {
    generateQrCode();
  });
};

const qrElement = ref<HTMLElement | null>(null);
const generateQrCode = async () => {
  if (!qrElement.value) return;

  const invoice = app.stampCollection.value?.createFundingTx();
  if (!invoice) return;

  invoice
    ?.intoContainer(qrElement.value)
    .on(['broadcasted'], async (e: unknown) => {
      console.log(e);
      app.stampCollection.value?.fundStamps();
      app.stampCollection.value?.saveStamps();
    });
  await invoice.create();
};

defineExpose({
  toggleVisible,
});
</script>
