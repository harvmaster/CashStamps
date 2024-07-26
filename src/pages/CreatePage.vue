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
            v-model="state.activeCollection"
            @update:model-value="renderStamps"
            emit-value
            map-options
            filled
          >
            <template v-slot:after>
              <q-btn round dense flat icon="download" @click="importMnemonic">
                <q-tooltip>Import Mnemonic</q-tooltip>
              </q-btn>
              <q-btn
                round
                dense
                flat
                icon="password"
                @click="showMnemonicDialog"
              >
                <q-tooltip>Show Seed Phrase</q-tooltip>
              </q-btn>
            </template>
          </q-select>
        </div>

        <!-- Input form and wallet creator -->
        <div v-if="state.activeCollection" class="col-12 q-mb-lg">
          <cash-stamps-form
            :oracles="app.oracles"
            :disabled="false"
            v-model="state.activeCollection"
            @create="renderStamps"
            @fund="showFundingDialog"
            @redeem="showRedeemDialog"
            class="col-12 q-p-sm"
          />
        </div>

        <!-- Stamp results -->
        <div v-if="state.activeCollection" class="col-12 q-mb-lg">
          <div class="row">
            <!-- Controls for print/show mnemonic -->
            <div class="col-8">
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
              </q-btn-group>

              <q-toggle
                v-model="state.showClaimedStamps"
                label="Show Claimed"
              />

              <span
                class="text-weight-medium q-pa-sm q-ml-sm bg-grey-3 rounded-borders"
                style="width: fit-content"
              >
                {{ claimedStamps.length }} /
                {{ state.renderedStamps.length }} claimed
              </span>
            </div>

            <!-- Template selection -->
            <div class="col-4">
              <q-select
                label="Template"
                :options="templates"
                v-model="state.activeTemplate"
                @update:model-value="renderStamps"
                dense
                filled
              >
                <template v-slot:after>
                  <q-btn
                    round
                    dense
                    flat
                    icon="edit"
                    @click="showTemplateEditorDialog"
                  >
                    <q-tooltip>Edit Template</q-tooltip>
                  </q-btn>
                </template>
              </q-select>
            </div>
          </div>
        </div>

        <!-- Page -->
        <div class="col-12">
          <div class="justify-center">
            <div class="page preview shadow-20">
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
                    color="primary"
                    style="position: absolute; top: 0; right: 0"
                    label="Claimed"
                    class="q-ma-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- IFrame Page -->
        <div class="col-12">
          <div class="flex justify-center">
            <iframe
              ref="paperIFrame"
              style="width: 0px; height: 0px; border: none"
              class="shadow-20"
            ></iframe>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for showing Funding TX Qr Code -->
    <funding-dialog
      ref="fundingQrCode"
      :oracles="app.oracles"
      :stampCollection="state.activeCollection"
      :wallet="state.activeWallet"
    />

    <!-- Modal to display instructions for Redeeming unclaimed wallets -->
    <redeem-dialog ref="redeemDialog" />

    <!-- Model for editing template code -->
    <edit-template-dialog
      :key="state.activeTemplate"
      ref="templateEditorDialog"
      :activeTemplate="state.activeTemplate"
      @template:created="onTemplateCreated"
      @template:updated="onTemplateUpdated"
      @template:deleted="onTemplateDeleted"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick } from 'vue';
import { useQuasar } from 'quasar';

// Service / App / Utils imports
import type { DB_StampCollection, Template } from 'src/types.js';
import { App } from 'src/services/app.js';
import { WalletHD } from 'src/utils/wallet-hd.js';
import { compileTemplate, formatStampValue } from 'src/utils/misc.js';

// Component Imports
import CashStampsForm from 'src/components/CashStampsForm.vue';
import FundingDialog from 'src/components/FundingDialog.vue';
import RedeemDialog from 'src/components/RedeemDialog.vue';
import EditTemplateDialog from 'src/components/EditTemplateDialog.vue';

// Pre-built Templates
// NOTE: These are HTML Templates which we compile.
import PrintTemplate from 'src/templates/_PrintTemplate.html?raw';
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
  {
    label: 'Avery: 2.5 Inch Square',
    value: TwoHalfInchSquare,
    readonly: true,
  },
  {
    label: 'Flex Stamps',
    value: RectangleSingeStep,
    readonly: true,
  },
  { label: 'Static Stamps', value: StaticSingleStep, readonly: true },
  {
    label: 'Horizontal - 3 Step',
    value: Horizontal3StepTemplate,
    readonly: true,
  },
  {
    label: 'Vertical - 3 Step',
    value: Vertical3StepTemplate,
    readonly: true,
  },
];

// Reactives.
const state = reactive<{
  activeCollection?: DB_StampCollection;
  activeTemplate?: Template;
  activeWallet?: WalletHD;
  renderedStamps: Array<RenderedStamp>;
  showClaimedStamps: boolean;
  printHtml: string;
}>({
  activeCollection: undefined,
  activeTemplate: undefined,
  activeWallet: undefined,
  renderedStamps: [],
  showClaimedStamps: true,
  printHtml: '',
});

// Computeds.
const templates = computed(() => {
  return [...predefinedTemplates, ...app.templates];
});

const stampCollectionsOptions = computed(
  (): Array<SelectOption<DB_StampCollection>> => {
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
        },
      },
    ];

    const existingCollections: Array<SelectOption<DB_StampCollection>> =
      app.stampCollections.map((collection) => {
        return {
          label: collection.name,
          value: collection,
        };
      });

    return [...newCollection, ...existingCollections];
  }
);

