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

        <!-- Undo / Redo Toolbar -->
        <q-banner
          v-if="!template.readonly"
          class="bg-secondary text-white"
          inline-actions
          dense
        >
          <div
            v-if="!template.readonly"
            class="row items-center q-px-sm undo-toolbar"
          >
            <q-btn
              flat
              dense
              round
              icon="undo"
              :disable="history.undo.length === 0"
              @click="undo"
            >
              <q-tooltip>Undo</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              icon="redo"
              :disable="history.redo.length === 0"
              @click="redo"
            >
              <q-tooltip>Redo</q-tooltip>
            </q-btn>
          </div>
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
                            @changed="
                              emitUpdate([
                                sectionName,
                                variableName,
                                nestedName,
                              ])
                            "
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
                        @changed="emitUpdate([sectionName, variableName])"
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
//
// UNDO/REDO NOTE:
//   emitUpdate() now takes a `path` (array of keys into state.variables identifying which
//   entry changed, e.g. ['colors', 'primary'] or ['colors', 'accent', 'hover']). This lets us
//   record *structural* undo entries (just the field's path + before/after value) instead of
//   snapshotting the entire variables tree on every keystroke - which matters because some
//   fields (images) can hold large base64 strings we don't want duplicated per-edit.
//   When adding a new field TYPE, nothing changes here. When adding a new *nesting level* to
//   TemplateVariables (currently max 2 levels deep: section -> variable -> entry, or
//   section -> group -> entry), make sure the path passed to emitUpdate() matches the real
//   depth, and that walkEntries() below still terminates correctly (it already recurses
//   generically on anything without a 'type' key, so extra nesting levels are handled for free).

import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { format } from 'quasar';

// App / Service / Utils Imports
import {
  type TemplateV2,
  type TemplateVariables,
  type TemplateVariableEntry,
} from 'src/types.js';
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

//---------------------------------------------------------------------------
// Undo / Redo
//---------------------------------------------------------------------------

interface FieldChange {
  path: string[];
  prevValue: string;
  newValue: string;
}

// Cap history depth so a long editing session can't grow this unboundedly.
// Each entry is small (a path + two strings), but this is still cheap insurance.
const MAX_HISTORY = 50;

const history = reactive<{ undo: FieldChange[]; redo: FieldChange[] }>({
  undo: [],
  redo: [],
});

// Last-committed value per field, keyed by path.join('.'). Used so emitUpdate()
// can determine "prevValue" even though the field's v-model has already mutated
// state.variables in place by the time the 'changed' event reaches us.
const lastValues = new Map<string, string>();

// Walks the variables tree, calling `visit(path, entry)` for every leaf entry
// (an object with a 'type' key). Recurses through any nesting depth of groups.
function walkEntries(
  node: Record<string, unknown>,
  path: string[],
  visit: (path: string[], entry: TemplateVariableEntry) => void
) {
  for (const key of Object.keys(node)) {
    const child = node[key] as Record<string, unknown> | undefined;
    if (!child || typeof child !== 'object') continue;

    const childPath = [...path, key];

    if ('type' in child) {
      visit(childPath, child as unknown as TemplateVariableEntry);
    } else {
      walkEntries(child, childPath, visit);
    }
  }
}

function snapshotAllValues() {
  lastValues.clear();
  walkEntries(state.variables, [], (path, entry) => {
    lastValues.set(path.join('.'), entry.value);
  });
}

function getEntryAtPath(path: string[]): TemplateVariableEntry | undefined {
  let node: any = state.variables;
  for (const key of path) {
    if (node == null) return undefined;
    node = node[key];
  }
  return node as TemplateVariableEntry | undefined;
}

function applyEntryValue(path: string[], value: string) {
  const entry = getEntryAtPath(path);
  if (entry) entry.value = value;
  lastValues.set(path.join('.'), value);
}

function undo() {
  const change = history.undo.pop();
  if (!change) return;

  applyEntryValue(change.path, change.prevValue);
  history.redo.push(change);
  emitTemplateUpdate();
}

function redo() {
  const change = history.redo.pop();
  if (!change) return;

  applyEntryValue(change.path, change.newValue);
  history.undo.push(change);
  emitTemplateUpdate();
}

//---------------------------------------------------------------------------
// Emitting updates
//---------------------------------------------------------------------------

// The exact string we last sent up via 'template:updated'. Used to tell apart
// "props.template.variables changed because our own edit round-tripped back
// through the parent" (expected, should NOT reset undo history) from "the
// template genuinely changed under us" (external edit, or a totally different
// template swapped in via Clone - SHOULD reset undo history).
let lastEmittedSerialized = JSON.stringify(state.variables, null, 2);

function emitTemplateUpdate() {
  const serialized = JSON.stringify(state.variables, null, 2);
  lastEmittedSerialized = serialized;

  emits(
    'template:updated',
    {
      ...props.template,
      variables: serialized,
    },
    props.template
  );
}

function emitUpdate(path: string[]) {
  const entry = getEntryAtPath(path);
  if (!entry) return;

  const key = path.join('.');
  const newValue = entry.value;
  const prevValue = lastValues.has(key)
    ? (lastValues.get(key) as string)
    : newValue;

  if (prevValue !== newValue) {
    history.undo.push({ path, prevValue, newValue });
    if (history.undo.length > MAX_HISTORY) history.undo.shift();
    history.redo.length = 0; // a fresh edit invalidates the redo branch
    lastValues.set(key, newValue);
  }

  emitTemplateUpdate();
}

//---------------------------------------------------------------------------
// Watchers
//---------------------------------------------------------------------------

watch(
  () => props.template.variables,
  (newVal) => {
    if (newVal === lastEmittedSerialized) {
      // This change is just our own edit echoing back through the parent's
      // prop. state.variables already reflects it - nothing to re-parse, and
      // resetting undo/redo here would wipe history after every single edit.
      return;
    }

    // A genuine external change: someone else's edit came in, or a different
    // template was swapped in (e.g. via Clone Template). Our undo/redo stacks
    // no longer describe valid transitions for this new state, so reset them.
    state.variables = JSON.parse(newVal);
    lastEmittedSerialized = newVal;
    history.undo.length = 0;
    history.redo.length = 0;
    snapshotAllValues();

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
snapshotAllValues();
</script>

<style lang="scss">
.field-label {
  max-width: 120px;
  min-width: 120px;
}

.undo-toolbar {
  gap: 4px;
}
</style>
