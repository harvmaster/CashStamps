<template>
  <div>
    <!-- Collection Preview -->
    <div class="inner-page">
      <div class="q-col-gutter-y-md q-mb-lg">
        <div class="row">
          <div class="col-12">
            <q-banner
              v-if="!$q.platform.is.chrome"
              class="bg-negative text-white"
              inline-actions
            >
              Your browser is unsupported and may not render/print correctly.
              For best results, please use a Chrome-based browser.
              <template v-slot:action>
                <q-btn
                  flat
                  type="a"
                  href="https://brave.com"
                  target="_blank"
                  color="white"
                  label="Brave Browser"
                />
              </template>
            </q-banner>
          </div>
        </div>

        <div class="row">
          <!-- Controls for print/show mnemonic -->
          <div class="col-md-6 col-12 q-gutter-x-sm">
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
                <q-tooltip class="print-hide">{{
                  t('exportAsJson')
                }}</q-tooltip>
              </q-btn>
            </q-btn-group>

            <!--
            <q-toggle
              v-model="state.showClaimedStamps"
              :label="t('showClaimedStamps')"
            />
            <q-toggle v-model="state.showCutLines" :label="t('showCutLines')" />
            -->
          </div>

          <!-- Template selection -->
          <div class="col-md-6 col-12">
            <q-select
              :label="t('template')"
              :options="templates"
              v-model="state.activeTemplate"
              @update:model-value="renderStamps"
              dense
              filled
            >
              <template v-slot:option="scope">
                <q-item-label
                  v-if="typeof scope.opt === 'string'"
                  header
                  class="text-weight-bold"
                >
                  {{ scope.opt }}
                </q-item-label>

                <q-item v-else v-bind="scope.itemProps">
                  <q-item-section class="q-pl-md">
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:after>
                <!-- Copy Template -->
                <q-btn
                  round
                  dense
                  flat
                  icon="file_copy"
                  @click="copyTemplate()"
                >
                  <q-tooltip>{{ t('cloneTemplate') }}</q-tooltip>
                </q-btn>

                <!-- Import Template -->
                <q-btn
                  round
                  dense
                  flat
                  icon="download"
                  @click="importTemplate()"
                >
                  <q-tooltip>{{ t('importTemplate') }}</q-tooltip>
                </q-btn>

                <template v-if="!state.activeTemplate?.readonly">
                  <q-separator class="q-ma-xs" vertical />

                  <!-- Export Template -->
                  <q-btn
                    round
                    dense
                    flat
                    icon="upload"
                    @click="exportTemplate()"
                  >
                    <q-tooltip>{{ t('exportTemplate') }}</q-tooltip>
                  </q-btn>

                  <!-- Delete Template -->
                  <q-btn
                    round
                    dense
                    flat
                    icon="delete"
                    color="negative"
                    @click="deleteTemplate()"
                  >
                    <q-tooltip>{{ t('deleteTemplate') }}</q-tooltip>
                  </q-btn>

                  <!-- Advanced Template Editor -->
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
              </template>
            </q-select>
          </div>
        </div>

        <!-- V2 Template Options -->
        <template v-if="state.activeTemplate && state.activeTemplate.variables">
          <div class="row q-col-gutter-md">
            <div class="col-md-4 col-6">
              <q-select
                :label="t('paperSize')"
                :options="Object.keys(paperSizes)"
                v-model="state.templateData.paperSize"
                @update:model-value="renderStamps"
                dense
                filled
              />
            </div>
            <div class="col-md-4 col-6">
              <q-select
                :label="t('wallet')"
                :options="Object.keys(wallets)"
                v-model="state.templateData.wallet"
                @update:model-value="renderStamps"
                dense
                filled
              />
            </div>
            <div class="col-md-4 col-6">
              <q-select
                :label="t('language')"
                :options="['English', 'Spanish']"
                v-model="state.tempLanguage"
                disable
                @update:model-value="renderStamps"
                dense
                filled
              />
            </div>
          </div>
        </template>

        <!-- Theme Customizer -->
        <TemplateCustomizationComponent
          :key="state.activeTemplate?.uuid"
          v-if="state.activeTemplate?.variables"
          :template="state.activeTemplate"
          :onCopyTemplate="copyTemplate"
          @template:updated="onTemplateUpdated"
        />
      </div>
    </div>

    <!-- Show Front/Back Toggle -->
    <template v-if="state.activeTemplate?.back">
      <div class="row justify-center q-mb-lg">
        <q-btn-toggle
          v-model="state.showingSide"
          :options="[
            { label: 'Front', value: 'front' },
            { label: 'Back', value: 'back' },
          ]"
          toggle-color="primary"
          style="width: 375px"
          @update:model-value="renderStamps"
          spread
          rounded
        />
      </div>
    </template>

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
            csp="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none';"
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

    <!-- Display Options -->
    <div class="flex justify-center q-mt-md">
      <q-toggle
        v-model="state.showClaimedStamps"
        :label="t('showClaimedStamps')"
      />
      <q-toggle v-model="state.showCutLines" :label="t('showCutLines')" />
    </div>

    <div class="row justify-center q-mt-xl q-mb-md">
      <q-btn
        label="Print Stamps"
        icon="print"
        color="primary"
        :disable="!state.renderedStamps.length"
        @click="printStamps"
        class="q-pl-xl q-pr-xl strong"
        rounded
      />
    </div>

    <!-- Model for editing template code -->
    <template-editor-dialog
      v-if="state.activeTemplate && state.isEditorVisible"
      v-model="state.isEditorVisible"
      ref="templateEditorDialog"
      :activeTemplate="state.activeTemplate"
      @template:created="onTemplateCreated"
      @template:updated="onTemplateUpdated"
      @template:deleted="onTemplateDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, computed, watch } from 'vue';
