<template>
  <q-page>
    <!-- Header Outer -->
    <div class="header-outer bg-dark">
      <div class="header-inner">
        <!-- Title -->
        <div
          class="flex text-h2 text-weight-bold text-white justify-center items-center"
        >
          <img src="bch.svg" class="q-ma-sm" style="height: 1em" />
          <span class="strong">
            Stamps.<span class="text-primary">Cash</span>
          </span>
        </div>

        <!-- Subtitle -->
        <div class="flex justify-center text-h6 text-weight-medium q-mb-md">
          Giftable BCH that can be reclaimed if unused
        </div>

        <!-- Description & Instructions -->
        <div class="flex justify-center">
          <div class="text-body1 paragraph">
            <p>
              CashStamps are easily redeemable Bitcoin Cash wallets that can be
              used for gifting BCH with the option to reclaim any unused stamps.
            </p>
            <strong>Instructions:</strong>
            <ol>
              <li>
                Enter the value and quantity of stamps you want to create.
              </li>
              <li>Click "Create Stamps" to generate a QR code.</li>
              <li>
                Scan the QR code with your Bitcoin Cash wallet to fund the
                stamps.
              </li>
              <li>
                Print the stamps and give them to your friends, family, or
                customers.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>

    <!-- Inner page -->
    <div class="inner-page justify-center">
      <div class="row q-col-gutter-y-md">
        <!-- Input form and wallet creator -->
        <div class="col-12">
          <q-toggle
            label="Use Existing Collection"
            v-model="showExistingCollections"
          />

          <q-slide-transition>
            <div v-show="showExistingCollections" class="col-12 row">
              <q-select
                class="q-pb-md col-auto"
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
            </div>
          </q-slide-transition>

          <cash-stamps-form
            :app="app"
            :form="collectionForm"
            @create="createCollection"
            :disable="showExistingCollections"
            class="col-12 q-p-sm"
          />
        </div>

        <q-separator />

        <!-- Stamp results -->
        <div class="col-12">
          <div class="row q-mb-xl">
            <!-- Controls for print/show mnemonic -->
            <div class="col-9">
              <q-btn-group>
                <q-btn
                  outline
                  icon="print"
                  color="primary"
                  :disable="!stamps.length"
                  @click="printStamps"
                >
                  <q-tooltip class="print-hide">Print Stamps</q-tooltip>
                </q-btn>

                <q-btn
                  outline
                  icon="password"
                  color="secondary"
                  :disable="!stamps.length"
                  @click="showMnemonicDialog"
                >
                  <q-tooltip>Show Seed phrase</q-tooltip>
                </q-btn>
              </q-btn-group>

              <q-toggle v-model="showUsedStamps" label="Show used Stamps" />

              <span
                v-if="
                  stamps.length &&
                  app.stampCollection.value?.getFundingOptions().funded
                "
                class="text-weight-medium q-pa-sm q-ml-sm bg-grey-3 rounded-borders"
                style="width: fit-content"
              >
                {{ usedStamps.length }}/ {{ stamps.length }} claimed
              </span>
            </div>

            <!-- Template selection -->
            <div class="col-3">
              <q-select
                label="Template"
                :options="templateOptions"
                v-model="selectedTemplate"
                dense
                filled
              >
                <template v-slot:after>
                  <q-btn
                    round
                    dense
                    flat
                    icon="content_copy"
                    @click="copyTemplateLinkToClipboard()"
                  >
                    <q-tooltip>Copy Template Share Link to Clipboard</q-tooltip>
                  </q-btn>
                </template>
              </q-select>
            </div>
          </div>

          <!-- Page -->
          <div class="justify-center">
            <div class="page shadow-20">
              <div class="flex full-width">
                <div
                  v-for="(visibleStamp, i) in visibleStamps"
                  :key="i"
                  style="position: relative"
                >
                  <!-- Stamp Template -->
                  <div v-html="visibleStamp.html" />

                  <!-- Claimed Badge -->
                  <q-badge
                    v-if="visibleStamp.claimed"
                    style="
                      position: absolute;
                      top: 0;
                      right: 0;
                      background-color: #1dc18e;
                    "
                    label="Claimed"
                    class="q-ma-md"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Printable Page -->
          <!--
          <div
            class="col-12 paper printable shadow-20 rounded-md q-pa-md items-start"
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
          -->
        </div>
      </div>
    </div>

    <mnemonic-dialog ref="mnemonicDialog" :mnemonic="mnemonic"/>
  </q-page>
