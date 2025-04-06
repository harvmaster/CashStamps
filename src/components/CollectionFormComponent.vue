<template>
  <div class="row q-col-gutter-md">
    <!-- Quantity Input -->
    <div class="col-md-2 col-12">
      <q-input
        v-model.number="quantityModel"
        :label="t('stampQuantity')"
        type="number"
        :disable="props.wallet?.isFunded.value || false"
        :step="1"
        :min="0"
        :max="100"
        filled
      />
    </div>

    <!-- Amount Input -->
    <div class="col-md-4 col-12">
      <q-input
        v-model.number="model.amount"
        :label="`${t('targetAmount')} (${currencyName})`"
        type="number"
        :min="0"
        filled
      />
    </div>

    <!-- Currency Selection -->
    <div class="col-md-2 col-12">
      <q-select
        v-model="model.currency"
        :options="currencyOptions"
        option-value="value"
        option-label="label"
        map-options
        emit-value
        :label="t('currency')"
        filled
      />
    </div>

    <!-- Expiry Date -->
    <div class="col-md-4 col-12">
      <q-input
        filled
        v-model="expiryModel"
        mask="date"
        class="col"
        placeholder="YYYY/MM/DD"
        :label="t('expiryDate')"
      >
        <template v-slot:append>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover :breakpoint="600">
              <q-date v-model="expiryModel" />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { StampCollection } from 'src/types.js';
import { OraclesService } from 'src/services/oracles.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

import translations from './CollectionFormComponent.i18n.json';

interface Option {
  label: string;
  value: string;
}

const model = defineModel<Required<StampCollection>>({
  required: true,
});

const props = defineProps<{ oracles: OraclesService; wallet: WalletHD }>();

// Set up i18n
const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: translations.messages,
});

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

// Format as ISO-like date.
const expiryModel = computed({
  get: () => {
    return model.value.expiry.replaceAll('-', '/');
  },
  set: (value: string) => {
    model.value.expiry = value.replaceAll('/', '-');
  },
});

// NOTE: We want to clamp the number between 0 through 100, so use a computed getter/setter.
const quantityModel = computed({
  get: () => {
    if (props.wallet.isFunded.value) {
      return props.wallet.wallets.value.length;
    }

    return model.value.quantity;
  },
  set: (quantity: number) =>
    (model.value.quantity = Math.min(Math.max(quantity, 1), 100)),
});
</script>
