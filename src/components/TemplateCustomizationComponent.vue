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
            v-for="sectionName in Object.keys(variablesJson)"
            :key="sectionName"
            :name="sectionName"
            :label="sectionName"
          />
        </q-tabs>

        <!-- Section Bodies -->
        <q-tab-panels v-model="state.customizeTab" animated>
          <q-tab-panel
            v-for="[sectionName, variables] in Object.entries(variablesJson)"
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
                      v-model="variablesJson[sectionName][variableName].value"
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
                              variablesJson[sectionName][variableName].value,
                          }"
                        >
                          <q-popup-proxy
                            cover
                            transition-show="scale"
                            transition-hide="scale"
                          >
                            <q-color
                              v-model="
                                variablesJson[sectionName][variableName].value
                              "
                            />
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </template>

                  <!-- Image Input -->
                  <template v-else-if="props.type === 'image'">
                    <q-img
                      :src="variablesJson[sectionName][variableName].value"
                      height="200px"
                      width="auto"
                      fit="contain"
                      position="0 0"
                      style="cursor: pointer"
                      @click="openFilePicker(sectionName, variableName)"
                    />

                    <q-item-label caption class="q-pt-md">{{
                      props.hint
                    }}</q-item-label>
                  </template>

                  <!-- Text Area Input -->
                  <template v-else-if="props.type === 'text'">
                    <q-input
                      v-model="variablesJson[sectionName][variableName].value"
                      type="textarea"
                      :hint="props.hint"
                      filled
                    />
                  </template>

                  <!-- Other (Show as generic input) -->
                  <template v-else>
                    <q-input
                      v-model="variablesJson[sectionName][variableName].value"
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
      @click="promptCreateCopy"
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
import { useQuasar, patterns } from 'quasar';
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

const state = reactive<{
  customizeTab: string;
}>({
  customizeTab: '',
});

const template = defineModel<TemplateV2>('template', {
  default: () => ({}),
});

// NOTE: To simplify in IndexedDB, the Variables JSON is saved as a string.
//       If we saved it as an object, it would end up with nested proxy objects (and Vue's toRaw is not recursive).
//       The impact of this is that we would not be able to save `variables` to IndexedDB.
//       So, we wrap in a computed here that casts to/from string to JSON.
const variablesJson = computed((): TemplateVariables => {
  try {
    return reactive(JSON.parse(template.value.variables));
  } catch {
    console.error('Cannot parse template.variables');
    return {};
  }
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
      variablesJson.value[sectionName][variableName].value = result;
    }
  };
  reader.readAsDataURL(newFile);
}

function promptCreateCopy() {
  $q.dialog({
    title: 'Create a Copy',
    message: 'Enter a name for your new customization:',
    prompt: {
      model: '',
      type: 'text',
      isValid: (val) => val.trim().length > 0,
    },
    cancel: true,
    persistent: true,
  }).onOk((name) => {
    console.log('test');
  });
}

//---------------------------------------------------------------------------
// Watchers
//---------------------------------------------------------------------------

watch(
  variablesJson,
  (newValue) => {
    try {
      template.value.variables = JSON.stringify(newValue, null, 2);
    } catch {}
  },
  { deep: true }
);

//---------------------------------------------------------------------------
// Initialization/Lifecycle Hooks
//---------------------------------------------------------------------------

state.customizeTab = Object.keys(variablesJson.value)[0] || '';
</script>

<style>
.field-label {
  max-width: 120px;
  min-width: 120px;
}
</style>
