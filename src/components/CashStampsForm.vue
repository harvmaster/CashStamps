<template>
  <div class="row q-col-gutter-md">
    <div class="col-md col-12">
      <q-input
        v-model.number="model.amount"
        :label="`Amount (${currencyName})`"
        type="number"
        :disable="funded"
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
        v-model.number="model.quantity"
        label="Stamp Quantity"
        type="number"
        :disable="funded"
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
import { computed, ref, watch } from 'vue';

import { StampCollection } from 'src/types.js';
import { OraclesService } from 'src/services/oracles.js';

// TODO: This interface is probably available in Quasar somewhere.
interface Option {
  label: string;
  value: string;
}

const model = defineModel<Required<StampCollection>>({
  required: true,
});
const props = defineProps<{ oracles: OraclesService; funded: boolean }>();

const emits = defineEmits(['create', 'fund', 'redeem']);

const formError = computed(() => {
  if (model.value.quantity <= 0) {
    return 'Stamps must be created before you can fund them';
  }

  if (props.funded) {
    return 'Stamps are already funded';
  }

  return '';
});

// ----------------------------------
// Quantity Clamping
// ----------------------------------

// Clamp the quantity to be between 0 and 100
const clampQuantity = () => {
  if (model.value.quantity < 0) model.value.quantity = 0;
  if (model.value.quantity > 100) model.value.quantity = 100;
};

// ----------------------------------
// Currency Name & Options
// ----------------------------------

// Get the currency name, Currencies are stored as the public key to that currency for the oracle
const currencyName = computed(() => {
  if (model.value.currency === 'BCH') return 'BCH';

  return (
    props.oracles.oracleMetadataStore[model.value.currency]
      .sourceNumeratorUnitCode || 'unknown'
  );
});

// Create list of currency options and then add BCH
const currencyOptions = computed((): Array<Option> => {
  // Initialise list with BCH as default
  const options: Array<Option> = [{ label: 'BCH', value: 'BCH' }];

  // Add all other oracle currencies
  Object.keys(props.oracles.oracleMetadataStore).forEach((oraclePublicKey) => {
    options.push({
      value: oraclePublicKey,
      label:
        props.oracles.oracleMetadataStore[oraclePublicKey]
          .sourceNumeratorUnitCode,
    });
  });

  return options;
});

const totalAmount = computed(() => {
  // TODO: Not all oracles have the same scaling factor!
  const decimalPlaces = currencyName.value === 'BCH' ? 8 : 2;
  return (model.value.quantity * model.value.amount).toFixed(decimalPlaces);
});
</script>
