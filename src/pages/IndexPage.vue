<template>
  <q-page class="row items-center justify-evenly printable">

    <!-- Header -->
    <div class="col-12 row bg-dark q-pa-md q-py-lg print-hide">
      <!-- Title -->
      <div class="col-12 row justify-center">
        <div class="col-auto row justify-center text-h2 text-weight-bold text-white">
          <img src="/bch.svg" style="height: 1em" />
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
        <div class="col-auto text-body1 text-white">
          <!-- Create and print Bitcoin Cash stamps to give to friends, family, or customers.  -->
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
      <div class="col-12 col-sm row items-center print-hide">
        <cash-stamps-form 
          class="col"
          @transaction="generateQrCode"
          @wallets="addWallets"  
        />
      </div>

      <!-- Info / guide stepper -->
      <div class="col-12 col-sm-auto row items-center justify-center q-pa-md rounded-lg shadow-2 square creation-stepper bg-white relative print-hide">

        <div class="absolute qr-label col-12 q-pb-sm text-h5 text-center text-weight-medium">
          {{
            creationStep === '1' ? 'Create' :
            creationStep === '2' ? 'Fund' :
            creationStep === '3' ? 'Print!' : ''
          }}
        </div>

        <!-- Window. 256px wide, auto height -->
        <div class="creation-stepper-window overflow-hidden square">

          <!-- Show steps for creating -->
          <div class="text-h6 text-weight-medium row justify-center items-center text-center" >
            Select the value and quantity
          </div>

          <!-- Created Stamps, Need to fill them -->
          <div class="row justify-center" :class="{ 'invisible': !qrContent }">
            <q-tooltip style="font-size: 1rem">
              Scan this QR code to fill the stamps with BCH
            </q-tooltip>
            <div ref="qrElement" class="col-auto" />
          </div>

          <!-- Stamps filled. Show options like print and export -->
        </div>

      </div>
      
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

.creation-stepper-window {
  min-width: 128px;
  max-width: 180px;
  height: min-content;
  transition: all 1s;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  > div {
    min-width: 100%;
    transform: translateX(calc(v-bind(creationStep) * -100% + 100%));
    transition: transform 0.5s;
  }
}

.qr-label {
  top: 0;
  transform: translateY(-50%);
  padding: 0 0.5em;
  background-color: $primary;
  color: white;
  width: min-content;
  outline: 1px solid $grey-4;
  border-radius: 100vw;
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
import { Wallet } from 'src/types';

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
    logo: '/bch.svg',
    logoBackgroundTransparent: true
  });

  // Move to next step
  creationStep.value = '2';
};

const addWallets = (newWallets: Wallet[]): void => {
  wallets.value = newWallets;
  creationStep.value = '3';
};

const clearForm = (): void => {
  wallets.value = [];
  qrContent.value = '';
  creationStep.value = '1';
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

const creationStep = ref('1')

onMounted(() => {
  generateQrCode('test');
  qrContent.value = '';
  creationStep.value = '1';
})

</script>
