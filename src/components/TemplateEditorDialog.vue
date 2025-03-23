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
              <UploadButtonComponent @file-content="(content) => importTemplate(content)"></UploadButtonComponent>
              </div>
            </div>

            <!-- Warning Banner -->
            <q-banner class="bg-negative text-white">
              <strong>{{ t('doNot') }}</strong> {{ t('pasteCodeWarning') }}
              <strong>{{ t('doNot') }}</strong> {{ t('useExternalGenerators') }}
              {{ t('contactSupport') }}
            </q-banner>

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
                <p>This is the front-side of the template.</p>
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
                <p>This is the back side of the template. Leave this blank if the template should be one-sided.</p>
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
                      :options="{

                      }"
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
  exportFile(`CashStamps Template - ${state.activeTemplate.label}.json`, stringifiedTemplate);
}

function importTemplate(content: string) {
  try {
    // Parse the JSON data.
    const parsedTemplate = JSON.parse(content);

    // NOTE: Make sure we don't allow over-writing the UUID.
    //       Otherwise, this could lead to social attacks whereby a default template is over-ridden.
    state.activeTemplate = { ...parsedTemplate, uuid: state.activeTemplate.uuid };
  } catch(error) {
    console.error(error);
    $q.dialog({
        title: 'Error importing template',
        message: `${error}`
    })
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
