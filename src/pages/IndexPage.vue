<template>
  <q-page class="row items-center justify-evenly printable">
    <!-- Header -->
    <div class="col-12 row bg-dark q-pa-md q-py-lg print-hide">
      <!-- Title -->
      <div class="col-12 row justify-center">
        <div
          class="col-auto row justify-center text-h2 text-weight-bold text-white"
        >
          <img src="bch.svg" style="height: 1em" />
          CashStamps
        </div>
      </div>

      <!-- Subtitle -->
      <div class="col-12 row justify-center">
        <div class="col-auto text-h6 text-weight-medium text-white">
          Create and print Bitcoin Cash stamps
        </div>
      </div>

      <!-- Description & Instructions -->
      <div class="col-12 row justify-center q-pt-md">
        <div class="col-auto text-body1 text-white paragraph">
          CashStamps are easily redeemable Bitcoin Cash wallets that can be used for gifting BCH with the option to reclaim any unused stamps.
          <br />
          <br />
          <strong>Instructions:</strong>
          <br />
          1. Enter the value and quantity of stamps you want to create.
          <br />
          2. Click "Create Stamps" to generate a QR code.
          <br />
          3. Scan the QR code with your Bitcoin Cash wallet to fund the stamps.
          <br />
          4. Print the stamps and give them to your friends, family, or
          customers.
        </div>
      </div>
    </div>

    <div
      class="col-12 row cash-stamps_page justify-center printable q-pa-xl q-col-gutter-y-md"
    >
      <!-- Input form and wallet creator -->
      <div class="col-12 row items-center print-hide">
        <div class="col-12 q-py-sm">
          <q-toggle
            label="Use Existing Colection"
            v-model="showExistingCollections"
          />
        </div>

        <q-slide-transition>
          <div v-show="showExistingCollections" class="col-12 row q-pb-sm">
            <q-select
              class="q-py-sm col-auto"
              style="width: 20em; max-width: 100%"
              v-model="selectedCollection"
              :options="collections"
              label="Select Collection"
              filled
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey-8">
                    No collections available
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <div class="col-auto self-end">
              <div v-if="stamps.length" class="col-auto text-weight-medium q-pa-sm ">
                {{ usedStamps.length }}/
                {{ stamps.length }} claimed
              </div>
            </div>
          </div>
        </q-slide-transition>

        <cash-stamps-form
          :form="collectionForm"
          @create="createCollection"
          
          :disable="showExistingCollections"
          class="col-12 q-p-sm"
        />
      </div>

      <!-- Stamp results -->
      <div class="col-12 row justify-center">
        <!-- Controls for print -->
        <div class="col-12 row justify-center q-pb-md">

          <div
            class="col-auto row justify-center q-pa-sm rounded-md shadow-2 print-hide"
            style="background-color: white"
          >
            <!-- Print -->
            <div class="col-auto q-pa-xs">
              <q-btn
                class="shadow-xs rounded-sm"
                outline
                icon="print"
                color="primary"
                :disable="!stamps.length"
                @click="printStamps"
              >
                <q-tooltip class="print-hide">Print Stamps</q-tooltip>
              </q-btn>
            </div>

            <!-- Download -->
            <div class="col-auto q-pa-xs">
              <q-btn
                class="shadow-xs rounded-sm"
                outline
                icon="password"
                color="positive"
                :disable="!stamps.length"
                @click="showMnemonicDialog"
              >
                <q-tooltip>Show Seed phrase</q-tooltip>
                <!-- <q-tooltip>Download as Electron Wallet</q-tooltip> -->
              </q-btn>
            </div>

            <!-- Clear Stamps -->
            <!-- <div class="col-auto q-pa-xs">
              <q-btn
                class="shadow-xs rounded-sm"
                outline
                icon="cancel"
                color="negative"
                :disable="!stamps.length"
                @click="clearForm"
              >
                <q-tooltip>Clear Stamps</q-tooltip>
              </q-btn>
            </div> -->
          </div>
        </div>

        <!-- Printable Page -->
        <div
          class="col-12 row paper printable shadow-20 rounded-md q-pa-md items-start"
          ref="printContent"
        >
          <div class="row col-12">
            <stamp-list 
              v-if="stamps.length"
              class="col-12"
              :stamps="stamps"
              :usedStamps="usedStamps"
              :funding="collectionForm.funding"
            />
          </div>
        </div>
      </div>
    </div>

    <mnemonic-dialog ref="mnemonicDialog" />
  </q-page>
</template>

<style lang="scss" scoped>
.cash-stamps_page {
  max-width: 992px;
}

.paragraph {
  width: 40em;
  max-width: 100%;
}

@media print {
  .printable {
    display: block;
    page-break-after: always;
    box-shadow: none;
    border: none;
    padding: 0 !important;
    margin: 0 !important;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

// Service / App imports
import { app } from 'src/boot/app';
import { StampCollection } from 'src/services/stamp-collection';

// Composables Imports
import { useCollectionForm } from 'src/composables/useCollectionForm';

// Component Imports
import CashStampsForm from 'components/CashStamp/CashStampsForm.vue';
import StampList from 'src/components/CashStamp/StampList.vue';
import MnemonicDialog from 'src/components/CashStamp/MnemonicDialog.vue';
import { getKeyUnspent } from 'src/utils/transaction-helpers';

// List of stamps (as HDPrivateNodes)
const stamps = computed(() => app.stampCollection.value?.getStamps() || [])

// Form for creating a new collection and loading an existing collections params into the form
const {
  collectionForm,
  createCollection,
} = useCollectionForm()


// ---------------------------------------
// Existing Collections
// ---------------------------------------
//
// Data for existing collections
const showExistingCollections = ref(false);
watch(showExistingCollections, () => {
  if (showExistingCollections.value) getCollections();
  else {
    clearForm()
    selectedCollection.value = undefined;
  };
});

// Update app.stampCollection when a collection is selected
const selectedCollection = ref<string | undefined>(undefined);
watch(selectedCollection, (value) => {
  if (!value) return;
  app.getStampCollection(value);
});

// List of StampCollections that exist in the database
const collections = ref<string[]>([]);
const getCollections = async () =>
  (collections.value = (await app.getStampCollections()).map(collection => collection.name) || []);


// ---------------------------------------
// Get used Stamps
// ---------------------------------------
//
// List of stamps that have been used
const usedStamps = ref<string[]>([]);
const getUsedStamps = async () => {
  if (!collectionForm.value.funding.funded) {
    return [] 
  }

  const unspentPromises = stamps.value.map(async (stamp) => {
    return {
      stamp: stamp.toString(),
      unspent: await getKeyUnspent(stamp)
    }
  });

  const unspent = await Promise.all(unspentPromises);
  const used = unspent.filter(address => !address.unspent.length);

  usedStamps.value = used.map(address => address.stamp)
}
watch(stamps, () => getUsedStamps());


// ---------------------------------------
// Print Page Actions
// ---------------------------------------
//
// Clear the form and reset the StampCollection
const clearForm = (): void => {
  if (!app.stampCollection) return;

  app.stampCollection.value = StampCollection.generate({ quantity: 0 });
};

// Print the stamps
const printStamps = (): void => {
  window.print();
};

// Show the mnemonic dialog
const mnemonicDialog = ref<typeof MnemonicDialog | null>(null);
const showMnemonicDialog = async () => {
  mnemonicDialog.value?.toggleVisible();
};


// ---------------------------------------
// Lifecycle hooks
// ---------------------------------------
//
onMounted(() => {
  getCollections();
});
</script>
