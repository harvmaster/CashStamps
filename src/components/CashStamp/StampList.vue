<template>
  <div class="row">
    <cash-stamp-item
      class="col-auto q-pa-sm"
      v-for="(stamp, index) in stamps || []"
      :key="stamp.toString()"
      :app="app"
      :id="index"
      :stamp="stamp"
      :funding="stampFunding"
      :loadingFunding="loadingFunding"
      :claimed="usedStamps.includes(stamp.toString())"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';

import { HDPrivateNode } from 'src/utils/hd-private-node';
import { FundingOptions } from 'src/services/stamp-collection';

import CashStampItem from './CashStampItem.vue';
import { App } from 'src/services/app';

export type StampListProps = {
  app: App;
  stamps: HDPrivateNode[];
  usedStamps: string[];
  funding: FundingOptions;
};

const props = defineProps<StampListProps>();
const app = props.app;

const loadingFunding = ref(false);

const appFunding = computed(() => app.stampCollection.value?.funding);

const stampFunding = ref<FundingOptions>(props.funding);
const getStampFunding = async () => {
  if (!props.funding.funded) {
    stampFunding.value = appFunding.value || { ...props.funding };
    return;
  }

  // This case should never happen, but TS gets mad if we don't check
  if (!appFunding.value) {
    return;
  }

  loadingFunding.value = true;

  const value = await app.oracles.convertCurrency(
    props.funding.currency,
    appFunding.value.value,
    props.funding.funded.getTime()
  );
  stampFunding.value = { ...props.funding, value };

  loadingFunding.value = false;
};

watch(
  () => props.funding.currency,
  () => getStampFunding()
);
watch(
  () => props.funding.funded,
  () => getStampFunding()
);
watch(appFunding, () => getStampFunding());

onMounted(() => {
  getStampFunding();
});
</script>
