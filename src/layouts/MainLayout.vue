<template>
  <q-layout view="lHh Lpr lFf" class="">
    <!-- <q-header class="print-hide bg-white">
      <q-toolbar>

        <q-toolbar-title class="text-black">
          CashStamps
        </q-toolbar-title>

      </q-toolbar>
    </q-header> -->

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