import { useQuasar, debounce, exportFile, uid } from 'quasar';
import { useI18n } from 'vue-i18n';

// App / Service / Utils Imports
import { TemplateData } from 'src/types.js';
import { App } from 'src/services/app.js';
import {
  type StampCollection,
  type Template,
  type TemplateVariables,
  TemplateSchema,
  TemplateVariablesSchema,
} from 'src/types.js';
import {
  compileTemplate,
  confirm,
  formatStampValue,
  generateBatchID,
  pickFile,
} from 'src/utils/misc.js';
import { showAsyncDialog } from 'src/utils/ui.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

// Components.
import TemplateCustomizationComponent from 'src/components/TemplateCustomizationComponent.vue';
import TemplateEditorDialog from 'src/components/TemplateEditorDialog.vue';
import AutoExpireDialog from 'src/components/AutoExpireDialog.vue';

// Pre-built Templates
import { PageTemplate, builtInTemplates } from 'src/templates/index.js';

// Translations
import translations from './CollectionPreviewComponent.i18n.json';

interface RenderedStamp {
  html: string;
  claimed: boolean;
}

const $q = useQuasar();

const paperSizes = {
  A4: {
    paperSize: 'a4',
    paperWidth: '210mm',
    paperHeight: '297mm',
  },
  Letter: {
    paperSize: 'letter',
    paperWidth: '8.5in',
    paperHeight: '11in',
  },
};

const wallets = {
  Cashonize: {
    walletName: 'Cashonize',
    walletURL: 'https://stamps.cash/#/redeem?w=c&wif=',
    walletLogo: '/icons/cashonize.png',
  },
  Edge: {
    walletName: 'Edge Wallet',
    walletURL: 'https://stamps.cash/#/redeem?w=e&wif=',
    walletLogo: '/icons/edge.png',
  },
  Flowee: {
    walletName: 'Flowee',
    walletURL: 'https://stamps.cash/#/redeem?w=f&wif=',
    walletLogo: '/icons/flowee.png',
  },
  Optn: {
    walletName: 'OPTN Wallet',
    walletURL: 'https://stamps.cash/#/redeem?w=o&wif=',
    walletLogo: '/icons/optn.png',
  },
  Paytaca: {
    walletName: 'Paytaca',
    walletURL: 'https://stamps.cash/#/redeem?w=p&wif=',
    walletLogo: '/icons/paytaca.png',
  },
  Selene: {
    walletName: 'Selene',
    walletURL: 'https://stamps.cash/#/redeem?w=s&wif=',
    walletLogo: '/icons/selene.png',
  },
  ZapIt: {
    walletName: 'ZapIt',
    walletURL: 'https://stamps.cash/#/redeem?w=z&wif=',
    walletLogo: '/icons/zapit.png',
  },
  Random: {
    walletName: 'Random',
    walletURL: 'https://stamps.cash/#/redeem?w=r&wif=',
    walletLogo: '/bch.svg',
  },
};

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
  showingSide: 'front' | 'back';
  templateData: TemplateData;
  isEditorVisible: boolean;
  // TODO: Remove me.
  tempTheme: undefined;
  tempLanguage: undefined;
}>({
  loading: false,
  activeTemplate: undefined,
  renderedStamps: [],
  showClaimedStamps: true,
  showCutLines: true,
  showingSide: 'front',
  templateData: {
    paperSize: 'Letter',
    wallet: 'Selene',
    ...props.stampCollection.templateData,
  },
  isEditorVisible: false,
  // TODO: Remove me.
  tempTheme: undefined,
  tempLanguage: undefined,
});

