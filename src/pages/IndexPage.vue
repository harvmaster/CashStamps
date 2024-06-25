<template>
  <q-page class="row items-center justify-evenly printable">

    <!-- Header -->
    <div class="col-12 row bg-dark q-pa-md q-py-lg print-hide">
      <!-- Title -->
      <div class="col-12 row justify-center">
        <div class="col-auto row justify-center text-h2 text-weight-bold text-white">
          <img src="bch.svg" style="height: 1em" />
          CashStamps
        </div>
      </div>

      <!-- Subtitle -->
      <div class="col-12 row justify-center">
        <div class="col-auto text-h6 text-weight-medium text-white">
          Create and print Bitcoin Cash stamps
        </div>
      </div>

      <!-- Description & Instructions -->
      <div class="col-12 row justify-center">
        <div class="col-auto text-body1 text-white paragraph">
          CashStamps are easily redeemable Bitcoin Cash wallets that can be used to share BCH with others, with the ability to claim back funds on unused stamps
          <br />
          <br />
          <strong>Instructions:</strong>
          <br />
          1. Enter the value and quantity of stamps you want to create.
          <br />
          2. Click "Create Stamps" to generate a QR code.
          <br />
          3. Scan the QR code with your Bitcoin Cash wallet to fund the stamps.
          <br />
          4. Print the stamps and give them to your friends, family, or customers.
        </div>
      </div>
    </div>

    <div class="col-12 row cash-stamps_page justify-center q-col-gutter-y-md printable q-pa-xl">
      <div class="col-12 row items-center print-hide">
        <cash-stamps-form 
          :wallets="wallets"
          class="col"
          @transaction="generateQrCode"
          @wallets="addWallets"  
        />
      </div>

      <!-- Action buttons -->
      <!-- <div class="col-auto column q-col-gutter-y-md justify-evenly full-height">
        <div class="col-auto">
          <q-btn class="full-width" label="create Stamps" color="primary" @click="printStamps" />
        </div>
        <div class="col-auto">
          <q-btn class="full-width" label="Fund Stamps" color="green-6" @click="printStamps" />
        </div>
        <div class="col-auto">
          <q-btn class="full-width" disable label="Redeem Stamps" color="orange-6" @click="printStamps" />
        </div>
      </div> -->
    
      
      <!-- Stamp results -->
      <div class="col-12 row q-gutter-y-md justify-center">
        <!-- Controls for print -->
        <div class="col-auto row justify-center q-pa-sm rounded-md shadow-2 print-hide">
          <div class="col-auto q-pa-xs">
            <q-btn
              class="shadow-xs rounded-sm"
              outline
              icon="print"
              color="primary"
              @click="printStamps"
            />
          </div>

          <div class="col-auto q-pa-xs">
            <q-btn
              class="shadow-xs rounded-sm"
              outline
              icon="download"
              color="positive"
              @click="exportStamps"
            />
          </div>

          <div class="col-auto q-pa-xs">
            <q-btn
              class="shadow-xs rounded-sm"
              outline
              icon="cancel"
              color="negative"
              @click="clearForm"
            />
          </div>
        </div>

        <!-- Printable Page -->
        <div class="col-12 row paper printable shadow-20 rounded-md q-pa-md items-start" ref="printContent">
          <div class="row col-12">
            <cash-stamp-item
              class="col-auto q-pa-sm"
              v-for="(wallet, index) in wallets"
              :key="wallet.address"
              :id="index"
              :wallet="wallet"
              :create_date="new Date().toLocaleDateString()"
            />
          </div>
          </div>
      </div>
    </div>

  </q-page>
</template>

<style lang="scss" scoped>
.cash-stamps_page {
  max-width: 992px
}

.paragraph {
  max-width: 40em;
}

@media print {
  .printable {
    display: block;
    page-break-after: always;
    box-shadow: none;
    border: none;
    padding: 0 !important;
    margin: 0 !important;
    
  }
}
</style>

<script setup lang="ts">
import { app } from 'src/boot/app.js';
import { Wallet } from 'src/types';
import { StampCollection } from 'src/services/stamp-collection.js';


import { onMounted, ref } from 'vue';
import QRCode from 'easyqrcodejs';

import CashStampsForm from 'components/CashStamp/CashStampsForm.vue';
import CashStampItem from 'src/components/CashStamp/CashStampItem.vue';

const qrContent = ref('')
const qrElement = ref<HTMLElement | null>(null);

const wallets = ref<Wallet[]>([]);
const printContent = ref<HTMLElement | null>(null);

const generateQrCode = (content: string): void => {
  // set qr content, this loads in the qr code element
  qrContent.value = content;

  // remove existing children
  if (qrElement.value) {
    while (qrElement.value.firstChild) {
      qrElement.value.removeChild(qrElement.value.firstChild);
    }
  }

  // Create QR Code
  new QRCode(qrElement.value, {
    text: content,
    quietZone: 0,
    width: 128,
    height: 128,
    logo: 'bch.svg',
    logoBackgroundTransparent: true
  });

  // Move to next step
  // creationStep.value = '2';
};

const addWallets = (newWallets: Wallet[]): void => {
  wallets.value = newWallets;
  // creationStep.value = '3';
};

const clearForm = (): void => {
  wallets.value = [];
  qrContent.value = '';
  // creationStep.value = '1';
};

const printStamps = (): void => {
  window.print()
};

const exportStamps = (): void => {
  // Export stamps
  // Download json of wallets
  const data = JSON.stringify(wallets.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cash-stamps.json';
  a.click();
  URL.revokeObjectURL(url);
};

// const creationStep = ref('1')

// onMounted(() => {
//   generateQrCode('test');
//   qrContent.value = '';
//   creationStep.value = '1';
// })

onMounted(() => {
  app.stampCollection = StampCollection.generate(20);

  // Print each of the Private Key WIFs to the console.
  app.stampCollection.getStamps().forEach((stamp) => {
    console.log(stamp.privateKey().toWif());
  });
})

</script>
