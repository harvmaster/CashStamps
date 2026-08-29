<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex items-center bg-dark">
        <p>Redirecting to Store...</p>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';

import { useI18n } from 'vue-i18n';
import Translations from './RedeemPage.i18n.json';

interface WalletOptions {
  name: string;
  playStore?: string;
  appStore?: string;
  protohandler: string;
}

const $router = useRouter();
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
    b: {
      name: 'Bitcoin.com Wallet',
      playStore:
        'https://play.google.com/store/apps/details?id=com.bitcoin.mwallet',
      appStore:
        'https://apps.apple.com/us/app/bitcoin-com-crypto-defi-wallet/id1252903728',
      protohandler: '',
    },
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
      protohandler: 'bitcoincash',
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
  const walletQuery = $route.query['w'] as string;

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
  if (walletOptions.value.playStore && $q.platform.is.android) {
    window.location.href = walletOptions.value.playStore;
  } else if (walletOptions.value.appStore && $q.platform.is.ios) {
    window.location.href = walletOptions.value.appStore;
  } else {
    $router.push('/redeem');
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
