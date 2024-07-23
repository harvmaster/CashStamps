<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-dark">
      <q-toolbar class="row">
        <q-toolbar-title class="col-grow">
          <span @click="$router.push('/')" class="cursor-pointer">
            <q-avatar>
              <img src="/bch.svg" />
            </q-avatar>
            Stamps.<span class="text-primary">Cash</span>
          </span>
        </q-toolbar-title>

        <!-- Right Buttons -->
        <div class="col-shrink text-right q-gutter-x-xs">
          <q-btn
            round
            flat
            icon="img:telegram.svg"
            type="a"
            href="https://t.me/stampscash"
            target="_blank"
          />
          <q-btn
            round
            flat
            icon="img:x.svg"
            type="a"
            href="https://x.com/cashstamps"
            target="_blank"
          />
          <q-btn
            round
            flat
            icon="img:github.svg"
            type="a"
            href="https://github.com/harvmaster/CashStamps"
            target="_blank"
          />
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

.q-toolbar .q-avatar img {
  padding: 3px 0px 3px 0px;
}

.q-toolbar a img {
  width: 32px;
  height: 32px;
}
</style>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const $router = useRouter();
const $q = useQuasar();
</script>
