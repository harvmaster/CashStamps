<template>
  <div class="cash-stamps_form row q-col-gutter-md">
    <div class="col-md col-12 row q-col-gutter-md">

      <!-- Value Input -->
      <div class="col-md col-12 row">
        <q-input
          class="col-12"
          v-model.number="inputForm.value"
          :label="`Stamp Value (${inputForm.denotion.toUpperCase()})`"
          type="number"
          filled
          :rules="[val => val > 0 || 'Value must be greater than 0']"
        />
      </div>


      <!-- Quantity Input -->
      <div class="col-auto row">
        <q-input
          class="col-12 col-md-auto"
          v-model.number="inputForm.quantity"
          label="Stamp Quantity"
          type="number"
          filled
          :rules="[val => val > 0 || 'Value must be greater than 0']"
        />
      </div>


      <div class="col-12 row items-center justify-start q-col-gutter-md">

        <!-- list for FIAT/BCH -->
        <div class="col-auto row items-center">
          <q-select
            style="min-width: 10em"
            v-model="inputForm.currency"
            :options="['bch', 'usd']"
            label="Currency"
            filled
          />
        </div>
        
        <!-- Info -->
        <div class="col-auto row">
          <div class="col-12 col-md-auto text-body2">
            Total Value ({{ inputForm.currency.toUpperCase() }})
          </div>
          <div class="col-12 text-h6">
            {{ inputForm.quantity * inputForm.value }} {{ inputForm.currency.toUpperCase() }}
          </div>
        </div>

      </div>

    </div>

     <!-- Action buttons -->
    <div class="col-auto column q-col-gutter-y-md justify-evenly full-height">
      <div class="col-auto">
        <q-btn class="full-width" label="create Stamps" color="primary" @click="submit" />
      </div>
      <div class="col-auto">
        <q-btn class="full-width" :disable="!wallets.length" label="Fund Stamps" color="green-6" @click="showFundingQR" />
      </div>
      <div class="col-auto">
        <q-btn class="full-width" disable label="Redeem Stamps" color="orange-6" @click="printStamps" />
      </div>
    </div>

    <!-- Modal for showing Funding TX Qr Code -->
    <funding-qr-code
      ref="fundingQrCode"
      :content="fundingTx"
    />

  </div>
</template>

<style lang="scss" scoped>

</style>

<script setup lang="ts">
import { ref } from 'vue';
import { Wallet } from 'src/types'

import { app } from 'src/boot/app.js';
import { StampCollection } from 'src/services/stamp-collection.js';

import FundingQrCode from '../QRCodes/FundingQRCode.vue';

export type CashStampsFormProps = {
  wallets: Wallet[]
}

const props = defineProps<CashStampsFormProps>();

const inputForm = ref({
  quantity: 1,
  value: 0,
  currency: 'bch'
})

const emits = defineEmits<{
  (e: 'transaction', content: string): void
  (e: 'wallets', content: Wallet[]): void
}>()

// Implement transaction creation for filling newly created wallets
const createTransaction = async (wallets: Wallet[]) : Promise<string> => {
  // Create bch tx string here
  return 'bch tx string';
}

// Information for Funding Transaction
// Funding Transaction fills the wallets with BCH
const fundingTx = ref('')
const fundingQrCode = ref<typeof FundingQrCode | null>(null);
const showFundingQR = async () => {
  fundingTx.value = await createTransaction(props.wallets);
  fundingQrCode.value?.toggleVisible();
}

// Create and Emit wallets
const submit = async () => {
  const wallets = await createWallets(inputForm.value.quantity);
  emits('wallets', wallets)
}

const printStamps = () => {
  // Print the stamps

}

const createWallets = async (quantity: number): Promise<Wallet[]> => {
  // Generate wallets
  app.stampCollection = StampCollection.generate(quantity);

  // Return Wallets with WIIF, Private Key, Address, Value, and Create Date
  return app.stampCollection.getStamps().map((stamp) => {
    const privateKey = stamp.privateKey()
    
    return {
      privateKey,
      wif: privateKey.toWif(),
      address: privateKey.derivePublicKey().deriveAddress(),
      value: {
        amount: inputForm.value.value,
        currency: inputForm.value.currency
      },
      create_date: new Date().toISOString()
    }
  });
}

</script>