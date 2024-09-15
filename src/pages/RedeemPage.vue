<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex bg-dark">
        <div
          class="flex col-grow column"
          style="
            width: 100%;
            max-width: 992px;
            margin-left: auto;
            margin-right: auto;
          "
        >
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
                :title="t('installWallet')"
                icon="img:bch.svg"
                :done="step > 1"
              />
              <q-step
                :name="2"
                :title="t('redeemBCH')"
                icon="qr_code"
                :done="step > 2"
              />
              <q-step
                :name="3"
                :title="t('spend')"
                icon="store"
                :done="step > 3"
              />
            </q-stepper>
          </div>
          <div
            class="flex col-grow items-center q-pl-md q-pr-md q-pt-md q-pb-md"
          >
            <!-- Step 1 -->
            <div
              v-if="step === 1"
              class="flex col-grow justify-center animated fadeIn"
            >
              <div class="flex column text-center q-col-gutter-y-lg">
                <div class="text-weight-bold">
                  {{ t('installInstructions.before') }}
                  <span class="text-primary">{{
                    t('installInstructions.wallet')
                  }}</span>
                  {{ t('installInstructions.after') }}
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
                  {{ t('scanInstructions') }}
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
              <div
                class="flex column text-center q-col-gutter-y-lg"
                style="width: 496px; max-width: 100%"
              >
                <div class="column q-gutter-y-lg">
                  <q-btn
                    icon="img:merchant.svg"
                    rounded
                    color="accent"
                    :label="t('nearbyMerchants')"
                    type="a"
                    href="https://maps.bitcoin.com"
                    target="_blank"
                    size="xl"
                    no-caps
                  />
                  <q-btn
                    icon="img:bch.svg"
                    rounded
                    color="accent"
                    :label="t('onlineServices')"
                    type="a"
                    href="https://bchportal.cash/"
                    target="_blank"
                    size="xl"
                    no-caps
                  />
                  <q-btn
                    icon="img:info.svg"
                    rounded
                    color="accent"
                    :label="t('learnMore')"
                    size="xl"
                    type="a"
                    href="https://discover.cash"
                    target="_blank"
                    no-caps
                  />
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
                :label="t('next')"
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

<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { useQuasar } from 'quasar';

import { useI18n } from 'vue-i18n';
import Translations from './RedeemPage.i18n.json';

const $q = useQuasar();

$q.dark.set(true);

//-----------------------------------------------------------------------------
// State
//-----------------------------------------------------------------------------

const step = ref(1);

//-----------------------------------------------------------------------------
// I18n
//-----------------------------------------------------------------------------

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: Translations.messages,
});

//-----------------------------------------------------------------------------
// Initialization/Lifecycle
//-----------------------------------------------------------------------------

onUnmounted(() => {
  // HACK: Disable dark mode as we leave this page.
  $q.dark.set(false);
});
</script>

<style lang="scss">
.q-stepper__step-content {
  display: none;
}

img {
  max-width: 100%;
}
</style>
