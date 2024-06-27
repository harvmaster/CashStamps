<template>
  <div class="cash-stamps_form row q-col-gutter-md">
    <div class="col-md col-12 row q-col-gutter-md">
      <!-- Name Input -->
      <div class="col-md-12 col-12 row">
        <q-input
          class="col"
          style="max-width: 30em"
          v-model.number="inputForm.name"
          :label="`Stamp Collection Name`"
          :disable="disabled"
          filled
          />
          <!-- @update:model-value="(val) => changeOptions({ name: val as string })" -->
      </div>

      <!-- Value Input -->
      <div class="col-md col-12 row">
        <q-input
          class="col-12"
          v-model.number="inputForm.value"
          :label="`Stamp Value (${ currencyName })`"
          type="number"
          :disable="disabled"
          :min="0"
          filled
          />
          <!-- @update:model-value="(val) => changeOptions({ value: val as number })" -->
      </div>

      <!-- list for FIAT/BCH -->
      <div class="col-md-auto col-8 row">
        <q-select
          style="min-width: 10em"
          v-model="inputForm.currency"
          :disable="disabled"
          :options="currencyOptions"
          option-value="value"
          option-label="label"
          map-options
          emit-value
          label="Currency"
          filled
          />
          <!-- @update:model-value="(val) => changeOptions({ currency: val })" -->
      </div>

      <!-- Quantity Input -->
      <div class="col-auto row">
        <q-input
          class="col-12 col-md-auto"
          v-model.number="inputForm.quantity"
          label="Stamp Quantity"
          type="number"
          :disable="disabled"
          filled
          :min="0"
          />
          <!-- @update:model-value="(val) => changeOptions({ quantity: val as number })" -->
      </div>

      <!-- New Row -->
      <div class="col-12 row items-center justify-start q-col-gutter-md">
        <!-- Total value of the TX -->
        <div class="col-auto row">
          <div class="col-12 col-md-auto text-body2">
            Total Value ({{ currencyName }})
          </div>
          <div class="col-12 text-h6">
            {{ inputForm.quantity * inputForm.value }}
            {{ currencyName }}
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
          @click="submit"
        />
      </div>

      <!-- Fund -->
      <div class="col-auto">
        <q-btn
          class="full-width"
          :disable="!wallets.length || disabled"
          label="Fund Stamps"
          color="green-6"
          @click="showFundingQR"
        />
      </div>

      <!-- Redeem -->
      <div class="col-auto">
        <q-btn
          class="full-width"
          disable
          label="Redeem Stamps"
          color="orange-6"
          @click="redeemStamps"
        />
      </div>
    </div>

    <!-- Modal for showing Funding TX Qr Code -->
    <funding-qr-code ref="fundingQrCode" />
  </div>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Wallet } from 'src/types';

import { app } from 'src/boot/app.js';
import {
  FundingOptions,
  StampCollection,
} from 'src/services/stamp-collection.js';

import FundingQrCode from '../QRCodes/FundingQRCode.vue';

export type CashStampFormProps = {
  wallets: Wallet[];
};

export type StampCollectionProps = {
  quantity: number;
  name: string;
  value: number;
  currency: string;
};

// TODO: This interface is probably available in Quasar somewhere.
interface Option {
  label: string;
  value: string;
}

const props = defineProps<CashStampFormProps>();

const emits = defineEmits<{
  (e: 'transaction', content: string): void;
  (e: 'wallets', content: Wallet[]): void;
}>();

// Intermediary form for creating StampCollection
const inputForm = ref({
  name: '',
  quantity: 1,
  value: 0,
  currency: 'BCH',
});

// Get the currency name, Currencies are stored as the public key to that currency for the oracle
const currencyName = computed(() => {
  if (inputForm.value.currency === 'BCH') return 'BCH';

  return app.oracles.oracleMetadataStore[inputForm.value.currency]
    .sourceNumeratorUnitCode || 'unknown';
});

// Create list of currency options and then add BCH
const currencyOptions = computed((): Array<Option> => {
  // Initialise list with BCH as default
  const options: Array<Option> = [ { label: 'BCH', value: 'BCH' } ];

  // Add all other oracle currencies
  Object.keys(app.oracles.oracleMetadataStore).forEach((oraclePublicKey) => {
    options.push({
      value: oraclePublicKey,
      label:
        app.oracles.oracleMetadataStore[oraclePublicKey]
          .sourceNumeratorUnitCode,
    });
  });

  return options;
});

// const options = computed(() => app.stampCollection.value?.getFundingOptions())
watch(app.stampCollection, () => {
  inputForm.value = mergeOptions({});
});

// Disable buttons if funded
const disabled = computed(
  () => app.stampCollection.value?.getFundingOptions().funded
);

// Merge the options with the current StampCollection
const mergeOptions = (
  options: Partial<StampCollectionProps>
): StampCollectionProps => {
  const currentStamps = app.stampCollection.value;

  // Merge options with current StampCollection
  const newOptions = {
    name: options.name || currentStamps?.getName() || '',
    quantity: options.quantity || currentStamps?.getStamps().length || 0,
    value: options.value || currentStamps?.getFundingOptions().amount || 0,
    currency:
      options.currency || currentStamps?.getFundingOptions().currency || 'BCH',
  };

  // Ensure 0 is merged correctly
  if (options.quantity === 0) newOptions.quantity = 0;
  if (options.value === 0) newOptions.value = 0;

  return newOptions;
};

// Model for showing funding transaction QR code
const fundingQrCode = ref<typeof FundingQrCode | null>(null);
const showFundingQR = async () => {
  if (!app.stampCollection?.value) return;
  fundingQrCode.value?.toggleVisible();
};

// Create and Emit wallets
const submit = async () => {
  const wallets = await createWallets(mergeOptions(inputForm.value));
};

// TODO: Implement redeeming stamps
const redeemStamps = () => {
  // redeem the unclaimed stamps
};

// Create StampCollection filled with Stamps
const createWallets = async (options: StampCollectionProps): Promise<void> => {
  // Create options for funding
  const fundingOptions: FundingOptions = {
    amount: options.value,
    currency: options.currency,
    funded: false,
  };

  // Get mnemonic if not funded (if its not funded, its likely in creation process)
  let mnemonic;
  if (!app.stampCollection.value?.getFundingOptions().funded) {
    mnemonic = app.stampCollection.value?.getMnemonic();
  }

  // Generate wallets
  app.stampCollection.value = StampCollection.generate({
    count: options.quantity,
    mnemonic,
    funding: fundingOptions,
    name: options.name,
  });
};
</script>
