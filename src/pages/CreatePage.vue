<template>
  <q-page>
    <!-- Header -->
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
        <!-- Collection Selection -->
        <div class="col-12">
          <q-select
            label="Collection"
            :options="stampCollectionsOptions"
            v-model="state.selectedCollection"
            @update:model-value="renderStamps"
            map-options
            filled
          />
        </div>

        <!-- Input form and wallet creator -->
        <div class="col-12">
          <cash-stamps-form
            :oracles="app.oracles"
            :disabled="false"
            v-model="state.selectedCollection"
            @create="renderStamps"
            @fund="showFundingDialog"
            @redeem="showRedeemDialog"
            class="col-12 q-p-sm"
          />
        </div>

        <q-separator />

        <!-- Stamp results -->
        <div class="col-12">
          <div class="row">
            <!-- Controls for print/show mnemonic -->
            <div class="col-9">
              <q-btn-group>
                <q-btn
                  outline
                  icon="print"
                  color="primary"
                  :disable="!state.renderedStamps.length"
                  @click="printStamps"
                >
                  <q-tooltip class="print-hide">Print Stamps</q-tooltip>
                </q-btn>

                <q-btn
                  outline
                  icon="password"
                  color="secondary"
                  :disable="!state.renderedStamps.length"
                  @click="showMnemonicDialog"
                >
                  <q-tooltip>Show Seed phrase</q-tooltip>
                </q-btn>
              </q-btn-group>

              <q-toggle
                v-model="state.showUsedStamps"
                label="Show used Stamps"
              />

              <span
                class="text-weight-medium q-pa-sm q-ml-sm bg-grey-3 rounded-borders"
                style="width: fit-content"
              >
                {{ usedStamps.length }} / {{ state.renderedStamps.length }} claimed
              </span>
            </div>

            <!-- Template selection -->
            <div class="col-3">
              <q-select
                label="Template"
                :options="templates"
                v-model="state.selectedTemplate"
                @update:model-value="renderStamps"
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
        </div>

        <!-- Template Metadata -->
        <div v-if="state.selectedCollection" class="col-12 q-mb-xl">
          <metadata-form v-model="state.selectedCollection.metadata" :template="state.selectedTemplate.value" @update:model-value="renderStamps" />
        </div>

        <!-- Page -->
        <div class="col-12">
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
        </div>
      </div>
    </div>

    <!-- Modal for showing Funding TX Qr Code -->
    <funding-qr-code ref="fundingQrCode" :app="app" />

    <!-- Model to display instructions for Redeeming unclaimed wallets -->
    <redeem-dialog ref="redeemDialog" />
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
</style>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { useQuasar, copyToClipboard } from 'quasar';

// Service / App / Utils imports
import type { DB_StampCollection } from 'src/types.js';
import { App } from 'src/services/app.js';
import { StampCollection } from 'src/services/stamp-collection.js';
import {
  compileTemplate,
  formatStampValue,
  printHtml,
} from 'src/utils/misc.js';

// Component Imports
import CashStampsForm from 'src/components/CashStampsForm.vue';
import MetadataForm from 'src/components/MetadataForm.vue';
import FundingQrCode from 'src/components/FundingQRCode.vue';
import RedeemDialog from 'src/components/RedeemDialog.vue';

// Pre-built Templates
// NOTE: These are HTML Templates which we compile.
import Horizontal3StepTemplate from 'src/templates/Horizontal3Step.html?raw';
import Vertical3StepTemplate from 'src/templates/Vertical3Step.html?raw';
import RectangleSingeStep from 'src/templates/RectangleSingleStep.html?raw';
import StaticSingleStep from 'src/templates/StaticSingleStep.html?raw';
import TwoHalfInchSquare from 'src/templates/AveryLabels/2_5_Square.html?raw';

interface RenderedStamp {
  html: string;
  claimed: boolean;
}

interface SelectOption<T> {
  label: string;
  value: T;
}

const $q = useQuasar();

// Initialize and start the app so that we have access to Oracles, Electrum, etc.
const app = new App();
await app.start();

// HACK: Set to light mode in case user has come from redeem page.
// TODO: Fix this in future.
$q.dark.set(false);

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

// Built-in Templates.
const predefinedTemplates = [
  { label: 'Avery: 2.5 Inch Square', value: TwoHalfInchSquare },
  { label: 'Flex Stamps', value: RectangleSingeStep },
  { label: 'Static Stamps', value: StaticSingleStep },
  { label: 'Horizontal - 3 Step', value: Horizontal3StepTemplate },
  { label: 'Vertical - 3 Step', value: Vertical3StepTemplate },
];

