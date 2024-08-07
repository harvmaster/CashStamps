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
              <strong>DO NOT:</strong>
              <ol>
                <li>Paste template code in here from people you do not trust.</li>
                <li>Use external URL-based QR Code generators - they will receive your WIFs (Private Keys) and can then steal your funds.</li>
              </ol>
              In future, we hope to revise Template Editing to make this simpler. In the meantime, if you need help, reach out on <a href="https://t.me/stampscash" target="_blank" class="text-white">Telegram</a>.
            </q-banner>

            <!-- Text Editor -->
            <div class="scroll" style="height: 800px">
              <q-input
                v-model="state.activeTemplate.value"
                label="Code"
                autogrow
                filled
              />
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
  mode: 'advanced',
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

  toggleVisible();
}

defineExpose({
  toggleVisible,
});
</script>
