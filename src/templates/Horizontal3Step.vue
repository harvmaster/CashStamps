<template>
  <div class="flyer">
    <!-- Step 1 - Download Wallet -->
    <div class="section">
      <!-- Title -->
      <div class="title-primary">
        <span class="primary">Bitcoin</span>
        <span class="secondary">Cash</span>
      </div>

      <!-- Download Wallet QR Code -->
      <img class="qr-code" :src="downloadWalletQrCode" />

      <!-- Details -->
      <div class="details">
        <div class="title secondary">Step 1</div>
        <div class="content">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur.
        </div>
      </div>
    </div>

    <!-- Step 2 - Redeem Stamp -->
    <div class="section">
      <!-- Title -->
      <div class="title-primary">
        <span class="primary">Redeem</span>
        <span class="secondary"> $10</span>
      </div>

      <!-- Redeem QR Code -->
      <img class="qr-code" :src="redeemQrCode" />

      <!-- Details -->
      <div class="details">
        <div class="title secondary">Step 2</div>
        <div class="content">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur.
        </div>
      </div>
    </div>

    <!-- Step 3 - Spend BCH -->
    <div class="section">
      <!-- Title -->
      <div class="title-primary">
        <span class="primary">Use</span>
        <span class="secondary"> It!</span>
      </div>

      <!-- Spend QR Code -->
      <img class="qr-code" :src="spendQrCode" />

      <!-- Details -->
      <div class="details">
        <div class="title secondary">Step 3</div>
        <div class="content">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur.
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.flyer {
  display: flex;
  width: 210mm;
  background: #000;
  color: #fff;
  border-bottom: 1px dashed #46ba4f;
}

.section {
  width: 33%;
  text-align: center;
  padding: 5mm;
}

.primary {
  color: #fff;
}

.secondary {
  color: #46ba4f;
}

.title-primary {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5mm;
}

.title-secondary {
  font-size: 24px;
  font-weight: bold;
}

.qr-code {
  width: 35mm !important;
  height: 35mm !important;
  margin-bottom: 5mm;
}

.details .title {
  font-size: 24px;
  font-weight: bold;
}

.details .content {
  font-size: 12px;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import QRCode from 'easyqrcodejs';

import { HDPrivateNode } from 'src/utils/hd-private-node.js';
import { FundingOptions } from 'src/services/stamp-collection.js';

//----------------------------------
// State
//----------------------------------

export type CashStampItemProps = {
  id: number;
  stamp: HDPrivateNode;
  funding: FundingOptions;
  loadingFunding: boolean;
  claimed: boolean;
};

const props = defineProps<CashStampItemProps>();

// QR Code Elements
const downloadWalletQrCode = ref<string>('');
const redeemQrCode = ref<string>('');
const spendQrCode = ref<string>('');

async function renderQrCode(content: string, logo: string): Promise<string> {
  // Create a virtual div to render the QR Code into.
  const virtualDiv = document.createElement('div');

  // Render the QR Code into the virtual div.
  new QRCode(virtualDiv, {
    text: content,
    width: 256,
    height: 256,
    quietZone: 5,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });

  // Get the canvas element so that we can draw a logo into it.
  // NOTE: We would use our QR Code library for this...
  //       But it is shit and doesn't work asynchronously.
  //       So we do it ourselves to avoid having to add shitty timers that trigger Jim's childhood PTSD.
  const canvas = virtualDiv.firstElementChild as HTMLCanvasElement;

  const ctx = canvas.getContext('2d');

  // Create a new image object
  const img = new Image();

  // Set the source of the image (replace with your image path)
  img.src = logo;

  return new Promise((resolve) => {
    // When the image has loaded, draw it on the canvas
    img.onload = function () {
      // Calculate the center position to place the image
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Resize the image to fit within the canvas dimensions
      const scaleFactor =
        Math.min(canvas.width / img.width, canvas.height / img.height) / 4;
      const scaledWidth = img.width * scaleFactor;
      const scaledHeight = img.height * scaleFactor;

      // Calculate the position to draw the image to be centered
      const drawX = centerX - scaledWidth / 2;
      const drawY = centerY - scaledHeight / 2;

      // Draw the image on the canvas
      ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);

      resolve(canvas.toDataURL('image/png'));
    };

    // Otherwise, if it fails, just omit it.
    img.onerror = function () {
      resolve(canvas.toDataURL('image/png'));
    };
  });
}

//----------------------------------
// Lifecycle Hooks
//----------------------------------

// Create QR Code when loaded
onMounted(async () => {
  const wif = props.stamp.privateKey().toWif();

  downloadWalletQrCode.value = await renderQrCode(wif, 'bch.svg');
  redeemQrCode.value = await renderQrCode(wif, 'bch.svg');
  spendQrCode.value = await renderQrCode(wif, 'bch.svg');

  console.log(redeemQrCode.value);
});
</script>
