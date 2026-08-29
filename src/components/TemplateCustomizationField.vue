<template>
  <!-- Color Input -->
  <q-input
    v-if="entry.type === 'color'"
    v-model="value"
    @update:model-value="emit('changed')"
    debounce="500"
    :rules="rules"
    :hint="entry.hint"
    :clearable="entry.optional"
    @clear="emit('changed')"
    filled
  >
    <template v-slot:prepend>
      <q-icon name="square" class="cursor-pointer" :style="{ color: value }">
        <q-popup-proxy
          cover
          transition-show="scale"
          transition-hide="scale"
          @hide="flushColorChange"
        >
          <q-color
            v-model="value"
            @change="onColorChange"
            format-model="hexa"
          />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>

  <!-- Image Input -->
  <q-field
    v-else-if="entry.type === 'image'"
    v-model="value"
    :rules="rules"
    :hint="entry.hint"
    borderless
  >
    <template v-slot:control>
      <div style="cursor: pointer; display: inline-block" @click="pickImage">
        <img
          :src="value"
          style="
            max-height: 200px;
            min-height: 64px;
            width: auto;
            max-width: 100%;
            display: block;
          "
          class="image-input"
        />
      </div>
    </template>
    <template v-if="entry.optional && value" v-slot:append>
      <q-icon name="cancel" class="cursor-pointer" @click.stop="clearImage" />
    </template>
  </q-field>

  <!-- Number Input -->
  <q-input
    v-else-if="entry.type === 'number'"
    v-model="value"
    type="number"
    @update:model-value="emit('changed')"
    debounce="500"
    :rules="rules"
    :hint="entry.hint"
    :clearable="entry.optional"
    @clear="emit('changed')"
    filled
  />

  <!-- String Input -->
  <q-input
    v-else-if="entry.type === 'string'"
    v-model="value"
    @update:model-value="emit('changed')"
    debounce="500"
    :rules="rules"
    :hint="entry.hint"
    :clearable="entry.optional"
    @clear="emit('changed')"
    filled
  />

  <!-- Text Area Input -->
  <q-input
    v-else-if="entry.type === 'text'"
    v-model="value"
    @blur="emit('changed')"
    type="textarea"
    :rules="rules"
    :hint="entry.hint"
    :clearable="entry.optional"
    @clear="emit('changed')"
    filled
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';
import { patterns } from 'quasar';
import { type TemplateVariableEntry } from 'src/types.js';
import { pickFile } from 'src/utils/misc.js';

const { isHexColor, isNumber } = patterns;

const props = defineProps<{ entry: TemplateVariableEntry }>();
const emit = defineEmits<{ changed: [] }>();
const value = defineModel<string | number>('value', { required: true });

//---------------------------------------------------------------------------
// Validation Rules
//---------------------------------------------------------------------------
const isRequired = (val: unknown) =>
  (val !== null && val !== undefined && val !== '') || 'This field is required';

const isValidColor = (val: string) =>
  !val || isHexColor(val) || 'Invalid color';

const isValidNumber = (val: unknown) =>
  val === null ||
  val === undefined ||
  val === '' ||
  isNumber(String(val)) ||
  'Invalid number';

const rules = computed(() => {
  const ruleList = [];

  if (!props.entry.optional) {
    ruleList.push(isRequired);
  }

  if (props.entry.type === 'color') {
    ruleList.push(isValidColor);
  } else if (props.entry.type === 'number') {
    ruleList.push(isValidNumber);
  }

  return ruleList;
});

//---------------------------------------------------------------------------
// Image picker logic
//---------------------------------------------------------------------------
async function pickImage() {
  const result = await pickFile({ accept: 'image/*', binary: true });

  if (result !== null) {
    value.value = result;
    emit('changed');
  }
}

function clearImage() {
  value.value = '';
  emit('changed');
}

//---------------------------------------------------------------------------
// Color picker logic
//---------------------------------------------------------------------------
const COLOR_DEBOUNCE_MS = 500;
let colorChangeTimer: ReturnType<typeof setTimeout> | undefined;

function onColorChange() {
  if (colorChangeTimer) clearTimeout(colorChangeTimer);
  colorChangeTimer = setTimeout(() => {
    colorChangeTimer = undefined;
    emit('changed');
  }, COLOR_DEBOUNCE_MS);
}

function flushColorChange() {
  if (colorChangeTimer) {
    clearTimeout(colorChangeTimer);
    colorChangeTimer = undefined;
    emit('changed');
  }
}

onBeforeUnmount(() => {
  if (colorChangeTimer) clearTimeout(colorChangeTimer);
});
</script>
