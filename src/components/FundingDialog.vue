<template>
  <q-dialog v-model="state.visible" class="blur-background q-pa-lg">
    <q-card class="justify-center q-col-gutter-y-md">
      <q-card-section>
        <!-- Warning to backup mnemonic -->
        <q-banner class="bg-negative text-white text-center">
          <p class="text-weight-bold">
            {{ t('backupWarning') }}
          </p>
          <p>
            <strong class="text-weight-bolder">{{
              t('saveMnemonicWarning')
            }}</strong>
          </p>
          <p>
            {{ stampCollection.mnemonic }}
          </p>
        </q-banner>
      </q-card-section>

      <!-- QR Code -->
      <q-card-section class="q-gutter-y-md">
        <div
          class="text-h6 no-margin text-weight-medium justify-center items-center text-center"
        >
          {{ t('scanToFund') }}
        </div>
        <div class="flex justify-center">
          <div ref="qrElement" id="invoice-container" class="full-width" />
        </div>
      </q-card-section>

      <!-- BIP70/JPP Wallets -->
      <q-card-section class="text-center">
        <small>
          <div class="text-weight-bold">{{ t('paymentProtocolNotice') }}</div>
          <div>{{ t('knownWallets') }}</div>
        </small>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { nextTick, ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import { StampCollection, CashPayServer_Invoice } from 'src/types.js';
import { OraclesService } from 'src/services/oracles.js';
import { waitFor } from 'src/utils/misc.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

import CashPayServer from '@developers.cash/cash-pay-server-js';

// translations
import translations from './FundingDialog.i18n.json';

const $q = useQuasar();
const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: translations.messages,
});

//---------------------------------------------------------------------------
// State
//---------------------------------------------------------------------------

// Props.
const props = defineProps<{
  stampCollection: StampCollection;
  wallet: WalletHD;
  oracles: OraclesService;
}>();

// Reactives.
const state = reactive<{
  visible: boolean;
}>({
  visible: false,
});

// Get the QR Code element.
const qrElement = ref<HTMLElement | null>(null);

//---------------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------------

function toggleVisible() {
  state.visible = !state.visible;

  if (state.visible) {
    // The QR Code div will not be rendered until the next tick.
    // So, we have to wrap it like this.
    nextTick(() => {
      generateQrCode();
    });
  }
}

async function createFundingTx(): Promise<CashPayServer_Invoice> {
  // Create BIP70 invoice instance
  const invoice = new CashPayServer.Invoice();

  // Get amount without currency reference
  const fiatAmount = props.stampCollection.amount;

  // Get currency
  const currency = props.stampCollection.currency;

  // Get Currency Unit Code.
  const unitCode = props.oracles.getOracleUnitCode(currency);

  // Initialise the output amount to be in BCH
  let bchAmount = fiatAmount;

  // If the currency selected is not BCH, convert bchAmount to the equivalent amount in the selected currency
  if (currency !== 'BCH') {
    // Get the BCH price in the selected currency
    const bchPrice = props.oracles.getOraclePriceCommonUnits(currency);

    // Set BCH amount to the equivalent amount in the selected currency
    bchAmount = fiatAmount / bchPrice;
  }

  // Add addresses to transaction
  for (const node of props.wallet.wallets.value) {
    const address = node.getAddress();
    invoice.addAddress(
      address,
      `${bchAmount}BCH` // Amount sent to CashPayServer is in BCH
    );
  }

  // Name invoice to show up in cryptocurrency wallet
  invoice
    .setMemo(`CashStamps: ${props.stampCollection.name}`)
    .setUserCurrency(unitCode);

  // Return invoice object, Need to call create from here, but we need to be able to call "intoContainer" to load the invoice into the browser
  return invoice;
}

async function generateQrCode() {
  // If we failed to get the QR Code element, throw an error.
  if (!qrElement.value) {
    throw new Error('Failed to find qrElement');
  }

  // Create funding tx template
  const invoice = await createFundingTx();
  if (!invoice) {
    throw new Error('Failed to create funding transaction');
  }

  // Set QR code to fill QrElement
  invoice
    ?.intoContainer(qrElement.value)

    // Listen for broadcasted event to update stamps
    .on(['broadcasted'], async (_e: unknown) => {
      // Show the loading indicator.
      $q.loading.show();

      // Wait for the wallet to be marked as funded.
      await waitFor(props.wallet.isFunded, true);

      // Hide the loading indicator.
      $q.loading.hide();

      // Show the user a notification.
      $q.notify({
        message: t('stampsFundedSuccessfully'),
      });
    });

  // Create the QR code by sending request to CashPayServer
  await invoice.create();
}

// Vue function to allow parent component to call toggleVisible
defineExpose({
  toggleVisible,
});
</script>

<style lang="scss">
.blur-background {
  backdrop-filter: blur(5px);
}

#invoice-container {
  margin: auto;
  max-width: 150px;
  font-size: 0.8em;
  min-height: 80px;
}

.cashpay-loading {
  fill: var(--q-primary) !important;
}

.cashpay-tick {
  fill: var(--q-primary) !important;
}

.cashpay-cross {
  fill: #f00 !important;
}
</style>
