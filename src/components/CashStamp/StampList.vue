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
import { onMounted, ref, watch } from 'vue';

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

const stampFunding = ref<FundingOptions>(props.funding);
const getStampFunding = async () => {
  if (!props.funding.funded) {
    stampFunding.value = props.funding;
    return
  }

  loadingFunding.value = true;

  const value = await convert(props.funding.currency, props.funding.value, props.funding.funded.getTime());
  stampFunding.value = { ...props.funding, value };

  loadingFunding.value = false;
}

watch(() => props.funding.currency, () => getStampFunding());
watch(() => props.funding.value, () => getStampFunding());

onMounted(() => {
  getStampFunding()
});
</script>