const visibleStamps = computed(() => {
  return state.renderedStamps.filter((stamp) =>
    !state.showClaimedStamps && stamp.claimed ? false : true
  );
});

const paperHtml = computed(() => {
  return visibleStamps.value.map((stamp) => stamp.html).join('');
});

const claimedStamps = computed(() => {
  return state.renderedStamps.filter((stamp) => stamp.claimed);
});

// Elements
const paperIFrame = ref<typeof HTMLIFrameElement | null>(null);
const fundingQrCode = ref<typeof FundingDialog | null>(null);
const redeemDialog = ref<typeof RedeemDialog | null>(null);
const templateEditorDialog = ref<typeof EditTemplateDialog | null>(null);

//---------------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------------

async function renderStamps() {
  try {
    // Show the loading indicator as this can take some time (to render the QR Codes).
    $q.loading.show();

    // If no collection is selected, return to prevent further execution.
    if (!state.activeCollection || !state.activeTemplate) {
      return;
    }

    // To improve legibility, destructure our selected collection.
    const { mnemonic, amount, currency, quantity, maybeFunded } =
      state.activeCollection;

    // Initialize the Stamp Collection.
    state.activeWallet = await WalletHD.fromMnemonic(
      app.electrum,
      mnemonic,
      quantity
    );

    // Clear any of our currently rendered stamps.
    state.renderedStamps = [];

    // Declare a variable to store our new rendered stamps.
    const newRenderedStamps: Array<RenderedStamp> = [];

    for (const stamp of state.activeWallet.state.stamps) {
      // Compile this stamp.
      const compiledStamp = await compileTemplate(state.activeTemplate.value, {
        valueBch: formatStampValue(stamp.state.balance, 'BCH'),
        value: formatStampValue(amount, currency),
        symbol: app.oracles.getOracleSymbol(currency),
        currency: getCurrencyName(currency),
        wif: stamp.privateKey().toWif(),
      });

      // Add the compiled template to our list of visible stamps.
      newRenderedStamps.push({
        claimed: state.activeWallet.state.funded && stamp.state.balance <= 0,
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

function printStamps() {
  // Print the contents of the IFrame.
  paperIFrame.value?.contentWindow.print();
}

function getCurrencyName(currency: string) {
  if (currency === 'BCH') return 'BCH';

  return (
    app.oracles.oracleMetadataStore[currency].sourceNumeratorUnitCode ||
    'unknown'
  );
}

async function importMnemonic() {
  $q.dialog({
    title: 'Import mnemonic',
    message: 'Enter your 12 word seed phrase',
    prompt: {
      model: '',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (mnemonic: string) => {
    // Ensure that 12 or 24 words are entered.
    const wordCount = mnemonic.split(/ /g).length;
    if (wordCount !== 12 && wordCount !== 24) {
      throw new Error('Invalid mnemonic: Must be 12 or 24 words');
    }

    // Add it to our stamp collections.
    app.stampCollections.push({
      version: 3,
      mnemonic: mnemonic,
      name: mnemonic,
      amount: 0,
      currency: 'BCH',
      maybeFunded: true,
    });
  });
}

async function showMnemonicDialog() {
  $q.dialog({
    title: 'Mnemonic',
    message: state.activeCollection?.mnemonic || 'No Stamp Collection Selected',
  });
}

async function showFundingDialog() {
  fundingQrCode.value?.toggleVisible();
}

async function showRedeemDialog() {
  redeemDialog.value?.toggleVisible();
}

async function showTemplateEditorDialog() {
  templateEditorDialog.value?.toggleVisible();
}

//---------------------------------------------------------------------------
// Events
//---------------------------------------------------------------------------

async function onTemplateUpdated(newTemplate: Template, oldTemplate: Template) {
  const indexOfTemplate = app.templates.findIndex(
    (template) => template === oldTemplate
  );

  if (indexOfTemplate === -1) {
    throw new Error('Failed to find existing template');
  }

  app.templates[indexOfTemplate] = newTemplate;

  state.activeTemplate = newTemplate;
}

async function onTemplateCreated(template: Template) {
  app.templates.push(template);

  state.activeTemplate = template;
}

async function onTemplateDeleted(templateToDelete: Template) {
  const indexOfTemplate = app.templates.findIndex(
    (template) => template === templateToDelete
  );

  if (indexOfTemplate === -1) {
    throw new Error('Failed to find existing template');
  }

  app.templates.splice(indexOfTemplate, 1);

  state.activeTemplate = templates.value[0];
}

//---------------------------------------------------------------------------
// Watchers
//---------------------------------------------------------------------------

watch([() => state.activeCollection, () => state.activeTemplate], () => {
  // Render the stamps.
  renderStamps();
});

watch([visibleStamps], async () => {
  if (!paperIFrame.value) {
    return;
  }

  const stampsHtml = visibleStamps.value.map((stamp) => stamp.html).join('');
  paperIFrame.value.srcdoc = await compileTemplate(PrintTemplate, {
    html: stampsHtml,
  });

  paperIFrame.value.onload = () => {
    paperIFrame.value.style.width =
      paperIFrame.value.contentWindow.document.body.scrollWidth + 'px';
    paperIFrame.value.style.height =
      paperIFrame.value.contentWindow.document.body.scrollHeight + 'px';
  };
});

//---------------------------------------------------------------------------
// Initialization/Lifecycle Hooks
//---------------------------------------------------------------------------

// Set the selected collection to the first one available (which should be "New Collection").
state.activeCollection = stampCollectionsOptions.value[0].value;
state.activeTemplate = predefinedTemplates[0];
</script>
