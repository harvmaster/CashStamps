<template>
  <!-- Color Input -->
  <q-input
    v-if="entry.type === 'color'"
    v-model="value"
    @update:model-value="emit('changed')"
    debounce="500"
    :rules="[(val) => testPattern.hexOrHexaColor(val) || 'Invalid color']"
    :hint="entry.hint"
    filled
  >
    <template v-slot:prepend>
      <q-icon name="square" class="cursor-pointer" :style="{ color: value }">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-color v-model="value" @change="emit('changed')" />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>

  <!-- Image Input -->
  <template v-else-if="entry.type === 'image'">
    <div style="cursor: pointer; display: inline-block" @click="pickImage">
      <img
        :src="value"
        style="height: 200px; width: auto; display: block"
        class="image-input"
      />
    </div>
    <q-item-label caption class="q-pt-md">{{ entry.hint }}</q-item-label>
  </template>

  <!-- String Input -->
  <q-input
    v-else-if="entry.type === 'string'"
    v-model="value"
    @update:model-value="emit('changed')"
    debounce="500"
    :hint="entry.hint"
    filled
  />

  <!-- Text Area Input -->
  <q-input
    v-else-if="entry.type === 'text'"
    v-model="value"
    @blur="emit('changed')"
    type="textarea"
    :hint="entry.hint"
    filled
  />
</template>

<script setup lang="ts">
import { patterns } from 'quasar';
import { type TemplateVariableEntry } from 'src/types.js';
import { pickFile } from 'src/utils/misc.js'; // adjust path as needed

const { testPattern } = patterns;

defineProps<{ entry: TemplateVariableEntry }>();
const emit = defineEmits<{ changed: [] }>();

const value = defineModel<string>('value', { required: true });

async function pickImage() {
  const result = await pickFile({ accept: 'image/*', binary: true });

  if (result !== null) {
    value.value = result;
    emit('changed');
  }
}
</script>

<style lang="scss">
// Checkerboard background to show transparency.
.image-input {
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, 10px 0;
}
</style>
