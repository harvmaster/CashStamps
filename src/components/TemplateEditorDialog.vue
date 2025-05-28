<template>
  <q-dialog v-model="state.visible">
    <q-card style="max-width: 1024px; width: 100%">
      <q-card-section class="text-h6 text-center">
        {{ t('editTemplate') }}
      </q-card-section>
      <q-card-section class="column">
        <div class="q-gutter-y-md">
          <div class="col-grow q-gutter-y-md">
            <!-- Name Input -->
            <div class="row q-col-gutter-sm">
              <div class="col">
                <q-input
                  v-model="state.activeTemplate.label"
                  :label="t('name')"
                  filled
                />
              </div>
              <div>
                <q-btn
                  label="Export"
                  color="secondary"
                  @click="exportTemplate"
                />
              </div>
              <div>
                <UploadButtonComponent
                  @file-content="(content) => importTemplate(content)"
                ></UploadButtonComponent>
              </div>
            </div>

            <!-- Warning Banner -->
            <q-banner class="bg-negative text-white">
              <strong>{{ t('doNot') }}</strong> {{ t('pasteCodeWarning') }}
              <strong>{{ t('doNot') }}</strong> {{ t('useExternalGenerators') }}
              {{ t('contactSupport') }}
            </q-banner>

            <q-expansion-item
              :label="t('instructions')"
              header-class="bg-primary text-white"
            >
              <q-separator />
              <q-card>
                <q-card-section>
                  <p>
                    Use handlebars to echo placeholders/directives into a
                    template. For example:
                    <code v-pre>{{ valueBCH }}</code> or
                    <code v-pre>{{ @QRCODE walletURL wif walletLogo }}</code>
                  </p>
                  <p>The following placeholders/directives are supported:</p>
                  <q-markup-table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>@QRCODE</td>
                        <td>
                          <p>
                            Renders a QR code that encodes a URL. The URL is
                            constructed by concatenating all arguments except
                            the last one.
                          </p>
                          <ul>
                            <li>
                              All arguments except the final one are joined to
                              form the QR code's content
                            </li>
                            <li>
                              The last argument specifies the URL of an image to
                              display as a centered logo within the QR code
                            </li>
                            <li>
                              Both arguments can be either literal values or
                              variable references
                            </li>
                          </ul>
                          <p>
                            Example using placeholders to autofill according to
                            selected wallet:<br />
                            <code
                              v-pre
                              >{{ @QRCODE walletURL wif walletLogo }}</code
                            >
                          </p>
                          <p>
                            Example using custom wallet URL/Logo<br />
                            <code
                              v-pre
                              >{{ @QRCODE https://my-custom-redeem-url.com/wif= wif https://my-custom-logo.png }}</code
                            >
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td>@DATE</td>
                        <td>
                          <p>
                            Formats a date according to the specified format
                            string.
                          </p>
                          <ul>
                            <li>
                              The first argument is the date in 'yyyy-MM-dd'
                              format (e.g., '2025-04-02')
                            </li>
                            <li>
                              The second argument is the output format string
                              (using Luxon DateTime format patterns)
                            </li>
                            <li>
                              Both arguments can be either literal values or
                              variable references
                            </li>
                          </ul>
                          <p>
                            The directive will parse the input date and output
                            it in the requested format.
                          </p>

                          <p>
                            Example to display expiry date in format like "2 Dec
                            2024":<br />
                            <code v-pre>{{ @DATE expiry DD }}</code>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td>paperSize</td>
                        <td>
                          The name of the selected paper size ("letter" or "a4")
                        </td>
                      </tr>
                      <tr>
                        <td>paperWidth</td>
                        <td>
                          The width of the selected paper size in CSS units
                        </td>
                      </tr>
                      <tr>
                        <td>paperHeight</td>
                        <td>
                          The height of the selected paper size in CSS units
                        </td>
                      </tr>
                      <tr>
                        <td>walletName</td>
                        <td>
                          The name of the selected wallet ("Flowee", "Paytaca",
                          "Selene", "ZapIt" or "Random")
                        </td>
                      </tr>
                      <tr>
                        <td>walletURL</td>
                        <td>
                          Installation/Redeem URL for the selected wallet.
                        </td>
                      </tr>
                      <tr>
                        <td>walletLogo</td>
                        <td>Icon URL for the selected wallet.</td>
                      </tr>
                      <tr>
                        <td>valueBch</td>
                        <td>The Stamp's value in BCH</td>
                      </tr>
                      <tr>
                        <td>value</td>
                        <td>The Stamp's value in the selected fiat units</td>
                      </tr>
                      <tr>
                        <td>symbol</td>
                        <td>The selected fiat units symbol</td>
                      </tr>
                      <tr>
                        <td>expiry</td>
                        <td>The expiry date of this Stamp</td>
                      </tr>
                      <tr>
                        <td>wif</td>
                        <td>The raw WIF of this Stamp</td>
                      </tr>
                      <tr>
                        <td>address</td>
                        <td>The CashAddr of this Stamp.</td>
                      </tr>
                      <tr>
                        <td>batchId</td>
                        <td>A two character identifier for this collection (generated deterministically from the mnemonic phrase).</td>
                      </tr>
                      <tr>
                        <td>stampNumber</td>
                        <td>The number of this Stamp.</td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <q-tabs
              v-model="state.activeTab"
              align="justify"
              active-color="primary"
            >
              <q-tab name="front" :label="t('front')" />
              <q-tab name="back" :label="t('back')" />
              <q-tab name="style" :label="t('style')" />
            </q-tabs>

            <q-tab-panels v-model="state.activeTab" animated>
              <q-tab-panel name="front">
                <!-- Text Editor -->
                <div class="scroll" style="height: 800px">
                  <div class="editor-container">
                    <v-ace-editor
                      v-model:value="state.activeTemplate.front"
                      lang="html"
                      @init="editorInit"
                    />
                  </div>
                </div>
              </q-tab-panel>

              <q-tab-panel name="back">
                <q-banner class="bg-warning text-white">
                  Leave this empty if the template should be one-sided.
                </q-banner>
                <!-- Text Editor -->
                <div class="scroll" style="height: 800px">
                  <div class="editor-container">
                    <v-ace-editor
                      v-model:value="state.activeTemplate.back"
                      lang="html"
                      @init="editorInit"
                    />
                  </div>
                </div>
              </q-tab-panel>

              <q-tab-panel name="style">
                <!-- Text Editor -->
                <div class="scroll" style="height: 800px">
                  <div class="editor-container">
                    <v-ace-editor
                      v-model:value="state.activeTemplate.style"
                      lang="html"
                      :options="{}"
                    />
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>
          </div>
          <div class="col-shrink q-gutter-x-md">
            <q-btn
              v-if="!props.activeTemplate.readonly"
              :label="t('save')"
              color="primary"
              @click="saveTemplate"
            />
            <q-btn
              :label="t('saveAsNew')"
              color="secondary"
              @click="copyTemplate"
            />
            <q-btn
              v-if="!props.activeTemplate.readonly"
              :label="t('delete')"
              color="negative"
              @click="deleteTemplate"
              :disabled="props.activeTemplate.readonly"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useQuasar, exportFile, uid } from 'quasar';
import { useI18n } from 'vue-i18n';

import type { Template } from 'src/types.js';

import UploadButtonComponent from './UploadButtonComponent.vue';

import { VAceEditor } from 'vue3-ace-editor';
import ace from 'ace-builds';
import modeHtmlUrl from 'ace-builds/src-noconflict/mode-html?url';
import workerHtmlUrl from 'ace-builds/src-noconflict/worker-html?url';
import themeChromeUrl from 'ace-builds/src-noconflict/theme-chrome?url';

// translations
import translation from './TemplateEditorDialog.i18n.json';

ace.config.setModuleUrl('ace/mode/html', modeHtmlUrl);
ace.config.setModuleUrl('ace/mode/html_worker', workerHtmlUrl);
ace.config.setModuleUrl('ace/theme/chrome', themeChromeUrl);

const $q = useQuasar();

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: translation.messages,
});

