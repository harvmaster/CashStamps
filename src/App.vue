<template>
  <!-- Wrap our main app in a suspense so that we can use "await" in the Vue Setup function. -->
  <Suspense>
    <!-- Load our router-view -->
    <router-view />
  </Suspense>
</template>

<script setup lang="ts">
import { onErrorCaptured } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

//-----------------------------------------------------------------------------
// Methods
//-----------------------------------------------------------------------------

// If any of our components within the <suspense> fail to during setup, the below will be called.
onErrorCaptured((error) => {
  // Log the error to the console.
  console.error(error);

  // Hide the loading indicator.
  $q.loading.hide();

  // Show a dialog to the user describing the error.
  $q.dialog({ title: 'Error', message: error.message });
});
</script>
