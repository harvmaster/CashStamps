<template>
  <div class="row q-col-gutter-md">
    <div v-for="(field, i) of metadataFields" :key="i" class="col-4">
      <q-input
        v-model="state.metadata[field.name]"
        :label="field.humanized"
        @blur="emits('update:modelValue', state.metadata)"
        filled
      />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { computed, reactive } from 'vue';

import type { StampMetadata } from 'src/types.js';
import { extractMetadataPlaceholders } from 'src/utils/misc.js';

const emits = defineEmits(['update:modelValue']);

const props = defineProps<{ modelValue: StampMetadata, template: string }>();

const state = reactive<{
  metadata: StampMetadata;
}>({
  metadata: props.modelValue
});

const metadataFields = computed(() => {
  const placeholders = extractMetadataPlaceholders(props.template, []);

  return placeholders.map((placeholder) => ({
    name: placeholder,
    humanized: placeholder,
  }));
});
</script>
