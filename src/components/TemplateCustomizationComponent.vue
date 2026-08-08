<template>
  <div v-if="Object.keys(state.variables).length">
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
        <q-banner
          v-if="template.readonly"
          class="bg-secondary text-white"
          inline-actions
          dense
        >
          <template v-slot:avatar>
            <q-icon name="warning" color="white" />
          </template>
          This template is read-only.
          <template v-slot:action>
            <q-btn
              flat
              dense
              label="Clone Template"
              @click="props.onCopyTemplate()"
            />
          </template>
        </q-banner>

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
            <div style="position: relative">
              <q-list bordered>
                <template
                  v-for="[variableName, entryOrGroup] in Object.entries(
                    variables
                  )"
                  :key="variableName"
                >
                  <!-- Subsection: nested group, no 'type' of its own -->
                  <template v-if="!('type' in entryOrGroup)">
                    <!--
                    <div class="q-pa-sm text-center strong">
                      <q-chip color="primary" text-color="white">
                        {{ capitalize(variableName) }}
                      </q-chip>
                    </div>
                    -->

                    <q-expansion-item
                      :label="capitalize(variableName)"
                      icon="expand_circle_down"
                      expand-separator
                    >
                      <q-item
                        v-for="[nestedName, entry] in Object.entries(
                          entryOrGroup
                        )"
                        :key="nestedName"
                      >
                        <q-item-section class="field-label">
                          <q-item-label>{{ entry.label }}</q-item-label>
                        </q-item-section>

                        <q-item-section>
                          <TemplateCustomizationField
                            :entry="entry"
                            v-model:value="entry.value"
                            @changed="emitUpdate"
                          />
                        </q-item-section>
                      </q-item>
                    </q-expansion-item>
                  </template>

                  <!-- Leaf entry -->
                  <q-item v-else>
                    <q-item-section class="field-label">
                      <q-item-label>{{ entryOrGroup.label }}</q-item-label>
                    </q-item-section>

                    <q-item-section>
                      <TemplateCustomizationField
                        :entry="entryOrGroup"
                        v-model:value="entryOrGroup.value"
                        @changed="emitUpdate"
                      />
                    </q-item-section>
                  </q-item>
                </template>
              </q-list>

              <!-- Read-Only Overlay -->
              <div
                v-if="template.readonly"
                class="absolute-full flex flex-center strong cursor-not-allowed text-white"
                style="background: rgba(0, 0, 0, 0.1)"
              >
                <!--
                <q-badge v-if="template.readonly" color="secondary" floating class="q-pa-sm">
                  <q-icon name="lock" size="16px" />
                  Read-only
                </q-badge>
                -->
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-expansion-item>
    </q-list>

    <!--
    <div
      v-if="template.readonly"
      class="absolute-full flex flex-center strong"
      style="cursor: pointer; z-index: 1; background: rgba(0, 0, 0, 0.5); color: white;"
      @click="props.onCopyTemplate()"
    >
      This template is readonly. Click to clone template.
    </div>
    -->
  </div>
</template>

<script setup lang="ts">
// NOTE: Be careful when adding new fields.
//       To prevent accidentally looping watchers, we want to emitUpdate on explicit user-events instead.
//       This means, for each new type we add, you must explicitly call emitUpdate when value changes.

import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { format } from 'quasar';

// App / Service / Utils Imports
import { type TemplateV2, type TemplateVariables } from 'src/types.js';
import TemplateCustomizationField from './TemplateCustomizationField.vue';

// Translations
import translations from './CollectionPreviewComponent.i18n.json';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: translations.messages,
});

const { capitalize } = format;

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

const emits = defineEmits(['template:updated']);

const props = defineProps<{
  template: TemplateV2;
  onCopyTemplate: () => Promise<void>;
}>();

const state = reactive<{
  customizeTab: string;
  variables: TemplateVariables;
}>({
  customizeTab: '',
  variables: JSON.parse(props.template.variables),
});

function emitUpdate() {
  emits(
    'template:updated',
    {
      ...props.template,
      variables: JSON.stringify(state.variables, null, 2),
    },
    props.template
  );
}

//---------------------------------------------------------------------------
// Watchers
//---------------------------------------------------------------------------

watch(
  () => props.template.variables,
  (newVal) => {
    state.variables = JSON.parse(newVal);

    // Ensure we land on an active tab that still exists.
    if (!(state.customizeTab in state.variables)) {
      state.customizeTab = Object.keys(state.variables)[0] || '';
    }
  }
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
</style>
