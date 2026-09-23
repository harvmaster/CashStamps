<template>
  <q-page>
    <div class="inner-page">
      <component :is="faqComponent" />
    </div>
  </q-page>
</template>

<style lang="scss">
// NOTE: intentionally unscoped so the styles apply to the async
// per-locale FAQ content components below (src/pages/faq/FAQ_*.vue).
h1 {
  font-size: 2.5em;
  color: var(--q-primary);
}

h2 {
  font-size: 2em;
  color: var(--q-primary);
}
.faq-section {
  margin-bottom: 2.5em;
}
</style>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n({
  inheritLocale: true,
  useScope: 'local',
});

const language = computed(() => {
  // Get the main locale (e.g. "en" as opposed to "en-GB")
  return locale.value.substring(0, 2).toLowerCase();
});

// Per-locale FAQ content. Lazy-loaded so visitors only download their own
// language. To add a language: create src/pages/faq/FAQ_xx.vue and point
// the map entry at it.
const faqComponents: Record<string, unknown> = {
  en: defineAsyncComponent(() => import('./faq/FAQ_en.vue')),
  es: defineAsyncComponent(() => import('./faq/FAQ_es.vue')),
  de: defineAsyncComponent(() => import('./faq/FAQ_de.vue')),
  tl: defineAsyncComponent(() => import('./faq/FAQ_tl.vue')),
  zh: defineAsyncComponent(() => import('./faq/FAQ_zh.vue')),
  da: defineAsyncComponent(() => import('./faq/FAQ_da.vue')),
  nl: defineAsyncComponent(() => import('./faq/FAQ_nl.vue')),
};

const faqComponent = computed(() => {
  return faqComponents[language.value] || faqComponents['en'];
});
</script>
