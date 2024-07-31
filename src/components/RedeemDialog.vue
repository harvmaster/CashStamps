<template>
  <q-dialog v-model="visible">
    <q-card class="row">
      <q-card-section class="text-h6 text-center">
        Redeeming Unclaimed Wallets
      </q-card-section>

      <q-card-section class="">
        <ol class="text-body1 instructions-list">
          <li>Open Electron Wallet</li>
          <li>Select File > New/Restore</li>
          <li>Name the wallet and click next</li>
          <li>Select 'Standard Wallet' and click next</li>
          <li>Select 'I already have a seed' and click next</li>
          <li>Input your seed from this collection and click next</li>
          <li>Click Next</li>
          <li>
            You can put a password on it if you would like, but as this is
            temporary, we wouldnt worry about it for now
          </li>
          <li>Pay out your BCH to your wallet</li>
        </ol>
        <div class="text-body1 text-grey-7">
          These instructions will be replaced with a button to automatically
          redeem the wallets in the future
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
import { ref } from 'vue';

const visible = ref(false);
const toggleVisible = () => {
  visible.value = !visible.value;
};

defineExpose({
  toggleVisible,
});
</script>