export type UpdateTemplate = {
  oldValue: Template;
  newValue: Template;
};

const emits = defineEmits([
  'template:created',
  'template:updated',
  'template:deleted',
]);
const props = defineProps<{ activeTemplate: Template }>();

const state = reactive<{
  visible: boolean;
  activeTemplate: Template;
  activeTab: 'front' | 'back' | 'style';
}>({
  visible: false,
  activeTemplate: { ...props.activeTemplate, readonly: false },
  activeTab: 'front',
});

const toggleVisible = () => {
  state.visible = !state.visible;
};

function editorInit(editor: any) {
  editor.session.setTabSize(2);
}

function saveTemplate() {
  emits('template:updated', state.activeTemplate, props.activeTemplate);

  toggleVisible();
}

function copyTemplate() {
  emits('template:created', { ...state.activeTemplate, uuid: uid() });

  toggleVisible();
}

function exportTemplate() {
  const stringifiedTemplate = JSON.stringify(state.activeTemplate);
  exportFile(
    `CashStamps Template - ${state.activeTemplate.label}.json`,
    stringifiedTemplate
  );
}

function importTemplate(content: string) {
  try {
    // Parse the JSON data.
    const parsedTemplate = JSON.parse(content);

    // NOTE: Make sure we don't allow over-writing the UUID.
    //       Otherwise, this could lead to social attacks whereby a default template is over-ridden.
    state.activeTemplate = {
      ...parsedTemplate,
      uuid: state.activeTemplate.uuid,
    };
  } catch (error) {
    console.error(error);
    $q.dialog({
      title: 'Error importing template',
      message: `${error}`,
    });
  }
}

function deleteTemplate() {
  emits('template:deleted', props.activeTemplate);

  toggleVisible();
}

defineExpose({
  toggleVisible,
});
</script>
