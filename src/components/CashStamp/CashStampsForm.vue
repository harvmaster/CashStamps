<template>
  <div class="cash-stamps_form row">
    <div class="col-12 row q-col-gutter-md">

      <!-- Value Input -->
      <div class="col row">
        <q-input
          class="col-12"
          v-model.number="inputForm.value"
          label="Stamp Value (BCH)"
          type="number"
          filled
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
        />
      </div>


      <div class="col-12 row items-center justify-between">
        
        <!-- Info -->
        <div class="col-auto row">
          <div class="col-12 col-md-auto text-body2">
            Total Value (BCH)
          </div>
          <div class="col-12 text-h6">
            {{ inputForm.quantity * inputForm.value }} BCH
          </div>
        </div>

        <!-- Submit -->
        <div class="col-auto  justify-center">
          <q-btn
            class="shadow-xs"
            
            label="Create Stamps"
            color="primary"
            @click="submit"
          />
        </div>

      </div>

    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>

<script setup lang="ts">
import { ref } from 'vue';
import { Wallet } from 'src/types'

import { generateWallet } from 'src/lib/bchWallet';

const inputForm = ref({
  quantity: 1,
  value: 0,
  denotion: 'bch'
})

const emits = defineEmits<{
  (e: 'transaction', content: string): void
  (e: 'wallets', content: Wallet[]): void
}>()

const createTransaction = async (wallets: Wallet[]) : Promise<string> => {
  // Create bch tx string here
  return 'bch tx string';
}

const submit = async () => {
  const wallets = await createWallets(inputForm.value.quantity);
  emits('wallets', wallets)

  const tx = await createTransaction(wallets);
  emits('transaction', tx);
}

const createWallets = async (quantity: number): Promise<Wallet[]> => {
  // Create wallets here
  const wallets = await Promise.all(
    new Array(quantity).fill(generateWallet())
  )
  
  return wallets;
  
  return new Array(quantity).fill({
    address: 'address',
    privateKey: '724144a7a1742658a5f5b0e58b570d3b04a5415fd446966d530bcde8cb3a802e',
    value: inputForm.value.value
  })
}

</script>