// Computeds.
const templates = computed((): Array<Template | string> => {
  return [
    'Built-In Templates',
    ...Object.values(builtInTemplates),
    'Custom Templates',
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
  state.isEditorVisible = true;
}

async function onTemplateUpdated(
  newTemplate: Template,
  _oldTemplate?: Template
) {
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

async function copyTemplate() {
  $q.dialog({
    title: 'Copy Template',
    message: 'Enter a new name for this template',
    prompt: {
      model: '',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (newLabel: string) => {
    if (!state.activeTemplate) {
      return;
    }

    await onTemplateCreated({
      ...state.activeTemplate,
      label: newLabel,
      uuid: uid(),
      readonly: false,
    });
  });
}

function exportTemplate() {
  if (!state.activeTemplate) {
    return;
  }

  const stringifiedTemplate = JSON.stringify(state.activeTemplate);
  exportFile(
    `CashStamps Template - ${state.activeTemplate.label}.json`,
    stringifiedTemplate
  );
}

async function importTemplate() {
  try {
    const content = await pickFile({ accept: 'application/json' });

    if (!content) {
      return;
    }

    // Verify the template schema.
    const parsedTemplate = TemplateSchema.parse(JSON.parse(content));

    // Validate variables (if there are any).
    if (parsedTemplate.variables) {
      TemplateVariablesSchema.parse(JSON.parse(parsedTemplate.variables));
    }

    // NOTE: Make sure we don't allow over-writing the UUID.
    //       Otherwise, this could lead to social attacks whereby a default template is over-ridden.
    await onTemplateCreated({
      ...parsedTemplate,
      uuid: uid(),
    });
  } catch (error) {
    console.error(error);
    $q.dialog({
      title: 'Error importing template',
      message: `${error}`,
    });
  }
}

async function deleteTemplate() {
  if (
    !(await confirm({
      title: 'Delete Template',
      message: 'Are you sure you want to delete this template?',
      cancel: true,
      persistent: true,
    }))
  ) {
    return;
  }

  if (!state.activeTemplate) {
    return;
  }

  await onTemplateDeleted(state.activeTemplate);
}

//---------------------------------------------------------------------------
// Stamps and Preview
//---------------------------------------------------------------------------

function compileGlobalVariables() {
  // To improve legibility, destructure our selected collection.
  const { templateData } = props.stampCollection;

  // Get the appropriate paper size and wallet configuration
  const paperSizeKey =
    (templateData?.['paperSize'] as keyof typeof paperSizes) || 'Letter';
  const walletKey =
    (templateData?.['wallet'] as keyof typeof wallets) || 'Selene';
  const batchId = generateBatchID(props.stampCollection.mnemonic);

  // Define default global variables.
  const globalVariables: Record<string, string> = {
    ...(paperSizes[paperSizeKey] || paperSizes['Letter']),
    ...(wallets[walletKey] || wallets['Selene']),
    batchId,
  };

  return globalVariables;
}

function compileTemplateVariables(): Record<string, string> {
  // If this is not a V2 template with variables, return empty.
  if (!state.activeTemplate || state.activeTemplate.version !== 2) {
    return {};
  }

  // Decode variables to a JS Object (note: It is technically a string).
  const variables: TemplateVariables =
    JSON.parse(state.activeTemplate.variables || '{}') || {};

  const acc: Record<string, string> = {};

  const walk = (section: Section, prefix: string) => {
    for (const [key, entry] of Object.entries(section)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if ('type' in entry) {
        acc[path] = entry.value; // it's a Field
      } else {
        walk(entry, path); // it's a nested Section
      }
    }
  };

  walk(variables, '');

  return acc;
}

async function renderStamps() {
  try {
    // Show the loading indicator as this can take some time (to render the QR Codes).
    state.loading = true;

    // If no template is selected, return to prevent further execution.
    if (!state.activeTemplate) {
      return;
    }

    // If this template does not have a "back" side, but "back" is selected, switch to front.
    if (!state.activeTemplate.back && state.showingSide === 'back') {
      state.showingSide = 'front';
    }

    // Save the current template UUID as the active template UUID for this collection.
    emits('templateSelected', state.activeTemplate.uuid);

    // Save the Template Data.
    emits('templateDataUpdated', state.templateData);

    // To improve legibility, destructure our selected collection.
    const { amount, currency, quantity, expiry } = props.stampCollection;

    // Get our global variables.
    const globalVariables = compileGlobalVariables();
    const templateVariables = compileTemplateVariables();

    // If this wallet has not been funded, manually set a quantity.
    if (!props.wallet.isFunded.value) {
      props.wallet.setQuantity(quantity);
    }

    // Declare a variable to store our new rendered stamps.
    const newRenderedStamps: Array<RenderedStamp> = [];

    // Iterate over each stamp and render them.
    for (const [index, wallet] of props.wallet.wallets.value.entries()) {
      // Get the template side we are printing (front or back).
      const templateSide = state.activeTemplate[state.showingSide];

      // Compile this stamp.
      const compiledStamp = await compileTemplate(templateSide, {
        valueBch: formatStampValue(wallet.balance.value, 'BCH'),
        value: formatStampValue(amount, currency),
        symbol: props.app.oracles.getOracleSymbol(currency),
        currency: props.app.oracles.getOracleUnitCode(currency),
        expiry,
        wif: wallet.toWif(),
        address: wallet.getAddress(),
        stampNumber: Number(index + 1).toString(),
        ...globalVariables,
        ...templateVariables,
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

async function printStamps() {
  // If auto-expiry is not enabled, prompt user to enable it.
  if (
    props.app.autoExpire.isServiceAvailable.value &&
    !props.app.autoExpire.isAutoExpireEnabled.value
  ) {
    const wantsAutoExpire = await confirm({
      title: 'Enable Auto-Expire',
      message: `Would you like to enable auto-expiry so that your Stamps are automatically reclaimed on ${props.stampCollection.expiry}?`,
      ok: {
        label: 'Yes',
        color: 'primary',
        flat: true,
      },
      cancel: {
        label: 'No',
        color: undefined,
        flat: true,
      },
    });

    if (wantsAutoExpire) {
      await showAsyncDialog(AutoExpireDialog, {
        app: props.app,
        stampCollection: props.stampCollection,
        wallet: props.wallet,
      });
    }
  }

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
    // NOTE: If Auto-Expire fails for whatever reason, just ignore it.
    try {
      // If auto-expire is enabled, refresh it.
      if (props.app.autoExpire.isAutoExpireEnabled.value) {
        await props.app.autoExpire.refresh();
      }
    } catch (error) {
      console.warn(`AutoExpire: refresh() failed: ${error}`);
    }

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
    const stampsCSS = await compileTemplate(state.activeTemplate?.style || '', {
      ...compileGlobalVariables(),
      ...compileTemplateVariables(),
    });

    // Compile the stamp HTML.
    const stampsHtml = visibleStamps.value
      .map((stamp, i) => {
        const wasAutoExpired = props.app.autoExpire.wasAutoExpired(i);

        return `<div class="stamp-container ${stamp.claimed ? 'claimed' : ''} ${
          wasAutoExpired ? 'auto-expired' : ''
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
      showingSide: state.showingSide,
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

// Set the template to that specified by the Stamp Collection.
// Otherwise, just get the first template from our list of templates.
const isTemplate = (t) => typeof t !== 'string';
state.activeTemplate =
  templates.value.find(
    (template) =>
      isTemplate(template) &&
      template.uuid === props.stampCollection.templateUUID
  ) || templates.value.find(isTemplate);
</script>