</template>

<style lang="scss" scoped>
.header-outer {
  width: 100%;
}

.header-inner {
  width: 992px;
  margin: auto;
  margin-bottom: 20px;
  padding-top: 20px;
  padding-bottom: 40px;
  color: #fff;
}

.header-inner .paragraph {
  width: 40em;
  max-width: 100%;
}

/*
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
*/
</style>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar, copyToClipboard } from 'quasar';

// Service / App / Utils imports
import { App } from 'src/services/app';
import { StampCollection } from 'src/services/stamp-collection';
import {
  compileTemplate,
  printHtml,
  dateToString,
  formatStampValue,
} from 'src/utils/misc';

// Composables Imports
import { useCollectionForm } from 'src/composables/useCollectionForm';

// Component Imports
import CashStampsForm from 'components/CashStamp/CashStampsForm.vue';
import MnemonicDialog from 'src/components/CashStamp/MnemonicDialog.vue';

// Pre-built Templates
// NOTE: These are HTML Templates which we compile.
import Horizontal3StepTemplate from 'src/templates/Horizontal3Step.html?raw';
import Vertical3StepTemplate from 'src/templates/Vertical3Step.html?raw';
import RectangleSingeStep from 'src/templates/RectangleSingleStep.html?raw';
import StaticSingleStep from 'src/templates/StaticSingleStep.html?raw';
import AveryLabel from 'src/templates/AveryLabels.html?raw';
import FourInchSquare from 'src/templates/FourInchSquare.html?raw';
import TwoHalfInchSquare from 'src/templates/AveryLabels/2_5_Square.html?raw';


const $q = useQuasar();
const $route = useRoute();

$q.loading.show();

const app = new App();
await app.start();

$q.loading.hide();


// HACK: Set to light mode in case user has come from redeem page.
// TODO: Fix this in future.
$q.dark.set(false);

// List of stamps (as HDPrivateNodes)
const stamps = computed(() => app.stampCollection.value?.getStamps() || []);

// Form for creating a new collection and loading an existing collections params into the form
const { collectionForm, createCollection } = useCollectionForm(app);  // This will likely need fixing when moving app to setup

const showUsedStamps = ref<boolean>(true);

// console.log($route.query);

// console.log(atob($route.query.test as string));

//---------------------------------------
// Templates
//---------------------------------------

interface VisibleStamps {
  html: string;
  claimed: boolean;
}

