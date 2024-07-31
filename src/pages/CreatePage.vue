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
      <div class="row q-col-gutter-y-lg">
        <!-- Collection Selection -->
        <div class="col-12">
          <q-select
            label="Collection"
            :options="stampCollectionsOptions"
            v-model="state.activeCollection"
            @update:model-value="renderStamps"
            option-value="id"
            emit-value
            map-options
            filled
          >
            <template v-slot:before>
              <q-btn round flat icon="add_circle">
                <q-menu>
                  <q-list style="min-width: 100px">
                    <q-item clickable v-close-popup @click="onNewCollection">
                      <q-item-section avatar>
                        <q-icon name="add" />
                      </q-item-section>
                      <q-item-section>New</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="onImportCollection">
                      <q-item-section avatar>
                        <q-icon name="create" />
                      </q-item-section>
                      <q-item-section>Import Mnemonic</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </template>
            <template v-slot:after>
              <q-btn round flat icon="edit" @click="onRenameCollection">
                <q-tooltip>Rename</q-tooltip>
              </q-btn>
              <q-btn round flat icon="more_horiz">
                <q-menu>
                  <q-list style="min-width: 100px">
                    <q-item
                      clickable
                      v-close-popup
                      @click="onShowMnemonicDialog"
                    >
                      <q-item-section avatar>
                        <q-icon name="key" />
                      </q-item-section>
                      <q-item-section>View Mnemonic</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="onDeleteCollection">
                      <q-item-section avatar>
                        <q-icon name="delete" />
                      </q-item-section>
                      <q-item-section>Delete</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </template>
          </q-select>
        </div>

        <div class="col-12">
          <q-separator />
        </div>

        <!-- Collection Management -->
        <div class="col-12">
          <div class="row q-col-gutter-x-md">
            <!-- Form and Summary -->
            <div class="col-10">
              <div class="column q-col-gutter-y-md">
                <cash-stamps-form
                  :oracles="app.oracles"
                  :funded="state.activeWallet?.state.funded || false"
                  v-model="activeCollection"
                />

                <SummaryComponent
                  v-if="state.activeWallet"
                  :oracles="app.oracles"
                  :stampCollection="activeCollection"
                  :wallet="state.activeWallet"
                />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="col-2">
              <div class="column q-col-gutter-y-md">
                <!-- Fund Stamps -->
                <div>
                  <q-btn
                    :disable="state.activeWallet?.state.funded || !activeCollection.quantity || !activeCollection.amount"
                    label="Fund Stamps"
                    color="primary"
                    @click="showFundingDialog"
                    class="full-width"
                  />
                </div>

                <!-- Redeem Stamps -->
                <div>
                  <q-btn
                    :disable="!state.activeWallet?.state.funded"
                    label="Reclaim Stamps"
                    color="secondary"
                    @click="showRedeemDialog"
                    class="full-width"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12">
          <q-separator />
        </div>

        <!-- Collection Preview -->
        <div v-if="activeCollection" class="col-12 q-mb-lg">
          <div class="row">
            <!-- Controls for print/show mnemonic -->
            <div class="col-8 q-gutter-x-sm">
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

        <!-- IFrame Page -->
        <div class="col-12">
          <div class="flex justify-center">
            <!-- NOTE: Credentialless is important as it disallows the IFrame from accessing IndexedDB and LocalStorage. -->
            <iframe
              ref="printIFrame"
              style="width: 0px; height: 0px; border: none"
              class="shadow-20"
              sandbox="allow-same-origin allow-scripts allow-modals"
              credentialless="true"
            ></iframe>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for showing Funding TX Qr Code -->
    <funding-dialog
      ref="fundingQrCode"
      :oracles="app.oracles"
      :stampCollection="activeCollection"
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
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';

// Service / App / Utils imports
import type { StampCollection, Template } from 'src/types.js';
import { App } from 'src/services/app.js';
import { Satoshis } from 'src/utils/satoshis.js';
import { WalletHD } from 'src/utils/wallet-hd.js';
import { compileTemplate, formatStampValue } from 'src/utils/misc.js';

// Component Imports
import CashStampsForm from 'src/components/CashStampsForm.vue';
import SummaryComponent from 'src/components/SummaryComponent.vue';
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
  activeCollection: number;
  activeTemplate?: Template;
  activeWallet?: WalletHD;
  renderedStamps: Array<RenderedStamp>;
  showClaimedStamps: boolean;
}>({
  activeCollection: 0,
  activeTemplate: undefined,
  activeWallet: undefined,
  renderedStamps: [],
  showClaimedStamps: true,
});

// Computeds.
const activeCollection = computed(() => {
  return app.stampCollections[state.activeCollection];
});

const templates = computed(() => {
  return [...predefinedTemplates, ...app.templates];
});

const stampCollectionsOptions = computed(
  (): Array<SelectOption<StampCollection>> => {
    return app.stampCollections.map((collection, i) => {
      return {
        id: i,
        label: collection.name,
        value: collection,
      };
    });
  }
);

const visibleStamps = computed(() => {
  return state.renderedStamps.filter((stamp) =>
    !state.showClaimedStamps && stamp.claimed ? false : true
  );
});

// Elements
const printIFrame = ref<typeof HTMLIFrameElement.prototype | null>(null);
const fundingQrCode = ref<typeof FundingDialog | null>(null);
const redeemDialog = ref<typeof RedeemDialog | null>(null);
const templateEditorDialog = ref<typeof EditTemplateDialog | null>(null);

