<template>
  <!-- Collection Preview -->
  <div class="inner-page">
    <div class="q-col-gutter-y-md q-mb-xl">
      <div class="row">
        <!-- Controls for print/show mnemonic -->
        <div class="col-md-8 col-12 q-gutter-x-sm">
          <q-btn-group>
            <!-- Print Stamps -->
            <q-btn
              outline
              icon="print"
              color="primary"
              :disable="!state.renderedStamps.length"
              @click="printStamps"
            >
              <q-tooltip class="print-hide">{{ t('printStamps') }}</q-tooltip>
            </q-btn>

            <!-- Export as JSON -->
            <q-btn
              outline
              icon="file_download"
              color="secondary"
              :disable="!state.renderedStamps.length"
              @click="exportAsJson"
            >
              <q-tooltip class="print-hide">{{ t('exportAsJson') }}</q-tooltip>
            </q-btn>
          </q-btn-group>

          <q-toggle
            v-model="state.showClaimedStamps"
            :label="t('showClaimedStamps')"
          />
          <q-toggle v-model="state.showCutLines" :label="t('showCutLines')" />
        </div>

        <!-- Template selection -->
        <div class="col-md-4 col-12">
          <q-select
            :label="t('template')"
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
                <q-tooltip>{{ t('editTemplate') }}</q-tooltip>
              </q-btn>
            </template>
          </q-select>
        </div>
      </div>

      <template v-if="state.activeTemplate.version === 2">
        <div class="row q-col-gutter-md">
          <div class="col-md-3 col-6">
            <q-select
              :label="t('Paper Size')"
              :options="Object.keys(paperSizes)"
              v-model="state.templateData.paperSize"
              @update:model-value="renderStamps"
              dense
              filled
            />
          </div>
          <div class="col-md-3 col-6">
            <q-select
              :label="t('Wallet')"
              :options="Object.keys(wallets)"
              v-model="state.templateData.wallet"
              @update:model-value="renderStamps"
              dense
              filled
            />
          </div>
          <div class="col-md-3 col-6">
            <q-select
              :label="t('Background')"
              :options="['NA']"
              disable
              v-model="state.wallet"
              @update:model-value="renderStamps"
              dense
              filled
            />
          </div>
          <div class="col-md-3 col-6">
            <q-select
              :label="t('Language')"
              :options="['English']"
              disable
              v-model="state.wallet"
              @update:model-value="renderStamps"
              dense
              filled
            />
          </div>
        </div>
      </template>
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
import { useI18n } from 'vue-i18n';

// App / Service / Utils Imports
import { TemplateData } from 'src/types.js';
import { App } from 'src/services/app.js';
import type { StampCollection, Template } from 'src/types.js';
import { compileTemplate, formatStampValue } from 'src/utils/misc.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

// Components.
import TemplateEditorDialog from 'src/components/TemplateEditorDialog.vue';

// Pre-built Templates
import { PageTemplate, builtInTemplates } from 'src/templates/index.js';

// Translations
import translations from './CollectionPreviewComponent.i18n.json';

interface RenderedStamp {
  html: string;
  claimed: boolean;
}

const paperSizes = {
  'A4': {
    paperSize: 'a4',
    paperWidth: '210mm',
    paperHeight: '297mm',
  },
  'Letter': {
    paperSize: 'letter',
    paperWidth: '8.5in',
    paperHeight: '11in',
  },
}

const wallets = {
  'Flowee': {
    walletName: 'Flowee',
    walletURL: 'https://stamps.cash/#/redeem?a=1&w=f&wif=',
    walletLogo: '/icons/flowee.png',
  },
  'Paytaca': {
    walletName: 'Paytaca',
    walletURL: 'https://stamps.cash/#/redeem?a=1&w=p&wif=',
    walletLogo: '/icons/paytaca.png',
  },
  'Selene': {
    walletName: 'Selene',
    walletURL: 'https://stamps.cash/#/redeem?a=1&w=s&wif=',
    walletLogo: '/icons/selene.png',
  },
  'ZapIt': {
    walletName: 'ZapIt',
    walletURL: 'https://stamps.cash/#/redeem?a=1&w=z&wif=',
    walletLogo: '/icons/zapit.png',
  },
  'Random': {
    walletName: 'Random',
    walletURL: 'https://stamps.cash/#/redeem?a=1&w=r&wif=',
    walletLogo: '/bch.svg',
  },
}

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const emits = defineEmits(['templateSelected', 'templateDataUpdated']);

const props = defineProps<{
  app: App;
  stampCollection: StampCollection;
  wallet: WalletHD;
}>();

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: translations.messages,
});

const state = reactive<{
  loading: boolean;
  activeTemplate?: Template;
  renderedStamps: Array<RenderedStamp>;
  showClaimedStamps: boolean;
  showCutLines: boolean;

  // V2 Template State
  templateData: TemplateData;
}>({
  loading: false,
  activeTemplate: undefined,
  renderedStamps: [],
  showClaimedStamps: true,
  showCutLines: true,
  templateData: {
    paperSize: 'Letter',
    wallet: 'Selene',
    ...props.stampCollection.templateData,
  }
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

function compileGlobalVariables() {
  // To improve legibility, destructure our selected collection.
  const { templateData } = props.stampCollection;

  // Get the appropriate paper size and wallet configuration
  const paperSizeKey = templateData?.['paperSize'] as keyof typeof paperSizes || 'Letter';
  const walletKey = templateData?.['wallet'] as keyof typeof wallets || 'Selene';

  // Define default global variables.
  const globalVariables: Record<string, string> = {
    ...paperSizes[paperSizeKey] || paperSizes['Letter'],
    ...wallets[walletKey] || wallets['Selene']
  };

  return globalVariables;
}

async function renderStamps() {
  try {
    // Show the loading indicator as this can take some time (to render the QR Codes).
    state.loading = true;

    // If no template is selected, return to prevent further execution.
    if (!state.activeTemplate) {
      return;
    }

    // Save the current template UUID as the active template UUID for this collection.
    emits('templateSelected', state.activeTemplate.uuid);

    // Save the Template Data.
    emits('templateDataUpdated', state.templateData);

    // To improve legibility, destructure our selected collection.
    const { amount, currency, quantity, expiry } = props.stampCollection;

    // Get our global variables.
    const globalVariables = compileGlobalVariables();

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
          ...globalVariables,
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

    // Compile the stamp CSS.
    const stampsCSS = await compileTemplate(state.activeTemplate?.style || '', compileGlobalVariables());

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
      style: stampsCSS,
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
