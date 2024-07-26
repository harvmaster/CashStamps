<template>
  <q-dialog v-model="state.visible">
    <q-card style="max-width: 1024px; width: 100%">
      <q-card-section class="text-h6 text-center">
        Edit Template
      </q-card-section>
      <q-card-section class="column">
        <div class="q-gutter-y-md">
          <div class="col-grow q-gutter-y-md">
            <q-input v-model="state.activeTemplate.label" label="Name" filled />
            <div class="scroll" style="height: 800px">
              <q-tabs
                v-model="state.mode"
                align="justify"
                active-color="primary"
              >
                <q-tab name="simple" label="Simple" />
                <q-tab name="advanced" label="Advanced" />
              </q-tabs>
              <q-tab-panels
                v-model="state.mode"
                animated
                class="shadow-2 rounded-borders"
              >
                <q-tab-panel name="simple">
                  <q-banner class="bg-warning text-white">
                    <strong
                      >The Simple Editor should only be used for minor textual
                      modifications. It is very fragile, so be careful.</strong
                    >
                  </q-banner>
                  <q-editor
                    v-model="state.activeTemplate.value"
                    min-height="5rem"
                  />
                </q-tab-panel>
                <q-tab-panel name="advanced">
                  <q-input
                    v-model="state.activeTemplate.value"
                    label="Code"
                    autogrow
                    filled
                  />
                </q-tab-panel>
              </q-tab-panels>
            </div>
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

import type { Template } from 'src/types.js';

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
  mode: 'simple' | 'advanced';
}>({
  visible: false,
  activeTemplate: { ...props.activeTemplate, readonly: false },
  mode: 'simple',
});

const toggleVisible = () => {
  state.visible = !state.visible;
};

function saveTemplate() {
  emits('template:updated', state.activeTemplate, props.activeTemplate);

  toggleVisible();
}

function copyTemplate() {
  emits('template:created', state.activeTemplate);

  toggleVisible();
}

function deleteTemplate() {
  emits('template:deleted', props.activeTemplate);
}

defineExpose({
  toggleVisible,
});
</script>
