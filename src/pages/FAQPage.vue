<template>
  <q-page>
    <div class="inner-page">
      <h1 class="text-center strong">{{ t('faqTitle') }}</h1>
      <div>
        <section class="faq-section">
          <h2>{{ t('whatAreCashstampsTitle') }}</h2>
          <p>{{ t('whatAreCashstampsContent') }}</p>
        </section>
        <section class="faq-section">
          <h2>{{ t('whatAreSTAMPTokensTitle') }}</h2>
          <div v-html="t('whatAreSTAMPTokensContent')"></div>
        </section>
        <section class="faq-section">
          <h2>{{ t('whyCashStampsTitle') }}</h2>
          <p>{{ t('whyCashStampsContent') }}</p>
        </section>
        <section class="faq-section">
          <h2>{{ t('cashstampUsesTitle') }}</h2>
          <p>{{ t('cashstampUsesContent') }}</p>
        </section>
        <section class="faq-section">
          <h2>{{ t('risksAssociatedWithCashStampsTitle') }}</h2>
          <p class="no-margin">
            {{ t('risksAssociatedWithCashStampsContent') }}
          </p>
          <div class="flex row justify-center q-py-md">
            <img src="/img/faq-mnemonic-button.png" style="max-width: 100%" />
          </div>
          <p>
            {{ t('risksAssociatedWithCashStampsAdditionalContent') }}
          </p>
        </section>
        <section class="faq-section">
          <h2>{{ t('walletsForCashStampsTitle') }}</h2>
          <p>{{ t('walletsForCashStampsContent') }}</p>
          <p>{{ t('walletsForCashStampsAdditionalContent') }}</p>
          <p>{{ t('walletsForCashStampsMoreContent') }}</p>
        </section>
        <section class="faq-section">
          <h2>{{ t('editingCashStampsTitle') }}</h2>
          <p class="no-margin">{{ t('editingCashStampsContent') }}</p>
          <div class="flex row justify-center">
            <img
              src="/img/faq-template-editing.png"
              style="max-width: 100%; width: 30em"
            />
          </div>
        </section>
        <section class="faq-section">
          <h2>{{ t('enterExpirationDateTitle') }}</h2>
          <p>{{ t('enterExpirationDateContent') }}</p>
        </section>
        <section class="faq-section">
          <h2>{{ t('whatLabelsTitle') }}</h2>
          <p v-html="t('whatLabelsContent')" />
        </section>
      </div>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
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
import { useI18n } from 'vue-i18n';
import translations from './FAQPage.i18n.json';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: translations.messages,
});
</script>
