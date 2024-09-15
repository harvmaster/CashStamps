<template>
  <q-page>
    <!-- Header -->
    <div class="header-outer bg-dark">
      <div class="header-inner">
        <!-- Title -->
        <div
          class="flex text-h2 text-weight-bold text-white justify-center items-center"
        >
          <img src="icon.svg" class="q-ma-sm" style="height: 1em" />
          <span class="strong">Stamps.Cash</span>
        </div>

        <!-- Subtitle -->
        <div class="flex justify-center text-h6 text-weight-medium q-mb-md">
          {{ t('subtitle') }}
        </div>

        <!-- Description & Instructions -->
        <div class="flex justify-center">
          <div class="text-body1 paragraph">
            <p>
              {{ t('description') }}
            </p>
            <strong>{{ t('instructions.title') }}</strong>
            <ol>
              <li v-for="step in tm('instructions.steps')" :key="step">
                {{ step }}
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>

    <!-- Inner page -->
    <div class="inner-page justify-center">
      <div class="row q-col-gutter-y-lg">
        <!-- Collection Selection -->
        <div class="col-12">
          <CollectionSelectComponent
            :app="app"
            v-model="state.activeCollection"
          />
        </div>

        <!-- Only show if we have an active wallet -->
        <template v-if="activeWallet">
          <!-- Separator -->
          <div class="col-12">
            <q-separator />
          </div>

          <!-- Collection Manager -->
          <div class="col-12">
            <CollectionManagerComponent
              v-model="activeCollection"
              :app="app"
              :wallet="activeWallet"
              class="animated fadeIn"
            />
          </div>

          <!-- Separator -->
          <div class="col-12">
            <q-separator />
          </div>

          <!-- Collection Preview -->
          <div class="col-12">
            <CollectionPreviewComponent
              :app="app"
              :stampCollection="activeCollection"
              :wallet="activeWallet"
              @templateSelected="
                (uuid) => (activeCollection.templateUUID = uuid)
              "
              class="animated fadeIn"
            />
          </div>
        </template>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onUnmounted, computed, reactive, shallowRef, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

// Service / App / Utils imports
import { App } from 'src/services/app.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

// Component Imports
import CollectionSelectComponent from 'src/components/CollectionSelectComponent.vue';
import CollectionManagerComponent from 'src/components/CollectionManagerComponent.vue';
import CollectionPreviewComponent from 'src/components/CollectionPreviewComponent.vue';

// Translations
import Translations from './CreatePage.i18n.json';

const $q = useQuasar();

// Set up i18n
const { t, tm } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: Translations.messages,
});

// Initialize and start the app so that we have access to Oracles, Electrum, etc.
const app = new App();
await app.start();


//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

// Reactives.
const state = reactive<{
  activeCollection: string;
}>({
  activeCollection: Object.keys(app.stampCollections)[0],
});

const activeWallet = shallowRef<WalletHD | undefined>(undefined);

// Computeds.
const activeCollection = computed(() => {
  return app.stampCollections[state.activeCollection];
});

//---------------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------------

// TODO: Consider moving to Select Component and emitting the Wallet.
async function initWallet() {
  // If there is a wallet active, stop monitoring it to prevent memory leaks.
  if (activeWallet.value) {
    activeWallet.value.stopMonitoring();
  }

  // Set the current wallet to undefined.
  activeWallet.value = undefined;

  // Initialize the Stamp Collection.
  const wallet = await WalletHD.fromMnemonic(
    activeCollection.value.mnemonic,
    app.electrum
  );

  // Scan for wallets.
  await wallet.scan();

  // If this is a fresh wallet, set the quantity to whatever the collection specified.
  if (!wallet.wallets.value.length) {
    wallet.setQuantity(activeCollection.value.quantity);
  }

  // Otherwise, refresh the balances of the child nodes.
  else {
    await wallet.refreshChildNodes();
  }

  // Start monitoring the wallet for transactions.
  await wallet.startMonitoring();

  // Set the new active wallet.
  activeWallet.value = wallet;
}

//---------------------------------------------------------------------------
// Watchers
//---------------------------------------------------------------------------

watch([() => activeCollection.value], async () => {
  // Show the loading indicator.
  $q.loading.show();

  // Initialize the wallet.
  await initWallet();

  // Hide the loading indicator.
  $q.loading.hide();
});

//---------------------------------------------------------------------------
// Lifecycle/Initialization
//---------------------------------------------------------------------------

onUnmounted(async () => {
  if (activeWallet.value) {
    await activeWallet.value.stopMonitoring();
  }
});

await initWallet();
</script>
