import type { App } from 'vue';
import { createI18n } from 'vue-i18n';

export default ({ app }: { app: App }) => {
  // Set i18n instance on app
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
  });

  app.use(i18n);
};
