<template>
  <q-dialog v-model="visible">
    <q-card class="row">
      <q-card-section class="text-h6 text-center">
        {{ mnemonic }}
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

type MnemonicDialogProps = {
  mnemonic?: string;
};
const props = defineProps<MnemonicDialogProps>();

const visible = ref(false);
const toggleVisible = () => {
  visible.value = !visible.value;
};

defineExpose({
  toggleVisible,
});
</script>
