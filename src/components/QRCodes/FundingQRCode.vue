<template>
  <q-dialog v-model="visible" class="blur-background">
    <div class="square row items-center">
      <q-card class="q-pa-md col-12 column square justify-center q-col-gutter-y-md">

        <!-- Ask user to save it somewhere -->
        <div class="col-auto text-h6 no-margin text-weight-medium row justify-center items-center text-center q-col-gutter-sm">
          <q-icon name="info" class="text-primary" />
          <span>Save your seed somewhere safe before proceeding</span>
        </div>

        <!-- Mnemonic container -->
        <div class="col-auto text-h6 no-margin text-weight-medium row justify-center items-center text-center">
          {{ mnemonic }}
        </div>

        <!-- button to actually display QR code -->
        <div class="col-auto row justify-center">
          <q-btn
            class="shadow-xs rounded-sm"
            color="primary"
            :label="showQRCode ? 'Hide Transaction' : 'Generate Tranasction'"
            @click="toggleQrCode"
          />
        </div>

        <!-- Qr code -->
        <div 
          v-if="showQRCode"
          class="col-auto text-h6 no-margin text-weight-medium row justify-center items-center text-center"
        >
          Scan to fill the stamps with BCH
        </div>
        <div 
          v-if="showQRCode"
          class="col-auto row justify-center"
        >
          <div ref="qrElement" id="invoice-container" class="full-width"/>
        </div>
    
        <!-- Small text to inform user the qr code would not work in development -->
        <!-- <div class="row justify-center text-center">
          This QR code is not yet functional.<br />
          It is a placeholder for future functionality.
        </div> -->
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
import { nextTick, ref, computed } from 'vue';
import { app } from 'src/boot/app';

// Stamp collection and mnemonic
const collection = computed(() => app.stampCollection.value);
const mnemonic = computed(() => collection.value?.mnemonic);

const visible = ref(false);
const toggleVisible = () => {
  visible.value = !visible.value;
  showQRCode.value = false;
  nextTick(() => {
    // Generating the QR code on load to improve performance
    generateQrCode(); 
  });
};

// QR Code visibility control
const showQRCode = ref(false);
const toggleQrCode = () => {
  showQRCode.value = !showQRCode.value;
  nextTick(() => {
    if (!showQRCode.value) return
    
    // Need to generate here because the qrElement is not rendered until showQRCode is true 
    generateQrCode();
  });
};

// Genreate QR code using CashPayServer
const qrElement = ref<HTMLElement | null>(null);
const generateQrCode = async () => {
  if (!qrElement.value) return;

  // Create funding tx template
  const invoice = app.stampCollection.value?.createFundingTx();
  if (!invoice) return;

  // Set QR code to fill QrElement
  invoice
    ?.intoContainer(qrElement.value)

    // Listen for broadcasted event to update stamps
    .on(['broadcasted'], async (e: unknown) => {
      console.log(e);
      app.stampCollection.value?.fundStamps();
      app.stampCollection.value?.saveStamps();
    });

  // Create the QR code by sending request to CashPayServer
  await invoice.create();
};

// Vue function to allow parent component to call toggleVisible
defineExpose({
  toggleVisible,
});
</script>
