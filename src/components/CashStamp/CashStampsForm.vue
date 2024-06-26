<template>
  <div class="cash-stamps_form row q-col-gutter-md">
    <div class="col-md col-12 row q-col-gutter-md">

      <!-- Value Input -->
      <div class="col-md col-12 row">
        <q-input
          class="col-12"
          v-model.number="inputForm.value"
          :label="`Stamp Value (${inputForm.currency.toUpperCase()})`"
          type="number"
          :disable="disable"
          filled
          :rules="[val => val > 0 || 'Value must be greater than 0']"
          @update:model-value="clampValue"
          @input="logInput"
        />
      </div>


      <!-- Quantity Input -->
      <div class="col-auto row">
        <q-input
          class="col-12 col-md-auto"
          v-model.number="inputForm.quantity"
          label="Stamp Quantity"
          type="number"
          :disable="disable"
          filled
          :rules="[val => val > 0 || 'Value must be greater than 0']"
          @update:model-value="clampQuantity"
        />
      </div>


      <div class="col-12 row items-center justify-start q-col-gutter-md">

        <!-- list for FIAT/BCH -->
        <div class="col-auto row items-center">
          <q-select
            style="min-width: 10em"
            v-model="inputForm.currency"
            :disable="disable"
            :options="['BCH']"
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
        <q-btn class="full-width" :disable="disable" label="create Stamps" color="primary" @click="submit" />
      </div>
      <div class="col-auto">
        <q-btn class="full-width" :disable="!wallets.length || disable" label="Fund Stamps" color="green-6" @click="showFundingQR" />
      </div>
      <div class="col-auto">
        <q-btn class="full-width" disable label="Redeem Stamps" color="orange-6" @click="redeemStamps" />
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
import { FundingOptions, StampCollection } from 'src/services/stamp-collection.js';

import FundingQrCode from '../QRCodes/FundingQRCode.vue';

export type CashStampsFormProps = {
  wallets: Wallet[];
  disable?: boolean;
}

const emits = defineEmits<{
  (e: 'transaction', content: string): void
  (e: 'wallets', content: Wallet[]): void
}>()

const props = defineProps<CashStampsFormProps>();

const inputForm = ref({
  quantity: 1,
  value: 0,
  currency: 'bch'
})

const clampValue = (val: string | number | null) => {
  if (val === null || typeof val == 'string') return;
  inputForm.value.value = Math.max(0, val);
}
const clampQuantity = (val: string | number | null) => {
  if (val === null || typeof val == 'string') return;
  inputForm.value.quantity = Math.max(1, val);
}
const logInput = (event: Event) => {
  console.log(event)
}

// Implement transaction creation for filling newly created stamps
const createTransaction = async (wallets: unknown[]) : Promise<string> => {
  // Create bch tx string here
  return 'bch tx string';
}

// Information for Funding Transaction
// Funding Transaction fills the wallets with BCH
const fundingTx = ref('')
const fundingQrCode = ref<typeof FundingQrCode | null>(null);
const showFundingQR = async () => {
  if (!app.stampCollection?.value) return;
  fundingTx.value = await createTransaction(app.stampCollection.value.getStamps());
  fundingQrCode.value?.toggleVisible();
}

// Create and Emit wallets
const submit = async () => {
  const wallets = await createWallets(inputForm.value.quantity);
}

const redeemStamps = () => {
  // redeem the unclaimed stamps
}

// Create StampCollection filled with Stamps
const createWallets = async (quantity: number): Promise<void> => {
  // Create options for funding
  const fundingOptions: FundingOptions = {
    amount: inputForm.value.value,
    currency: inputForm.value.currency,
    funded: false
  }
  
  // Generate wallets
  app.stampCollection.value = StampCollection.generate(quantity, fundingOptions);
}

</script>