function getCurrencyName(currency: string) {
  if (currency === 'BCH') return 'BCH';

  return (
    app.oracles.oracleMetadataStore[currency].sourceNumeratorUnitCode ||
    'unknown'
  );
}

//---------------------------------------------------------------------------
// Collection
//---------------------------------------------------------------------------

async function onNewCollection() {
  $q.dialog({
    title: 'New',
    message: 'Enter a name for this collection',
    prompt: {
      model: '',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (name: string) => {
    // Add a new stamp collection.
    app.addCollection({ name });

    // Set it as active.
    state.activeCollection = app.stampCollections.length - 1;
  });
}

async function onImportCollection() {
  $q.dialog({
    title: 'Import mnemonic',
    message: 'Enter your 12 word seed phrase',
    prompt: {
      model: '',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (mnemonic: string) => {
    // Trim the mnemonic.
    const trimmedMnemonic = mnemonic.trim();

    // Ensure that 12 or 24 words are entered.
    const wordCount = trimmedMnemonic.split(/\s+/).length;
    if (wordCount !== 12 && wordCount !== 24) {
      throw new Error('Invalid mnemonic: Must be 12 or 24 words');
    }

    // Initialize the Stamp Collection.
    const wallet = await WalletHD.fromMnemonic(app.electrum, trimmedMnemonic);

    // Set our quantity and the default amont to zero.
    let quantity = wallet.state.stamps.length;
    let amount = 0;

    // If there are stamps, attempt to set the amount more accurately.
    if (quantity) {
      await wallet.state.stamps[0].refreshHistory();

      // Assume the amount based on the first ever transaction of the first ever stamp.
      // NOTE: This is guess-work - we're making a pretty big assumption here.
      amount = Satoshis.fromSats(
        wallet.state.stamps[0]?.state.transactions[0]?.getOutputs()[0]
          ?.valueSatoshis || 0n
      ).toBCH();
    }

    // Add as a new collection with the given mnemonic.
    app.addCollection({
      mnemonic: trimmedMnemonic,
      name: trimmedMnemonic,
      quantity,
      amount,
      currency: 'BCH',
    });

    // Set it as the active collection.
    state.activeCollection = app.stampCollections.length - 1;
  });
}

async function onRenameCollection() {
  $q.dialog({
    title: 'Rename Collection',
    message: 'Enter a new name for this collection',
    prompt: {
      model: '',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (name: string) => {
    // Set the name of the currently active stamp collection.
    activeCollection.value.name = name;
  });
}

async function onDeleteCollection() {
  $q.dialog({
    title: 'Delete',
    message: 'Are you sure you want to delete this collection?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    // Delete the collection.
    app.deleteCollection(state.activeCollection);

    // Set the last collection as active.
    state.activeCollection = app.stampCollections.length - 1;
  });
}

async function onShowMnemonicDialog() {
  $q.dialog({
    title: 'Mnemonic',
    message: activeCollection.value?.mnemonic || 'No Stamp Collection Selected',
  });
}

async function showFundingDialog() {
  fundingQrCode.value?.toggleVisible();
}

async function showRedeemDialog() {
  redeemDialog.value?.toggleVisible();
}

//---------------------------------------------------------------------------
// Template Editing
//---------------------------------------------------------------------------

async function showTemplateEditorDialog() {
  templateEditorDialog.value?.toggleVisible();
}

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
// Stamps and Preview
//---------------------------------------------------------------------------

async function renderStamps() {
  try {
    // Show the loading indicator as this can take some time (to render the QR Codes).
    $q.loading.show();

    // If no collection is selected, return to prevent further execution.
    if (!activeCollection.value || !state.activeTemplate) {
      return;
    }

    // To improve legibility, destructure our selected collection.
    const { mnemonic, amount, currency, quantity } =
      activeCollection.value;

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

    // Iterate over each stamp and render them.
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
  printIFrame.value?.contentWindow?.print();
}

//---------------------------------------------------------------------------
// Watchers
//---------------------------------------------------------------------------

// Render the stamps whenever we change collection settings or template.
watch([
  () => activeCollection.value,
  () => activeCollection.value.amount,
  () => activeCollection.value.currency,
  () => activeCollection.value.quantity,
  () => state.activeTemplate
], () => {
  renderStamps();
});

// Whenever our Visible Stamp HTML changes, update the IFrame.
watch([visibleStamps], async () => {
  // Set the IFrame content.
  if (!printIFrame.value) {
    return;
  }
  const stampsHtml = visibleStamps.value.map((stamp) => stamp.html).join('');
  printIFrame.value.srcdoc = await compileTemplate(PrintTemplate, {
    html: stampsHtml,
  });

  // Wait for the content to load before setting the size of the IFrame.
  printIFrame.value.onload = () => {
    if (!printIFrame.value) {
      return;
    }

    printIFrame.value.style.width =
      printIFrame.value.contentWindow?.document.body.scrollWidth + 'px';
    printIFrame.value.style.height =
      printIFrame.value.contentWindow?.document.body.scrollHeight + 'px';
  };
});

//---------------------------------------------------------------------------
// Initialization/Lifecycle Hooks
//---------------------------------------------------------------------------

// Set the selected collection to the latest one.
state.activeCollection = app.stampCollections.length - 1;
state.activeTemplate = predefinedTemplates[0];
</script>
