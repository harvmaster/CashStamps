<template>
  <q-page>
    <!-- Inner page -->
    <div class="inner-page justify-center">
      <div class="row q-col-gutter-y-lg">
        <!-- Notice -->
        <div class="col-12">
          <p>
            Paytaca currently has a bug with sweeping where balances can show as
            zero (despite being funded). This appears to be due to a
            race-condition with Payaca's Watchtower service in the code
            <a
              href="https://github.com/paytaca/paytaca-app/blob/master/src/wallet/sweep.js#L18C1-L20C7"
              target="_blank"
              >here</a
            >. As a temporary work-around until fixed, we can use this tool to
            subscribe to addresses, thereby (hopefully) making it so that the
            Paytaca Watchtower balances reflect correctly. This should hopefully
            only be a temporary issue.
          </p>
          <ol>
            <li>
              Select the Stamp Collection which will be using the Paytaca
              Redemption flow.
            </li>
            <li>
              Click the Subscribe to Collection button and wait until it
              completes.
            </li>
          </ol>
          <p>
            <strong
              >NOTE: It may take a few minutes before Paytaca's Watchtower is
              ready.</strong
            >
          </p>
        </div>

        <!-- Collection Selection -->
        <div class="col-12">
          <CollectionSelectComponent
            :app="app"
            v-model="state.activeCollection"
          />
        </div>

        <!-- Only show if we have an active wallet -->
        <template v-if="activeWallet">
          <div class="col-12">
            <div class="row q-col-gutter-x-md">
              <div class="col-shrink">
                <q-btn
                  label="Subscribe Addresses"
                  @click="subscribeToWatchtower"
                  :disabled="state.progress"
                />
              </div>
              <div class="col-grow">
                <q-linear-progress :value="state.progress" />
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onUnmounted, computed, reactive, shallowRef, watch } from 'vue';
import { useQuasar } from 'quasar';

// Service / App / Utils imports
import { App } from 'src/services/app.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

// Component Imports
import CollectionSelectComponent from 'src/components/CollectionSelectComponent.vue';

const $q = useQuasar();

// Initialize and start the app so that we have access to Oracles, Electrum, etc.
const app = new App();
await app.start();

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

// Reactives.
const state = reactive<{
  activeCollection: string;
  progress: number;
}>({
  activeCollection: Object.keys(app.stampCollections)[0],
  progress: 0,
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

async function subscribeToWatchtower() {
  if (!activeWallet.value) {
    throw new Error('No Wallet selected');
  }

  // Set the progress to zero.
  state.progress = 0;

  // Get the addresses for each wallet.
  const addresses = activeWallet.value.wallets.value.map((wallet) =>
    wallet.getAddress()
  );

  // Get the total number of addresses
  const totalAddresses = addresses.length;

  // Initialize a counter for the current address
  let currentAddress = 0;

  // Iterate over each address and subscribe it to Paytaca's Watchtower.
  for (const address of addresses) {
    // Increment the current address index
    currentAddress++;

    // Calculate the progress indicator.
    state.progress = currentAddress / totalAddresses;

    // Perform the request.
    await fetch('https://watchtower.cash/api/subscription/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
      }),
    });
  }

  // Set the progress back to zero.
  state.progress = 0;

  // Show a notification.
  $q.notify("Addresses have been subscribed to Paytaca's Watchtower.");
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
