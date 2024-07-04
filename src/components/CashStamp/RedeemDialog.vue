<template>
  <q-dialog v-model="visible">
    <q-card class="row">
      <q-card-section class="text-h6 text-center">
        Redeeming Unclaimed Wallets
      </q-card-section>

      <q-card-section class="">
        <ul class="text-body1 instructions-list">
          <li>1. Open Electron Wallet</li>
          <li>2. Select File > New/Restore</li>
          <li>3. Name the wallet and click next</li>
          <li>4. Select 'Standard Wallet' and click next</li>
          <li>5. Select 'I already have a seed' and click next</li>
          <li>6. Input your seed from this collection and click next</li>
          <li>7. Click Next</li>
          <li>8. You can put a password on it if you would like, but as this is temporary, we wouldnt worry about it for now</li>
          <li>9. Pay out your BCH to your wallet</li>
        </ul>
        <div class="text-body1 text-grey-7">
          These instructions will be replaced with a button to automatically redeem the wallets in the future
        </div>
      </q-card-section>

    </q-card>
  </q-dialog>
</template>

<style lang="scss" scoped>
.instructions-list {
  li {
    margin-bottom: 8px;
  }
}
</style>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const toggleVisible = () => {
  visible.value = !visible.value
}

defineExpose({
  toggleVisible,
})
</script>
