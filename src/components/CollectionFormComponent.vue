<template>
  <div class="row q-col-gutter-md">
    <div class="col-md col-12">
      <q-input
        v-model.number="model.amount"
        :label="`Amount (${currencyName})`"
        type="number"
        :min="0"
        debounce="1000"
        filled
      />
    </div>

    <!-- Currency Selection -->
    <div class="col-md-auto col-8">
      <q-select
        style="min-width: 10em"
        v-model="model.currency"
        :options="currencyOptions"
        option-value="value"
        option-label="label"
        map-options
        emit-value
        label="Currency"
        filled
      />
    </div>

    <!-- Expiry Date -->
    <div class="col-md">
      <q-input
        filled
        v-model="model.expiry"
        mask="date"
        class="col"
        placeholder="YYYY/MM/DD"
        label="Expiry Date (YYYY/MM/DD)"
      >
        <template v-slot:append>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover :breakpoint="600">
              <q-date v-model="model.expiry" />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>

    <!-- Quantity Input -->
    <div class="col-auto">
      <q-input
        style="min-width: 10em"
        v-model.number="quantityClamped"
        label="Stamp Quantity"
        type="number"
        :disable="props.wallet?.isFunded.value || false"
        :step="1"
        :min="0"
        :max="100"
        debounce="1000"
        filled
      />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { computed } from 'vue';

import { StampCollection } from 'src/types.js';
import { OraclesService } from 'src/services/oracles.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

interface Option {
  label: string;
  value: string;
}

const model = defineModel<Required<StampCollection>>({
  required: true,
});

const props = defineProps<{ oracles: OraclesService; wallet?: WalletHD }>();

// Get the currency name, Currencies are stored as the public key to that currency for the oracle
const currencyName = computed(() => {
  return props.oracles.getOracleUnitCode(model.value.currency);
});

// Create list of currency options and then add BCH
const currencyOptions = computed((): Array<Option> => {
  // Initialise list with BCH as default
  const options: Array<Option> = [{ label: 'BCH', value: 'BCH' }];

  // Add all other oracle currencies
  Object.keys(props.oracles.oracleMetadataStore).forEach((oraclePublicKey) => {
    options.push({
      value: oraclePublicKey,
      label: props.oracles.getOracleUnitCode(oraclePublicKey, 'numerator'),
    });
  });

  return options;
});

const amount = computed({
  get: () => {
    return 0;
  },
  set: (amount) => {
    model.value.amount = amount;
  }
});

// NOTE: We want to clamp the number between 0 through 100, so use a computed getter/setter.
const quantityClamped = computed({
  get: () => {
    if(props.wallet?.isFunded.value || false) {
      return props.wallet.wallets.value.length;
    }

    return model.value.quantity
  },
  set: (quantity: number) =>
    (model.value.quantity = Math.min(Math.max(quantity, 0), 100)),
});
</script>
