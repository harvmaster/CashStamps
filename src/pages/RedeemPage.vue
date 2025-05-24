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
                  {{ t('installInstructions', { wallet: walletOptions.name }) }}
                </div>
                <div class="text-weight-bold">
                  {{ t('returnInstructions', { wallet: walletOptions.name }) }}
                </div>
                <div>
                  <small>{{
                    t('skipInstructions', { wallet: walletOptions.name })
                  }}</small>
                </div>

                <div v-if="walletOptions.playStore">
                  <a :href="walletOptions.playStore" target="_blank">
                    <img src="/google-play.webp" />
                  </a>
                </div>

                <div v-if="walletOptions.appStore">
                  <a :href="walletOptions.appStore" target="_blank">
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
                <!-- If the Wallet supports protocol handlers (e.g. bch-wif:${wif}), show a button... -->
                <template v-if="walletOptions.protohandler && wifURL">
                  <div
                    class="flex column text-center q-col-gutter-y-lg"
                    style="max-width: 496px; width: 100%"
                  >
                    <div class="text-weight-bold">
                      {{ t('clickInstructions') }}
                    </div>
                    <div class="column q-gutter-y-lg">
                      <q-btn
                        icon="img:bch.svg"
                        rounded
                        color="primary"
                        :label="t('sweepButton')"
                        type="a"
                        :href="wifURL"
                        target="_blank"
                        size="xl"
                        no-caps
                      />
                    </div>
                  </div>
                </template>
                <!-- Otherwise, let's assume it's Bitcoin.com Wallet and show a screenshot. -->
                <template v-else>
                  <div class="text-weight-bold">
                    {{ t('scanInstructions') }}
                  </div>

                  <div>
                    <img src="/bitcoincom-scan.png" />
                  </div>
                </template>
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
                    href="https://minisatoshi.cash/ecosystem"
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
                :color="nextButtonColor"
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
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';

import { useI18n } from 'vue-i18n';
import Translations from './RedeemPage.i18n.json';

interface WalletOptions {
  name: string;
  playStore?: string;
  appStore?: string;
  protohandler: string;
}

const $route = useRoute();
const $q = useQuasar();

$q.dark.set(true);

//-----------------------------------------------------------------------------
// State
//-----------------------------------------------------------------------------

const step = ref(1);

const walletOptions = computed(() => {
  // Define our list of wallets.
  // NOTE: We use a single letter to identify wallets to keep the URL short.
  const wallets: { [key: string]: WalletOptions } = {
    /*
    b: {
      name: 'Bitcoin.com Wallet',
      playStore:
        'https://play.google.com/store/apps/details?id=com.bitcoin.mwallet',
      appStore:
        'https://apps.apple.com/us/app/bitcoin-com-crypto-defi-wallet/id1252903728',
      protohandler: '',
    },
    */
    f: {
      name: 'Flowee Wallet',
      playStore: 'https://play.google.com/store/apps/details?id=org.flowee.pay',
      protohandler: 'bch-wif',
    },
    p: {
      name: 'Paytaca Wallet',
      playStore:
        'https://play.google.com/store/apps/details?id=com.paytaca.app',
      appStore: 'https://apps.apple.com/app/paytaca/id1451795432',
      // TODO: Paytaca will be changing this to "bch-wif" soon.
      protohandler: 'bch-wif',
    },
    s: {
      name: 'Selene Wallet',
      playStore:
        'https://play.google.com/store/apps/details?id=cash.selene.app',
      appStore:
        'https://apps.apple.com/app/selene-wallet-bitcoin-cash/id6449441422',
      protohandler: 'bch-wif',
    },
    z: {
      name: 'ZapIt Wallet',
      playStore:
        'https://play.google.com/store/apps/details?id=io.wallet.zapit',
      appStore: 'https://apps.apple.com/in/app/zapit-io/id1558433083',
      protohandler: 'bch-wif',
    },
  };

  // The query parameter indicating which wallet to use is "w".
  // NOTE: We do not use Wallet's full name as we want to minimize URL length for the QR Codes.
  let walletQuery = $route.query['w'] as string;

  // "r" is a special value which means select a wallet at random.
  if (walletQuery === 'r') {
    // Get all keys from the wallets object
    const walletKeys = Object.keys(wallets);

    // Select a random index between 0 and walletKeys.length-1
    const randomIndex = Math.floor(Math.random() * walletKeys.length);

    // Set the wallet query to the random key.
    walletQuery = walletKeys[randomIndex];
  }

  // Get the wallet to use.
  const wallet = wallets[walletQuery];

  // If an invalid wallet was specified...
  // NOTE: We default to Selene because:
  //       1. It works on both iOS and Android
  //       2. It fetches from Electrum directly (Paytaca has a watchtower bug currently).
  if (!wallet) {
    // Default to Selene.
    return wallets['s'];
  }

  // If this is an iOS device, but there is no AppStore link for this wallet....
  if (!wallet.appStore && $q.platform.is.ios) {
    // Default to Selene.
    return wallets['s'];
  }

  // If this is an Android device, but there is no Google Play link for this wallet....
  if (!wallet.playStore && $q.platform.is.android) {
    // Default to Selene.
    return wallets['s'];
  }

  // Return the specified wallet.
  return wallet;
});

const wifURL = computed(() => {
  // Get the WIF from the URL Query Params.
  const wif = $route.query['wif'];
  const protohandler = walletOptions.value.protohandler;

  // If no WIF was provided, return an empty string.
  // NOTE: Empry string because "undefined" is more painful to work with in the templates.
  if (!wif || !protohandler) {
    return '';
  }

  // Prepend the bitcoincash: prefix.
  // TODO: In future, once wallets support it, this MUST change to
  return `${protohandler}:${wif}`;
});

const nextButtonColor = computed(() => {
  // If we're on step 2 and we can use "click to redeem" button...
  if (step.value === 2 && wifURL.value) {
    // Make the next button less prominent.
    return 'accent';
  }

  return 'primary';
});

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

onMounted(() => {
  if ($route.query['a']) {
    if (walletOptions.value.playStore && $q.platform.is.android) {
      window.location.href = walletOptions.value.playStore;
    } else if (walletOptions.value.appStore && $q.platform.is.ios) {
      window.location.href = walletOptions.value.appStore;
    }
  }
});

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
