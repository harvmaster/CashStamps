<template>
  <!-- Theme Customizer -->
  <q-expansion-item
    v-if="props.template.variables"
    :label="t('Customize Template')"
    icon="settings"
    header-class="bg-accent text-white"
    expand-icon-class="text-white"
    dense
  >
    <!-- Section Tab Headers -->
    <q-tabs
      v-model="state.customizeTab"
      align="justify"
      active-color="primary"
    >
      <q-tab v-for="(section) in Object.keys(props.template.variables)" :key="section" :name="section" :label="section" />
    </q-tabs>

    <!-- Section Bodies -->
    <q-tab-panels v-model="state.customizeTab" animated>
      <q-tab-panel v-for="[section, variables] in Object.entries(props.template.variables)" :key="section" :name="section">
        <div class="q-pa-md q-gutter-y-md">
          <div v-for="[variableName, props] in Object.entries(variables)" :key="variableName">
            <!-- If it's a Color Input -->
            <q-input v-if="props.type === 'color'" :label="props.label" :hint="props.hint" v-model="themeData[variableName]" :rules="[(val) => testPattern.hexOrHexaColor(val) || 'Invalid color']" filled>
              <template v-slot:prepend>
                <q-icon name="square" class="cursor-pointer" :style="{ color: themeData[variableName] }">
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-color v-model="themeData[variableName]" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <!-- If it's an Image Input -->
            <div v-else-if="props.type === 'image'">
              <q-input :label="props.label" :hint="props.hint" v-model="themeData[variableName]" filled />

              <div class="q-pa-md">
                <q-img
                  :src="themeData[variableName]"
                  height="200px"
                  fit="contain"
                  position="0 0"
                  style="cursor: pointer;"
                  @click="openFilePicker(variableName)"
                />
              </div>
            </div>

            <!-- If it's a Text Input -->
            <q-input v-else-if="props.type === 'text'" filled :label="props.label" :hint="props.hint" v-model="themeData[variableName]" type="textarea" />

            <!-- Default to text input if not explicitly supported -->
            <div v-else>
              <q-input filled v-model="themeData[variableName]" :label="props.label" :hint="props.hint" />
            </div>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-expansion-item>

  <!-- Global File Picker -->
  <!-- NOTE: This is a workaround to constraints of HTML's File Picker -->
  <input
    ref="fileInputRef"
    type="file"
    accept="image/*"
    style="display: none"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, computed, watch } from 'vue';
import { useQuasar, debounce, exportFile, patterns } from 'quasar';
import { useI18n } from 'vue-i18n';

// App / Service / Utils Imports
import { TemplateData } from 'src/types.js';
import { App } from 'src/services/app.js';
import type { StampCollection, Template } from 'src/types.js';
import { compileTemplate, formatStampValue, generateBatchID } from 'src/utils/misc.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

// Components.
import TemplateEditorDialog from 'src/components/TemplateEditorDialog.vue';

// Pre-built Templates
import { PageTemplate, builtInTemplates } from 'src/templates/index.js';

// Translations
import translations from './CollectionPreviewComponent.i18n.json';

const $q = useQuasar();
const { testPattern } = patterns;

const fileInputRef = ref(null)

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const emits = defineEmits(['templateSelected', 'templateDataUpdated']);

const props = defineProps<{
  template: Template;
}>();

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

const themeData = defineModel<Record<string, string>>('themeData', {
  default: () => ({})
});

function openFilePicker(variableName) {
  fileInputRef.value.onchange = (event) => {
    const file = event.target.files[0]
    if (file) onFileChange(file, variableName)
    fileInputRef.value.value = '' // reset so the same file can be picked again + prevents stale firing
  }
  fileInputRef.value.click()
}

function onFileChange(newFile, variableName) {
  if (!newFile) return

  const reader = new FileReader()
  reader.onload = (e) => {
    themeData.value[variableName] = e.target.result;
  }
  reader.readAsDataURL(newFile)
}

//---------------------------------------------------------------------------
// Template Editing
//---------------------------------------------------------------------------

//---------------------------------------------------------------------------
// Stamps and Preview
//---------------------------------------------------------------------------

//---------------------------------------------------------------------------
// Initialization/Lifecycle Hooks
//---------------------------------------------------------------------------

</script>