// Reactive State.
const state = reactive<{
  selectedCollection?: DB_StampCollection;
  renderedStamps: Array<RenderedStamp>;
  showUsedStamps: boolean;
  selectedTemplate: SelectOption<string>;
}>({
  selectedCollection: undefined,
  renderedStamps: [],
  showUsedStamps: true,
  selectedTemplate: predefinedTemplates[0],
});

const templates = computed(() => {
  // TODO: Allow custom templates.
  return predefinedTemplates;
});

const stampCollectionsOptions = computed((): Array<SelectOption<DB_StampCollection>> => {
  const newCollection: Array<SelectOption<DB_StampCollection>> = [
    {
      label: '[New Stamp Collection]',
      value: {
        version: 3,
        mnemonic: app.nextMnemonic.value,
        name: '[New Stamp Collection]',
        amount: 0,
        currency: 'BCH',
        maybeFunded: false,
        metadata: {},
      }
    }
  ];

  const existingCollections: Array<SelectOption<DB_StampCollection>> = app.stampCollections.map((collection) => {
    return {
      label: collection.name,
      value: collection,
    };
  });

  return [...newCollection, ...existingCollections];
});

const visibleStamps = computed(() => {
  return state.renderedStamps.filter((stamp) => (!state.showUsedStamps && stamp.claimed) ? false : true);
});

const usedStamps = computed(() => {
  return state.renderedStamps.filter((stamp) => stamp.claimed);
});

// Elements
const fundingQrCode = ref<typeof FundingQrCode | null>(null);
const redeemDialog = ref<typeof RedeemDialog | null>(null);

//---------------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------------

async function renderStamps() {
  try {
    // Show the loading indicator as this can take some time (to render the QR Codes).
    $q.loading.show();

    // If no collection is selected, return to prevent further execution.
    if(!state.selectedCollection) {
      return;
    }

    // To improve legibility, destructure our selected collection.
    const { mnemonic, amount, currency, quantity, maybeFunded, metadata } = state.selectedCollection;

    // Initialize the Stamp Collection.
    const stampCollection = await StampCollection.fromMnemonic(app.electrum, mnemonic, quantity);

    // Clear any of our currently rendered stamps.
    state.renderedStamps = [];

    // Declare a variable to store our new rendered stamps.
    const newRenderedStamps: Array<RenderedStamp> = [];

    for (const stamp of stampCollection.state.stamps) {
      // Compile this stamp.
      const compiledStamp = await compileTemplate(
        state.selectedTemplate.value,
        {
          valueBch: formatStampValue(stamp.state.balance, 'BCH'),
          value: formatStampValue(amount, currency),
          symbol: app.oracles.getOracleSymbol(currency),
          currency: getCurrencyName(currency),
          wif: stamp.privateKey().toWif(),
          ...metadata
        }
      );

      // Add the compiled template to our list of visible stamps.
      newRenderedStamps.push({
        claimed: (stampCollection.state.funded && stamp.state.balance <= 0),
        html: compiledStamp,
      });
    }

    // Assign our visible stamps.
    state.renderedStamps = newRenderedStamps;
  } catch (error) {
    console.error(error);
  } finally {
    // Show the loading indicator as this can take some time.
    $q.loading.hide();
  }
}

// Print the stamps
function printStamps() {
  // Combined the rendered stamps into a singular HTML.
  const combinedHtml = state.renderedStamps.map((stamp) => stamp.html).join('');

  // Print the HTML.
  printHtml(combinedHtml);
}

function copyTemplateLinkToClipboard() {
  // Stringify the template into JSON.
  const templateStringified = JSON.stringify(state.selectedTemplate);

  // Encode it as Base64.
  const templateBase64 = btoa(templateStringified);

  // Copy it to the clipboard.
  copyToClipboard(templateBase64);
}

function getCurrencyName(currency: string) {
  if (currency === 'BCH') return 'BCH';

  return (
    app.oracles.oracleMetadataStore[currency].sourceNumeratorUnitCode ||
    'unknown'
  );
}

async function showMnemonicDialog() {
  $q.dialog({
    title: 'Mnemonic',
    message: state.selectedCollection?.mnemonic || 'No Stamp Collection Selected',
  });
}

async function showFundingDialog() {
  fundingQrCode.value?.toggleVisible();
}

async function showRedeemDialog() {
  redeemDialog.value?.toggleVisible();
}

//---------------------------------------------------------------------------
// Initialization/Lifecycle Hooks
//---------------------------------------------------------------------------

// Set the selected collection to the first one available (which should be "New Collection").
state.selectedCollection = stampCollectionsOptions.value[0].value;

</script>
