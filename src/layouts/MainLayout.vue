<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-dark">
      <q-toolbar class="row">
        <q-toolbar-title class="col-shrink">
          <span @click="$router.push('/')" class="cursor-pointer">
            <q-avatar square>
              <img src="/icon.svg" />
            </q-avatar>
            Stamps.<span class="text-primary">Cash</span>
          </span>
        </q-toolbar-title>

        <!-- Right Buttons -->
        <div class="col-grow text-right q-gutter-x-xs">
          <!-- Telegram -->
          <q-btn
            round
            flat
            icon="img:telegram.svg"
            type="a"
            href="https://t.me/stampscash"
            target="_blank"
          >
            <q-tooltip>Telegram</q-tooltip>
          </q-btn>
          <!-- X -->
          <q-btn
            round
            flat
            icon="img:x.svg"
            type="a"
            href="https://x.com/cashstamps"
            target="_blank"
          >
            <q-tooltip>X</q-tooltip>
          </q-btn>
          <!-- Git -->
          <q-btn
            round
            flat
            icon="img:github.svg"
            type="a"
            href="https://github.com/harvmaster/CashStamps"
            target="_blank"
          >
            <q-tooltip>Source Code</q-tooltip>
          </q-btn>
          <!-- FAQ -->
          <q-btn
            round
            flat
            icon="img:help.svg"
            to="/faq"
          >
            <q-tooltip>FAQ</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition appear enter-active-class="animated fadeIn">
          <Suspense @pending="$q.loading.show()" @resolve="$q.loading.hide()">
            <component :is="Component" />
          </Suspense>
        </transition>
      </router-view>

      <!-- Locale Selector -->
      <q-page-sticky position="bottom-right" :offset="[18, 18]">

        <q-fab color="primary" icon="language" direction="up"> 
          <q-fab-action color="primary" @click="() => setLocale('en')">
            <h6 class="q-ma-none">🇬🇧</h6>
          </q-fab-action>
          <q-fab-action color="primary" @click="() => setLocale('es')">
            <h6 class="q-ma-none">🇪🇸</h6>
          </q-fab-action>
        </q-fab>
      </q-page-sticky>
    </q-page-container>
  </q-layout>
</template>

<style lang="scss">
.q-header {
  color: #fff;
  font-family: 'Anton', sans-serif;
  font-weight: 400;
  font-style: normal;
}

.q-toolbar .q-toolbar__title {
  font-size: 26px;
}

.q-toolbar a img {
  width: 32px;
  height: 32px;
}
</style>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const setLocale = (newLocale: string) => {
  locale.value = newLocale;
};

const $router = useRouter();
const $q = useQuasar();
</script>
