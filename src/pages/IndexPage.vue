<template>
  <q-page class="flex">
    <div class="container strong">
      <div
        class="left column q-col-gutter-y-md cursor-pointer"
        @click="$router.push('/create')"
      >
        <div class="text-center">{{ t('title') }}</div>
        <div class="q-gutter-md">
          <img class="stamp-icon" src="/icon.svg" />
          <img class="stamp-icon" src="/icon.svg" />
          <img class="stamp-icon" src="/icon.svg" />
        </div>
      </div>
      <div
        class="right column q-col-gutter-y-md cursor-pointer"
        @click="$router.push('/redeem')"
      >
        <div class="text-center">{{ t('redeem') }}</div>
        <div>
          <img src="/redeem.png" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  flex: 1;
  color: #fff;
  font-size: clamp(15px, 10vw, 48px); /* Scalable font size */
  // font-size: 48px;
}

.left,
.right {
  display: flex;
  justify-content: center; /* Center items horizontally */
  align-items: center; /* Center items vertically */
  flex: 1;
}

.left {
  background-color: #000; /* Light grey background for the left side */
}

.right {
  background-color: #7dd955; /* Darker grey background for the right side */
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }

  .left {
    order: 2; /* Move left container to the bottom */
  }

  .right {
    order: 1; /* Move right container to the top */
  }
}

.stamp-icon {
  width: 64px;
  height: 64px;
}
</style>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import translations from './IndexPage.i18n.json';

const $router = useRouter();

const { t } = useI18n({
  useScope: 'local',
  messages: translations.messages,
});
</script>
