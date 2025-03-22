<template>
  <div>
    <q-btn label="Import" color="secondary" @click="pickFile" />
    <q-file ref="fileInput" v-model="file" style="display: none" @update:model-value="onFileSelected" />
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue';

const file = ref(null);
const fileInput = ref(null);
const emit = defineEmits(['file-content']);

const pickFile = () => {
  fileInput.value.pickFiles(); // Open file picker
};

const onFileSelected = () => {
  if (file.value) {
    const reader = new FileReader();
    reader.onload = (e) => {
      emit('file-content', e.target.result); // Emit file contents
    };
    reader.readAsText(file.value);
  }
};
</script>
