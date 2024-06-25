<template>
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
</template>

<style lang="scss" scoped>

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
</style>

<script setup lang="ts">
import { ref } from 'vue'

const qrContent = ref('')
const creationStep = ref('1')


</script>