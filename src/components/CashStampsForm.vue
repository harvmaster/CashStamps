<template>
  <div class="row q-col-gutter-md">
    <div class="col-md col-12 row q-col-gutter-md">
      <!-- First Row -->
      <div class="col-12 row q-col-gutter-md">
        <!-- Value Input -->
        <div class="col-md col-12 row">
          <q-input
            class="col-12"
            v-model.number="model.amount"
            :label="`Amount (${currencyName})`"
            type="number"
            :disable="disabled"
            :min="0"
            filled
          />
        </div>

        <!-- list for FIAT/BCH -->
        <div class="col-md-auto col-8 row">
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

        <!-- Quantity Input -->
        <div class="col-auto row">
          <q-input
            class="col-12 col-md-auto"
            style="min-width: 10em"
            v-model.number="model.quantity"
            label="Stamp Quantity"
            type="number"
            :disable="disabled"
            filled
            :min="0"
            :max="100"
            v-on:blur="clampQuantity"
          />
        </div>

        <!-- New Row -->
        <div class="col-12 row items-center justify-start q-col-gutter-md">
          <!-- Total value of the TX -->
          <div class="col-auto row">
            <div class="col-12 col-md-auto text-body2">
              Total Value ({{ currencyName }})
            </div>
            <div class="col-12 text-h6">
              {{ totalAmount }}
              {{ currencyName }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="col-auto column q-col-gutter-y-md justify-evenly full-height">
      <!-- Create -->
      <div class="col-auto">
        <q-btn
          class="full-width"
          :disable="disabled"
          label="create Stamps"
          color="primary"
          @click="emits('create')"
        />
      </div>

      <!-- Fund -->
      <div class="col-auto">
        <q-btn
          class="full-width"
          :disable="disabled"
          label="Fund Stamps"
          color="secondary"
          @click="emits('fund')"
        >
          <!-- Error message -->
          <q-tooltip v-if="formError" style="font-size: 0.75rem">{{
            formError
          }}</q-tooltip>
        </q-btn>
      </div>

      <!-- Redeem -->
      <div class="col-auto">
        <q-btn
          class="full-width"
          label="Redeem Stamps"
          color="orange-6"
          @click="emits('redeem')"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { DB_StampCollection } from 'src/types.js'
import { OraclesService } from 'src/services/oracles.js';

// TODO: This interface is probably available in Quasar somewhere.
interface Option {
  label: string;
  value: string;
}

const model = defineModel<Required<DB_StampCollection>>({
  required: true,
});
const props = defineProps<{ oracles: OraclesService; disabled: boolean }>();

const emits = defineEmits(['create', 'fund', 'redeem']);

const formError = computed(() => {
  if (model.value.quantity <= 0) {
    return 'Stamps must be created before you can fund them';
  }

  if (props.disabled) {
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
