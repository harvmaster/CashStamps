<template>
  <q-dialog v-model="visible" class="blur-background">
    <div class="square row items-center">
      <q-card
        class="q-pa-md col-12 column square justify-center q-col-gutter-y-md"
      >
        <!-- Ask user to save it somewhere -->
        <div
          class="col-auto text-h6 no-margin text-weight-medium row justify-center items-center text-center q-col-gutter-sm"
        >
          <q-icon name="info" class="text-primary" />
          <span>Save your seed somewhere safe before proceeding</span>
        </div>

        <!-- Mnemonic container -->
        <div
          class="col-auto text-h6 no-margin text-weight-medium row justify-center items-center text-center"
        >
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
        <div v-if="showQRCode" class="col-auto row justify-center">
          <div ref="qrElement" id="invoice-container" class="full-width" />
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

// Import the CashPayServer library for generating transactions
import CashPayServer from '@developers.cash/cash-pay-server-js';

// Made type for CashPayServer as it was not defined in the library
import { CashPayServer_Invoice } from 'src/types';

import { App } from 'src/services/app'

const props = defineProps<{
  app: App;
}>();
const app = props.app;

// Stamp collection and mnemonic
const collection = computed(() => app.stampCollection.value);
const mnemonic = computed(() => collection.value?.getMnemonic());

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
    if (!showQRCode.value) return;

    // Need to generate here because the qrElement is not rendered until showQRCode is true
    generateQrCode();
  });
};

// Genreate QR code using CashPayServer
const qrElement = ref<HTMLElement | null>(null);
const generateQrCode = async () => {
  if (!qrElement.value) return;

  // Create funding tx template
  const invoice = await createFundingTx();
  if (!invoice) return;

  // Set QR code to fill QrElement
  invoice
    ?.intoContainer(qrElement.value)

    // Listen for broadcasted event to update stamps
    .on(['broadcasted'], async (e: unknown) => {
      // set the collection to funded and use BCH as the currency
      lockStampCollection();

      // save the stamps to local storage with IDB
      const stampCollection = app.stampCollection.value;
      if (!stampCollection) throw new Error('No stamp collection found');
      app.saveStamps(stampCollection);
      
      console.log(e);
    });

  // Create the QR code by sending request to CashPayServer
  await invoice.create();
};

const createFundingTx = async (): Promise<CashPayServer_Invoice> => {
  const fundingOptions = app.stampCollection.value?.getFundingOptions();
  if (!fundingOptions) throw new Error('No funding options found');

  if (fundingOptions.funded) {
    throw new Error('Collection is already funded');
  }

  // Create BIP70 invoice instance
  const invoice = new CashPayServer.Invoice();

  // Get amount without currency reference
  const rawAmount = fundingOptions.value;

  // Get currency
  const currency = fundingOptions.currency;

  // Initialise the output amount to be in BCH
  let bchAmount = rawAmount;

  // If the currency selected is not BCH, convert bchAmount to the equivalent amount in the selected currency
  if (currency !== 'BCH') {
    // Get the BCH price in the selected currency
    const bchPrice = app.oracles.getOraclePriceCommonUnits(
      currency
    );

    // Set BCH amount to the equivalent amount in the selected currency
    bchAmount = rawAmount / bchPrice;
  }

  // Get all stamps to iterate over
  const stamps = app.stampCollection.value?.getStamps();
  if (!stamps) {
    throw new Error('No stamps found');
  }

  // Add addresses to transaction
  for (const node of stamps) {
    const address = node
      .deriveHDPublicNode()
      .publicKey()
      .deriveAddress()
      .toCashAddr();
    invoice.addAddress(
      address,
      `${bchAmount}BCH` // Amount sent to CashPayServer is in BCH
    );
  }

  // Name invoice to show up in cryptocurrency wallet
  const collectionName = app.stampCollection.value?.getName();
  invoice.setMemo(`CashStamps: ${collectionName}`);

  // Return invoice object, Need to call create from here, but we need to be able to call "intoContainer" to load the invoice into the browser
  return invoice;
};

const lockStampCollection = async () => {
  const stampCollection = app.stampCollection.value;
  if (!stampCollection) throw new Error('No stamp collection found');

  const fundingOptions = stampCollection.getFundingOptions();
  if (!fundingOptions) throw new Error('No funding options found');

  if (fundingOptions.currency !== 'BCH') {
    const bchPrice = app.oracles.getOraclePriceCommonUnits(
      fundingOptions.currency
    );

    stampCollection.lockStampOptions({
      value: fundingOptions.value / bchPrice,
      currency: 'BCH',
    });

    return
  }

  stampCollection.lockStampOptions({ 
    value: fundingOptions.value,
    currency: 'BCH',
   });
}

// Vue function to allow parent component to call toggleVisible
defineExpose({
  toggleVisible,
});
</script>
