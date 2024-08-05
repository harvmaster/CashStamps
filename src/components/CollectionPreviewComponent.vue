<template>
  <!-- Collection Preview -->
  <div class="q-mb-xl">
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

        <q-toggle v-model="state.showClaimedStamps" label="Show Claimed" />
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
  <div>
    <div class="relative-position">
      <div class="flex justify-center">
        <!-- NOTE: Credentialless is important as it disallows the IFrame from accessing IndexedDB and LocalStorage. -->
        <iframe
          ref="printIFrame"
          style="width: 0px; height: 0px; border: none"
          class="shadow-20"
          sandbox="allow-same-origin allow-scripts allow-modals"
          credentialless="true"
        ></iframe>

        <q-inner-loading :showing="state.loading">
          <q-spinner size="100px" color="primary" />
        </q-inner-loading>
      </div>
    </div>
  </div>

  <!-- Model for editing template code -->
  <template-editor-dialog
    :key="state.activeTemplate"
    ref="templateEditorDialog"
    :activeTemplate="state.activeTemplate"
    @template:created="onTemplateCreated"
    @template:updated="onTemplateUpdated"
    @template:deleted="onTemplateDeleted"
  />
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';

// App / Service / Utils Imports
import { App } from 'src/services/app.js';
import type { StampCollection, Template } from 'src/types.js';
import { compileTemplate, formatStampValue } from 'src/utils/misc.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

// Components.
import TemplateEditorDialog from 'src/components/TemplateEditorDialog.vue';

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

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const props = defineProps<{
  app: App;
  stampCollection: StampCollection;
  wallet?: WalletHD;
}>();

const state = reactive<{
  loading: boolean;
  activeTemplate?: Template;
  renderedStamps: Array<RenderedStamp>;
  showClaimedStamps: boolean;
}>({
  loading: false,
  activeTemplate: undefined,
  renderedStamps: [],
  showClaimedStamps: true,
});

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

// Computeds.
const templates = computed(() => {
  return [...predefinedTemplates, ...props.app.templates];
});

const visibleStamps = computed(() => {
  return state.renderedStamps.filter((stamp) =>
    !state.showClaimedStamps && stamp.claimed ? false : true
  );
});

// Elements
const printIFrame = ref<typeof HTMLIFrameElement.prototype | null>(null);
const templateEditorDialog = ref<typeof TemplateEditorDialog | null>(null);

//---------------------------------------------------------------------------
// Template Editing
//---------------------------------------------------------------------------

async function showTemplateEditorDialog() {
  templateEditorDialog.value?.toggleVisible();
}

async function onTemplateUpdated(newTemplate: Template, oldTemplate: Template) {
  props.app.updateTemplate(newTemplate, oldTemplate);

  state.activeTemplate = newTemplate;
}

async function onTemplateCreated(template: Template) {
  props.app.addTemplate(template);

  state.activeTemplate = template;
}

async function onTemplateDeleted(templateToDelete: Template) {
  props.app.deleteTemplate(templateToDelete);

  state.activeTemplate = templates.value[0];
}

//---------------------------------------------------------------------------
// Stamps and Preview
//---------------------------------------------------------------------------

async function renderStamps() {
  try {
    // Show the loading indicator as this can take some time (to render the QR Codes).
    state.loading = true;

    // If no collection is selected, return to prevent further execution.
    if (!props.wallet || !state.activeTemplate) {
      return;
    }

    // To improve legibility, destructure our selected collection.
    const { amount, currency } = props.stampCollection;

    // Declare a variable to store our new rendered stamps.
    const newRenderedStamps: Array<RenderedStamp> = [];

    // Iterate over each stamp and render them.
    for (const wallet of props.wallet.wallets.value) {
      // Compile this stamp.
      const compiledStamp = await compileTemplate(state.activeTemplate.value, {
        valueBch: formatStampValue(wallet.balance.value, 'BCH'),
        value: formatStampValue(amount, currency),
        symbol: props.app.oracles.getOracleSymbol(currency),
        currency: props.app.oracles.getOracleUnitCode(currency),
        wif: wallet.privateKey().toWif(),
      });

      // Add the compiled template to our list of visible stamps.
      newRenderedStamps.push({
        claimed: props.wallet.isFunded.value && wallet.balance.value <= 0,
        html: compiledStamp,
      });
    }

    // Assign our visible stamps.
    state.renderedStamps = newRenderedStamps;
  } catch (error) {
    console.error(error);
  } finally {
    // Set loading to false.
    state.loading = false;
  }
}

function printStamps() {
  // Print the contents of the IFrame.
  printIFrame.value?.contentWindow?.print();
}

//---------------------------------------------------------------------------
// Watchers
//---------------------------------------------------------------------------

// Render the stamps whenever we change collection settings, wallet or template.
watch(
  [
    () => props.stampCollection,
    () => props.stampCollection.amount,
    () => props.stampCollection.currency,
    () => props.stampCollection.quantity,
    () => props.wallet,
    () => state.activeTemplate,
  ],
  () => {
    renderStamps();
  }
);

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

state.activeTemplate = predefinedTemplates[0];
</script>
