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
            <q-input v-model="state.activeTemplate.label" :label="t('name')" filled />

            <!-- Warning Banner -->
            <q-banner class="bg-negative text-white">
              <strong>{{ t('doNot') }}</strong> {{ t('pasteCodeWarning') }} <strong>{{ t('doNot') }}</strong> {{ t('useExternalGenerators') }}
              {{ t('contactSupport') }}
            </q-banner>

            <q-tabs
              v-model="state.activeTab"
              align="justify"
              active-color="primary"
            >
              <q-tab name="content" :label="t('content')" />
              <q-tab name="style" :label="t('style')" />
            </q-tabs>

            <q-tab-panels v-model="state.activeTab" animated>
              <q-tab-panel name="content">
                <!-- Text Editor -->
                <div class="scroll" style="height: 800px">
                  <div class="editor-container">
                    <v-ace-editor
                      v-model:value="state.activeTemplate.template"
                      lang="html"
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
import { uid } from 'quasar';
import { useI18n } from 'vue-i18n';

import type { Template } from 'src/types.js';

import { VAceEditor } from 'vue3-ace-editor';
import ace from 'ace-builds';
import modeHtmlUrl from 'ace-builds/src-noconflict/mode-html?url';
import workerHtmlUrl from 'ace-builds/src-noconflict/worker-html?url';
import themeChromeUrl from 'ace-builds/src-noconflict/theme-chrome?url';

// translations
import translation from './TemaplteEditorDialog.i18n.json'

ace.config.setModuleUrl('ace/mode/html', modeHtmlUrl);
ace.config.setModuleUrl('ace/mode/html_worker', workerHtmlUrl);
ace.config.setModuleUrl('ace/theme/chrome', themeChromeUrl);

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
  activeTab: 'content' | 'style';
}>({
  visible: false,
  activeTemplate: { ...props.activeTemplate, readonly: false },
  activeTab: 'content',
});

const toggleVisible = () => {
  state.visible = !state.visible;
};

function saveTemplate() {
  emits('template:updated', state.activeTemplate, props.activeTemplate);

  toggleVisible();
}

function copyTemplate() {
  emits('template:created', { ...state.activeTemplate, uuid: uid() });

  toggleVisible();
}

function deleteTemplate() {
  emits('template:deleted', props.activeTemplate);

  toggleVisible();
}

defineExpose({
  toggleVisible,
});
</script>