const templateOptions = [
  { label: 'Avery: 2.5 Inch Square', value: TwoHalfInchSquare },
  { label: 'Flex Stamps', value: RectangleSingeStep },
  { label: 'Static Stamps', value: StaticSingleStep },
  // { label: 'Avery Label', value: AveryLabel }, // Disabled due to bugs
  // { label: '4 Inch Square', value: FourInchSquare },
  { label: 'Horizontal - 3 Step', value: Horizontal3StepTemplate },
  { label: 'Vertical - 3 Step', value: Vertical3StepTemplate },
];
const selectedTemplate = ref<{ label: string; value: string }>(
  templateOptions[0]
);
const visibleStamps = ref<Array<VisibleStamps>>([]);
watch(
  [
    stamps,
    selectedTemplate,
    showUsedStamps,
    () => collectionForm.value.funding.currency,
  ],
  async () => {
    try {
      // Show the loading indicator as this can take some time (to render the QR Codes).
      $q.loading.show();

      // Clear any of our currently rendered stamps.
      visibleStamps.value = [];

      // If no stampCollection is active, do not do anything.
      if (!app.stampCollection.value) {
        return;
      }

      // Declare a variable to store our new visible stamps.
      const newVisibleStamps: Array<VisibleStamps> = [];

      // To improve legibility, destructure our funding options.
      const { value, currency, funded } =
        app.stampCollection.value.getFundingOptions();
      const expiry = app.stampCollection.value.getExpiry();
      const formattedExpiry = dateToString(expiry);

      let selectedCurrency = currency;
      let stampValue = value;

      // If the collection is funded, convert the value to the selected currency
      if (funded) {
        selectedCurrency = collectionForm.value.funding.currency;
        (stampValue = await app.oracles.convertCurrency(
          selectedCurrency,
          value,
          funded.getTime()
        )),
          selectedCurrency;
      }

      for (const stamp of stamps.value) {
        // Ignore the badge is showUsedStamps is set to false and this stamp is unclaimned
        if (!showUsedStamps.value && funded && !stamp.balance) {
          continue;
        }

        // Compile this stamp.
        const compiledStamp = await compileTemplate(
          selectedTemplate.value.value,
          {
            value: formatStampValue(stampValue, selectedCurrency),
            symbol: app.oracles.getOracleSymbol(currency),
            currency: getCurrencyName(selectedCurrency),
            expiry: expiry.toISOString(),
            wif: stamp.privateKey().toWif(),
          }
        );

        // Add the compiled template to our list of visible stamps.
        newVisibleStamps.push({
          claimed: funded && stamp.balance == 0,
          html: compiledStamp,
        });
      }

      // Assign our visible stamps.
      visibleStamps.value = newVisibleStamps;
    } catch (error) {
      console.error(error);
    } finally {
      // Show the loading indicator as this can take some time.
      $q.loading.hide();
    }
  }
);

const getCurrencyName = (currency: string) => {
  if (currency === 'BCH') return 'BCH';

  return (
    app.oracles.oracleMetadataStore[currency].sourceNumeratorUnitCode ||
    'unknown'
  );
};

const copyTemplateLinkToClipboard = () => {
  // Stringify the template into JSON.
  const templateStringified = JSON.stringify(selectedTemplate.value);

  // Encode it as Base64.
  const templateBase64 = btoa(templateStringified);

  // Copy it to the clipboard.
  copyToClipboard(templateBase64);
};

// ---------------------------------------
// Existing Collections
// ---------------------------------------
//
// Data for existing collections
const showExistingCollections = ref(false);
watch(showExistingCollections, () => {
  if (showExistingCollections.value) getCollections();
  else {
    clearForm();
    selectedCollection.value = undefined;
  }
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
  (collections.value =
    (await app.getStampCollections()).map((collection) => collection.name) ||
    []);

// ---------------------------------------
// Get used Stamps
// ---------------------------------------

const usedStamps = computed(() => {
  if (!collectionForm.value.funding.funded) {
    return [];
  }

  return stamps.value
    .filter((stamp) => stamp.balance == 0)
    .map((stamp) => stamp.privateKey().toWif());
});

// ---------------------------------------
// Print Page Actions
// ---------------------------------------
//
// Clear the form and reset the StampCollection
const clearForm = (): void => {
  if (!app.stampCollection) return;

  app.stampCollection.value = StampCollection.generate(app.electrum, { quantity: 0 });
};

// Print the stamps
const printStamps = (): void => {
  // Combined the rendered stamps into a singular HTML.
  const combinedHtml = visibleStamps.value.map((stamp) => stamp.html).join('');

  // Print the HTML.
  printHtml(combinedHtml);
};

// Show the mnemonic dialog
const mnemonicDialog = ref<typeof MnemonicDialog | null>(null);
const showMnemonicDialog = async () => {
  mnemonicDialog.value?.toggleVisible();
};
const mnemonic = computed(() => app.stampCollection.value?.getMnemonic());

// ---------------------------------------
// Lifecycle hooks
// ---------------------------------------
//
onMounted(() => {
  getCollections();
});
</script>
