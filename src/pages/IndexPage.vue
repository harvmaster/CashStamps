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
      <div class="col-12 row justify-center q-pt-md">
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

      <!-- Input form and wallet creator -->
      <div class="col-12 row items-center print-hide">
        <cash-stamps-form 
          :wallets="wallets"
          class="col"
          @wallets="addWallets"  
        />
      </div>
      
      <!-- Stamp results -->
      <div class="col-12 row q-gutter-y-md justify-center">
        <!-- Controls for print -->
        <div class="col-auto row justify-center q-pa-sm rounded-md shadow-2 print-hide">

          <!-- Print -->
          <div class="col-auto q-pa-xs">
            <q-btn
              class="shadow-xs rounded-sm"
              outline
              icon="print"
              color="primary"
              @click="printStamps"
            />
          </div>

          <!-- Download -->
          <div class="col-auto q-pa-xs">
            <q-btn
              class="shadow-xs rounded-sm"
              outline
              icon="download"
              color="positive"
              @click="exportStamps"
            />
          </div>

          <!-- Clear Stamps -->
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
  width: 40em;
  max-width: 100%;
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

import { ref } from 'vue';

import CashStampsForm from 'components/CashStamp/CashStampsForm.vue';
import CashStampItem from 'src/components/CashStamp/CashStampItem.vue';

const wallets = ref<Wallet[]>([]);

const addWallets = (newWallets: Wallet[]): void => {
  wallets.value = newWallets;
};

const clearForm = (): void => {
  wallets.value = [];
  qrContent.value = '';
};

const printStamps = (): void => {
  window.print()
};

const exportStamps = (): void => {
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
</script>
