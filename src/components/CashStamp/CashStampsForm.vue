<template>
  <div class="cash-stamps_form row q-col-gutter-md">
    <div class="col-md col-12 row q-col-gutter-md">
      <!-- Name Input -->
      <div class="col-md-12 col-12 row">
        <q-input
          class="col"
          style="max-width: 30em"
          v-model.number="form.name"
          :label="`Stamp Collection Name`"
          :disable="disabled"
          filled
        />
      </div>

      <!-- Value Input -->
      <div class="col-md col-12 row">
        <q-input
          class="col-12"
          v-model.number="form.funding.value"
          :label="`Stamp Value (${ currencyName })`"
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
          v-model="form.funding.currency"
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
          v-model.number="form.quantity"
          label="Stamp Quantity"
          type="number"
          :disable="disabled"
          filled
          :min="0"
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
            {{
              currencyName === 'BCH'
                ? (form.quantity * form.funding.value).toFixed(8)
                : (form.quantity * form.funding.value).toFixed(2)
            }}
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
          :disable="!stampCollectionStamps?.length || !stampCollectionName || disabled"
          label="Fund Stamps"
          color="green-6"
          @click="showFundingQR"
        >
          <q-tooltip v-if="!stampCollectionStamps?.length" style="font-size: 0.75rem">Stamps must be created before you can fund them</q-tooltip>
          <q-tooltip v-else-if="stampCollectionFunding?.funded" style="font-size: 0.75rem">Stamps are already funded</q-tooltip>
          <q-tooltip v-else-if="!stampCollectionName" style="font-size: 0.75rem">Stamp collections must have a name in order to fund them</q-tooltip>
        </q-btn>
      </div>

      <!-- Redeem -->
      <div class="col-auto">
        <q-btn
          class="full-width"
          label="Redeem Stamps"
          color="orange-6"
          @click="showRedeemDialog"
        />
      </div>
    </div>

    <!-- Modal for showing Funding TX Qr Code -->
    <funding-qr-code ref="fundingQrCode" />
    
    <!-- Model to display instructions for Redeeming unclaimed wallets -->
    <redeem-dialog ref="redeemDialog" />
  </div>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { computed, ref, defineModel } from 'vue';

import { app } from 'src/boot/app.js';
import { GenerateOptions } from 'src/services/stamp-collection.js';

import FundingQrCode from '../QRCodes/FundingQRCode.vue';
import RedeemDialog from './RedeemDialog.vue';

// TODO: This interface is probably available in Quasar somewhere.
interface Option {
  label: string;
  value: string;
}

const model = defineModel<Required<GenerateOptions>>('form', { required: true })
const emits = defineEmits(['create'])

// Get the current StampCollection. Have to get them individually because the variables are private on the stamp collection object
const stampCollection = computed(() => app.stampCollection.value);
const stampCollectionStamps = computed(() => stampCollection.value?.getStamps());
const stampCollectionName = computed(() => stampCollection.value?.getName());
const stampCollectionFunding = computed(() => stampCollection.value?.getFundingOptions());

// Get the currency name, Currencies are stored as the public key to that currency for the oracle
const currencyName = computed(() => {
  if (model.value.funding.currency === 'BCH') return 'BCH';

  return app.oracles.oracleMetadataStore[model.value.funding.currency]
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

// Disable buttons if funded
const disabled = computed(
  () => !!app.stampCollection.value?.getFundingOptions().funded
);

// Model for showing funding transaction QR code
const fundingQrCode = ref<typeof FundingQrCode | null>(null);
const showFundingQR = async () => {
  if (!app.stampCollection?.value) return;
  fundingQrCode.value?.toggleVisible();
};

// Model for showing redeeming unclaimed wallets dialog
const redeemDialog = ref<typeof RedeemDialog | null>(null);
const showRedeemDialog = async () => {
  redeemDialog.value?.toggleVisible();
}

// Create and Emit wallets
const submit = async () => {
  emits('create')
};
</script>
