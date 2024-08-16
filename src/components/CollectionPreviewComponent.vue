<template>
  <!-- Collection Preview -->
  <div class="q-mb-xl">
    <div class="row">
      <!-- Controls for print/show mnemonic -->
      <div class="col-8 q-gutter-x-sm">
        <q-btn-group>
          <!-- Print Stamps -->
          <q-btn
            outline
            icon="print"
            color="primary"
            :disable="!state.renderedStamps.length"
            @click="printStamps"
          >
            <q-tooltip class="print-hide">Print Stamps</q-tooltip>
          </q-btn>

          <!-- Export as JSON -->
          <q-btn
            outline
            icon="file_download"
            color="secondary"
            :disable="!state.renderedStamps.length"
            @click="exportAsJson"
          >
            <q-tooltip class="print-hide">Export as JSON</q-tooltip>
          </q-btn>
        </q-btn-group>

        <q-toggle
          v-model="state.showClaimedStamps"
          label="Show Claimed Stamps"
        />
        <q-toggle v-model="state.showCutLines" label="Show Cut Lines" />
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
          style="
            width: 210mm;
            height: 297mm;
            border: none;
            overflow-x: hidden;
            overflow-y: hidden;
          "
          scrolling="no"
          class="shadow-20 animate fadeIn"
          sandbox="allow-same-origin allow-scripts allow-modals"
          credentialless="true"
        ></iframe>

        <q-inner-loading
          :showing="state.loading || !state.renderedStamps.length"
        >
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
import { onMounted, onUnmounted, reactive, ref, computed, watch } from 'vue';
import { debounce, exportFile } from 'quasar';

// App / Service / Utils Imports
import { App } from 'src/services/app.js';
import type { StampCollection, Template } from 'src/types.js';
import { compileTemplate, formatStampValue } from 'src/utils/misc.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

// Components.
import TemplateEditorDialog from 'src/components/TemplateEditorDialog.vue';

// Pre-built Templates
import { PageTemplate, builtInTemplates } from 'src/templates/index.js';

interface RenderedStamp {
  html: string;
  claimed: boolean;
}

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const emits = defineEmits(['templateSelected']);

const props = defineProps<{
  app: App;
  stampCollection: StampCollection;
  wallet: WalletHD;
}>();

const state = reactive<{
  loading: boolean;
  activeTemplate?: Template;
  renderedStamps: Array<RenderedStamp>;
  showClaimedStamps: boolean;
  showCutLines: boolean;
}>({
  loading: false,
  activeTemplate: undefined,
  renderedStamps: [],
  showClaimedStamps: true,
  showCutLines: true,
});

// Computeds.
const templates = computed((): Array<Template> => {
  return [
    ...Object.values(builtInTemplates),
    ...Object.values(props.app.templates),
  ];
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
  props.app.setTemplate(newTemplate);

  state.activeTemplate = newTemplate;
}

async function onTemplateCreated(template: Template) {
  props.app.setTemplate(template);

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

    // If no template is selected, return to prevent further execution.
    if (!state.activeTemplate) {
      return;
    }

    // Save this as the active template UUID for this collection.
    emits('templateSelected', state.activeTemplate.uuid);

    // To improve legibility, destructure our selected collection.
    const { amount, currency, quantity, expiry } = props.stampCollection;

    // If this wallet has not been funded, manually set a quantity.
    if (!props.wallet.isFunded.value) {
      props.wallet.setQuantity(quantity);
    }

    // Declare a variable to store our new rendered stamps.
    const newRenderedStamps: Array<RenderedStamp> = [];

    // Iterate over each stamp and render them.
    for (const wallet of props.wallet.wallets.value) {
      // Compile this stamp.
      const compiledStamp = await compileTemplate(
        state.activeTemplate.template,
        {
          valueBch: formatStampValue(wallet.balance.value, 'BCH'),
          value: formatStampValue(amount, currency),
          symbol: props.app.oracles.getOracleSymbol(currency),
          currency: props.app.oracles.getOracleUnitCode(currency),
          expiry,
          wif: wallet.toWif(),
          address: wallet.getAddress(),
        }
      );

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

function exportAsJson() {
  // Set the filename we should use.
  const filename = `${props.stampCollection.name}.json`;

  // Format the fields in the JSON
  const formattedStamps = props.wallet.wallets.value.map((wallet) => ({
    wif: wallet.toWif(),
    address: wallet.getAddress(),
    ...props.stampCollection,
  }));

  // Trigger file download.
  exportFile(filename, JSON.stringify(formattedStamps, null, 2));
}

function onIframeResized(event: MessageEvent) {
  if (event.origin !== window.origin) {
    // Ensure the message is coming from a trusted origin
    return;
  }

  const { width, height } = event.data;

  // Make sure the IFrame element exists..
  if (!printIFrame.value) {
    throw new Error('IFrame element does not exist');
  }

  printIFrame.value.style.width = `${width}px`;
  printIFrame.value.style.height = `${height}px`;
  console.log(`Iframe size changed: ${width}x${height}`);
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
    () => props.stampCollection.expiry,
    () => props.stampCollection.quantity,
    () => props.wallet,
    () => props.wallet.claimedStamps.value,
    () => state.activeTemplate,
  ],
  debounce(async () => {
    await renderStamps();
  }, 1000)
);

// Whenever our Visible Stamp HTML changes, update the IFrame.
watch(
  [visibleStamps, () => state.showCutLines],
  debounce(async () => {
    // Make sure the IFrame element exists..
    if (!printIFrame.value) {
      throw new Error('IFrame element does not exist');
    }

    // Compile the stamp HTML.
    const stampsHtml = visibleStamps.value
      .map((stamp) => {
        return `<div class="stamp-container ${
          stamp.claimed ? 'claimed' : ''
        }">${stamp.html}</div>`;
      })
      .join('');

    // Set the IFrame content.
    printIFrame.value.srcdoc = await compileTemplate(PageTemplate, {
      cutlines: state.showCutLines
        ? '<style>.cutline { border: 1px dashed #82d853 }</style>'
        : '',
      html: stampsHtml,
      style: state.activeTemplate?.style || '',
    });
  }, 500)
);

//---------------------------------------------------------------------------
// Initialization/Lifecycle Hooks
//---------------------------------------------------------------------------

onMounted(() => {
  window.addEventListener('message', onIframeResized);
});

onUnmounted(() => {
  window.removeEventListener('message', onIframeResized);
});

state.activeTemplate =
  templates.value.find(
    (template) => template.uuid === props.stampCollection.templateUUID
  ) || templates.value[0];
</script>
