<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex bg-dark">
        <div class="flex col-grow column" style="width:100%; max-width:992px; margin-left: auto; margin-right: auto;">
          <div class="col-shrink">
            <q-stepper
              class="full-width"
              v-model="step"
              header-nav
              ref="stepper"
              color="primary"
              active-icon="none"
              alternative-labels
              :contracted="$q.screen.lt.sm"
              animated
              flat
            >
              <q-step
                :name="1"
                title="Install a Wallet"
                icon="img:bch.svg"
                :done="step > 1"
              />
              <q-step
                :name="2"
                title="Redeem BCH"
                icon="qr_code"
                :done="step > 2"
              />
              <q-step :name="3" title="Spend" icon="store" :done="step > 3" />
            </q-stepper>
          </div>
          <div
            class="flex col-grow items-center q-pl-xl q-pr-xl q-pt-md q-pb-md"
          >
            <!-- Step 1 -->
            <div
              v-if="step === 1"
              class="flex col-grow justify-center animated fadeIn"
            >
              <div class="flex column text-center q-col-gutter-y-lg">
                <div class="text-weight-bold">
                  Install the
                  <span class="text-primary">Bitcoin.com Wallet</span> on your
                  device.
                </div>

                <div>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.bitcoin.mwallet"
                    target="_blank"
                  >
                    <img src="/google-play.webp" />
                  </a>
                </div>

                <div>
                  <a
                    href="https://apps.apple.com/us/app/bitcoin-com-crypto-defi-wallet/id1252903728"
                    target="_blank"
                  >
                    <img src="/apple-store.webp" />
                  </a>
                </div>
              </div>
            </div>

            <!-- Step 2 -->
            <div
              v-if="step === 2"
              class="flex col-grow justify-center animated fadeIn"
            >
              <div class="flex column text-center q-col-gutter-y-lg">
                <div class="text-weight-bold">
                  In your wallet, click the scan button and then scan your QR
                  Code to sweep the amount into your wallet.
                </div>

                <div>
                  <img src="/bitcoincom-scan.png" />
                </div>
              </div>
            </div>

            <!-- Step 3 -->
            <div
              v-if="step === 3"
              class="flex col-grow justify-center animated fadeIn"
            >
              <div class="flex column text-center q-col-gutter-y-lg">
                <div class="text-weight-bold">
                  Find merchants near you to spend BCH!
                </div>

                <div>
                  <a class="text-primary" href="https://maps.bitcoin.com" target="_blank">
                    <q-icon name="store" size="144px" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-shrink">
            <div class="flex justify-center q-ma-md">
              <q-btn
                v-if="step < 3"
                @click="step++"
                color="primary"
                label="Next"
                class="full-width strong"
                size="lg"
                no-caps
                rounded
              />
              <q-btn
                v-if="step === 3"
                type="a"
                href="https://maps.bitcoin.com"
                target="_blank"
                color="primary"
                label="Open Bitcoin.com Maps!"
                class="full-width strong"
                size="lg"
                no-caps
                rounded
              />
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

$q.dark.set(true);

//-----------------------------------------------------------------------------
// State
//-----------------------------------------------------------------------------

const step = ref(1);
</script>

<style lang="scss">
.q-stepper__step-content {
  display: none;
}

img {
  max-width: 100%;
}
</style>
