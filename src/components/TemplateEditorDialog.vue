<template>
  <q-dialog v-model="state.visible">
    <q-card style="max-width: 1024px; width: 100%">
      <q-card-section class="text-h6 text-center">
        Edit Template
      </q-card-section>
      <q-card-section class="column">
        <div class="q-gutter-y-md">
          <div class="col-grow q-gutter-y-md">
            <!-- Name Input -->
            <q-input v-model="state.activeTemplate.label" label="Name" filled />

            <!-- Warning Banner -->
            <q-banner class="bg-negative text-white">
              <strong>DO NOT</strong> paste template code here from people you
              do not trust and <strong>DO NOT</strong> use external QR Code
              generators (they will receive your WIF/Private Keys and can
              potentially steal your funds). Reach out on
              <a
                href="https://t.me/stampscash"
                target="_blank"
                class="text-white"
                >Telegram</a
              >
              if you need help.
            </q-banner>

            <q-tabs
              v-model="state.activeTab"
              align="justify"
              active-color="primary"
            >
              <q-tab name="content" label="Content" />
              <q-tab name="style" label="Style" />
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
              label="Save"
              color="primary"
              @click="saveTemplate"
            />
            <q-btn
              label="Save as new template"
              color="secondary"
              @click="copyTemplate"
            />
            <q-btn
              v-if="!props.activeTemplate.readonly"
              label="Delete"
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

import type { Template } from 'src/types.js';

import { VAceEditor } from 'vue3-ace-editor';
import ace from 'ace-builds';
import modeHtmlUrl from 'ace-builds/src-noconflict/mode-html?url';
import workerHtmlUrl from 'ace-builds/src-noconflict/worker-html?url';
import themeChromeUrl from 'ace-builds/src-noconflict/theme-chrome?url';

ace.config.setModuleUrl('ace/mode/html', modeHtmlUrl);
ace.config.setModuleUrl('ace/mode/html_worker', workerHtmlUrl);
ace.config.setModuleUrl('ace/theme/chrome', themeChromeUrl);

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
