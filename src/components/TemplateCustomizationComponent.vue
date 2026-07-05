<template>
  <div style="position: relative">
    <q-list bordered>
      <!-- Theme Customizer -->
      <q-expansion-item
        v-if="template.variables"
        :label="t('Customize Template')"
        icon="edit"
        header-class="bg-primary text-white"
        expand-icon-class="text-white"
        dense
      >
        <!-- Section Tab Headers -->
        <q-tabs
          v-model="state.customizeTab"
          align="justify"
          active-color="primary"
        >
          <q-tab
            v-for="sectionName in Object.keys(state.variables)"
            :key="sectionName"
            :name="sectionName"
            :label="sectionName"
          />
        </q-tabs>

        <!-- Section Bodies -->
        <q-tab-panels v-model="state.customizeTab" animated>
          <q-tab-panel
            v-for="[sectionName, variables] in Object.entries(state.variables)"
            :key="sectionName"
            :name="sectionName"
          >
            <q-list bordered>
              <q-item
                v-for="[variableName, props] in Object.entries(variables)"
                :key="variableName"
              >
                <q-item-section class="field-label">
                  <q-item-label>{{ props.label }}</q-item-label>
                </q-item-section>
                <q-item-section>
                  <!-- Color Input -->
                  <template v-if="props.type === 'color'">
                    <q-input
                      v-model="state.variables[sectionName][variableName].value"
                      :rules="[
                        (val) =>
                          testPattern.hexOrHexaColor(val) || 'Invalid color',
                      ]"
                      :hint="props.hint"
                      filled
                    >
                      <template v-slot:prepend>
                        <q-icon
                          name="square"
                          class="cursor-pointer"
                          :style="{
                            color:
                              state.variables[sectionName][variableName].value,
                          }"
                        >
                          <q-popup-proxy
                            cover
                            transition-show="scale"
                            transition-hide="scale"
                          >
                            <q-color
                              v-model="
                                state.variables[sectionName][variableName].value
                              "
                            />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </template>

                  <!-- Image Input -->
                  <template v-else-if="props.type === 'image'">
                    <div
                      style="cursor: pointer; display: inline-block;"
                      @click="openFilePicker(sectionName, variableName)"
                    >
                      <img
                        :src="state.variables[sectionName][variableName].value"
                        style="max-height: 200px; max-width: 100%; display: block;"
                        class="image-input"
                      />
                    </div>

                    <q-item-label caption class="q-pt-md">{{
                      props.hint
                    }}</q-item-label>
                  </template>

                  <!-- String Input -->
                  <template v-else-if="props.type === 'string'">
                    <q-input
                      v-model="state.variables[sectionName][variableName].value"
                      :hint="props.hint"
                      filled
                    />
                  </template>

                  <!-- Text Area Input -->
                  <template v-else-if="props.type === 'text'">
                    <q-input
                      v-model="state.variables[sectionName][variableName].value"
                      type="textarea"
                      :hint="props.hint"
                      filled
                    />
                  </template>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </q-expansion-item>
    </q-list>

    <div
      v-if="template.readonly"
      class="absolute-full"
      style="cursor: pointer; z-index: 1"
      @click="props.onCopyTemplate()"
    />

    <!-- Global File Picker -->
    <!-- NOTE: This is a workaround to constraints of HTML's File Picker -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { useQuasar, debounce, patterns } from 'quasar';
import { useI18n } from 'vue-i18n';

// App / Service / Utils Imports
import { type TemplateV2, type TemplateVariables } from 'src/types.js';

// Translations
import translations from './CollectionPreviewComponent.i18n.json';

const $q = useQuasar();
const { testPattern } = patterns;

const fileInputRef = ref<HTMLInputElement | null>(null);

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: translations.messages,
});

/*
const template = defineModel<TemplateV2>('template', {
  default: () => ({}),
});
*/

const emits = defineEmits([
  'template:updated',
]);

const props = defineProps<{
  template: TemplateV2,
  onCopyTemplate: () => Promise<void>
}>();

const state = reactive<{
  customizeTab: string;
  variables: TemplateVariables;
}>({
  customizeTab: '',
  variables: JSON.parse(props.template.variables)
});

function openFilePicker(sectionName: string, variableName: string) {
  if (!fileInputRef.value) {
    return;
  }

  fileInputRef.value.onchange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) onFileChange(file, sectionName, variableName);
    if (fileInputRef.value) {
      fileInputRef.value.value = ''; // reset so the same file can be picked again + prevents stale firing
    }
  };
  fileInputRef.value.click();
}

function onFileChange(
  newFile: File,
  sectionName: string,
  variableName: string
) {
  if (!newFile) return;

  const reader = new FileReader();
  reader.onload = (e: ProgressEvent<FileReader>) => {
    const result = e.target?.result;
    if (typeof result === 'string') {
      state.variables[sectionName][variableName].value = result;
    }
  };
  reader.readAsDataURL(newFile);
}

// Debounce because we don't want text inputs to trigger re-render.
const debouncedTemplateUpdated = debounce((variables) => {
  emits('template:updated', {
    ...props.template,
    variables: JSON.stringify(state.variables),
  }, props.template);
}, 500);

//---------------------------------------------------------------------------
// Watchers
//---------------------------------------------------------------------------

watch(
  () => state.variables,
  () => {
    debouncedTemplateUpdated();
  },
  { deep: true }
);

//---------------------------------------------------------------------------
// Initialization/Lifecycle Hooks
//---------------------------------------------------------------------------

state.customizeTab = Object.keys(state.variables)[0] || '';
</script>

<style lang="scss">
.field-label {
  max-width: 120px;
  min-width: 120px;
}

// Checkerboard background to show transparency.
.image-input {
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, 10px 0;
}
</style>
