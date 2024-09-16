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
import { useI18n } from 'vue-i18n';

const $q = useQuasar();

// Set up i18n
const { locale } = useI18n({
  useScope: 'global',
});
locale.value = $q.lang.getLocale() || 'en';

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
  $q.dialog({
    title: 'Error',
    message: `${error.message}: This may be a connectivity problem or a service this depends on might be currently unavailable.`,
    ok: 'Reload',
  }).onOk(() => {
    window.location.reload();
  });
});
</script>
