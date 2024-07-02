<template>
  <div class="row">
    <cash-stamp-item
      class="col-auto q-pa-sm"
      v-for="(stamp, index) in stamps || []"
      :key="stamp.toString()"
      :id="index"
      
      :stamp="stamp"
      :funding="stampFunding"
      :loadingFunding="loadingFunding"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';

import { app } from 'src/boot/app'

import { HDPrivateNode } from 'src/utils/hd-private-node';
import { FundingOptions } from 'src/services/stamp-collection';
import { useCurrencyConverter } from 'src/composables/useCurrencyConverter';

import CashStampItem from './CashStampItem.vue';

export type StampListProps = {
  stamps: HDPrivateNode[];
  funding: FundingOptions;
}

const props = defineProps<StampListProps>();

const { convert } = useCurrencyConverter();

const loadingFunding = ref(false);

const appFunding = computed(() => app.stampCollection.value?.getFundingOptions());

const stampFunding = ref<FundingOptions>(props.funding);
const getStampFunding = async () => {
  if (!props.funding.funded) {
    stampFunding.value = appFunding.value;
    return
  }

  loadingFunding.value = true;

  const value = await convert(props.funding.currency, appFunding.value.value, props.funding.funded.getTime());
  stampFunding.value = { ...props.funding, value };

  loadingFunding.value = false;
}

watch(() => props.funding.currency, () => getStampFunding());
watch(appFunding, () => getStampFunding());

onMounted(() => {
  getStampFunding()
});
</script>