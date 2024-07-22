<template>
  <div class="row q-col-gutter-md">
    <div class="col-md col-12 row q-col-gutter-md">
      <!-- First row -->
      <div class="col-12 row q-col-gutter-md">
        <!-- Name Input -->
        <div class="col-md col-12 row">
          <q-input
            class="col"
            v-model.number="form.name"
            :label="`Stamp Collection Name`"
            :disable="disabled"
            filled
            @update:model-value="updateName"
          />
        </div>

        <!-- Date input -->
        <div class="col-md-auto col-12 row">
          <q-input
            filled
            v-model="form.expiry"
            mask="date"
            class="col"
            placeholder="YYYY/MM/DD"
            label="Expiry Date (YYYY/MM/DD)"
            :disable="disabled"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover :breakpoint="600">
                  <q-date v-model="form.expiry" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
      </div>

      <!-- Second row -->
      <div class="col-12 row q-col-gutter-md">
        <!-- Value Input -->
        <div class="col-md col-12 row">
          <q-input
            class="col-12"
            v-model.number="form.funding.value"
            :label="`Stamp Value (${currencyName})`"
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
            style="min-width: 10em"
            v-model.number="form.quantity"
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
            <div v-if="loadingFormattingCurrency" class="col-12">
              <q-spinner />
            </div>
            <div v-else class="col-12 text-h6">
              {{
                currencyName === 'BCH'
                  ? (form.quantity * formattedCurrency).toFixed(8)
                  : (form.quantity * formattedCurrency).toFixed(2)
              }}
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
          @click="submit"
        />
      </div>

      <!-- Fund -->
      <div class="col-auto">
        <q-btn
          class="full-width"
          :disable="
            !stampCollectionStamps?.length || !stampCollectionName || disabled
          "
          label="Fund Stamps"
          color="secondary"
          @click="showFundingQR"
        >
          <!-- Error messages -->
          <q-tooltip
            v-if="!stampCollectionStamps?.length"
            style="font-size: 0.75rem"
            >Stamps must be created before you can fund them</q-tooltip
          >
          <q-tooltip
            v-else-if="stampCollectionFunding?.funded"
            style="font-size: 0.75rem"
            >Stamps are already funded</q-tooltip
          >
          <q-tooltip v-else-if="!stampCollectionName" style="font-size: 0.75rem"
            >Stamp collections must have a name in order to fund them</q-tooltip
          >
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
      <!-- Modal for showing Funding TX Qr Code -->
      <funding-qr-code ref="fundingQrCode" />

      <!-- Model to display instructions for Redeeming unclaimed wallets -->
      <redeem-dialog ref="redeemDialog" />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

// import { app } from 'src/boot/app.js';
import { GenerateOptions } from 'src/services/stamp-collection.js';

import FundingQrCode from '../QRCodes/FundingQRCode.vue';
import RedeemDialog from './RedeemDialog.vue';
import { App } from 'src/services/app';

// TODO: This interface is probably available in Quasar somewhere.
interface Option {
  label: string;
  value: string;
}

const model = defineModel<Required<GenerateOptions>>('form', {
  required: true,
});
const props = defineProps<{ app: App }>();
const app = props.app

const emits = defineEmits(['create']);

// ----------------------------------
// Reactive Variables
// ----------------------------------
//
// Get the current StampCollection. Have to get them individually because the variables are private on the stamp collection object
const stampCollection = computed(() => app.stampCollection.value);
const stampCollectionStamps = computed(() =>
  stampCollection.value?.getStamps()
);
const stampCollectionName = computed(() => stampCollection.value?.getName());
const stampCollectionFunding = computed(() =>
  stampCollection.value?.getFundingOptions()
);

// Disable buttons if funded
const disabled = computed(
  () => !!app.stampCollection.value?.getFundingOptions().funded
);

// ----------------------------------
// Collection Name Updater
// ----------------------------------

// Update the collection name dynamically using a setter on the collection
const updateName = (val: string | number | null) => {
  if (!(typeof val === 'string')) return;
  if (!stampCollection.value) return;
  stampCollection.value.setName(val);
};

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
  if (model.value.funding.currency === 'BCH') return 'BCH';

  return (
    app.oracles.oracleMetadataStore[model.value.funding.currency]
      .sourceNumeratorUnitCode || 'unknown'
  );
});

// Create list of currency options and then add BCH
const currencyOptions = computed((): Array<Option> => {
  // Initialise list with BCH as default
  const options: Array<Option> = [{ label: 'BCH', value: 'BCH' }];

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

// ----------------------------------
// Currency Conversion for Total Value
// ----------------------------------

// Show the total value of a transaction in the selected currency. This is used for old collections that have been funded
const loadingFormattingCurrency = ref(false);
const formattedCurrency = ref<number>(model.value.funding.value);
const formatCurrency = async () => {
  // If the collection is not funded, just show the value
  if (!stampCollectionFunding.value?.funded) {
    return (formattedCurrency.value = model.value.funding.value);
  }

  loadingFormattingCurrency.value = true;

  // Convert the value to the selected currency
  formattedCurrency.value = await app.oracles.convertCurrency(
    model.value.funding.currency,
    stampCollectionFunding.value.value,
    stampCollectionFunding.value.funded.getTime()
  );

  loadingFormattingCurrency.value = false;
};

// Update the formatted currency when the funding value or currency changes
watch(
  () => [model.value.funding.value, model.value.funding.currency],
  () => formatCurrency()
);
// This is used to detect when the collection changes. Otherwise it may not notice the change
watch(
  () => model.value.funding,
  () => formatCurrency()
);

// ----------------------------------
// Dialog Refs & Controls
// ----------------------------------

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
};

// Create and Emit wallets
const submit = async () => {
  emits('create');
};
</script>
