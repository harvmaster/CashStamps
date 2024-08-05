<template>
  <q-dialog v-model="state.visible" class="blur-background q-pa-lg">
    <q-card class="justify-center q-col-gutter-y-md">
      <q-card-section>
        <!-- Warning to backup mnemonic -->
        <q-banner class="bg-negative text-white text-center">
          <p>
            <strong
              >Save your mnemonic somewhere safe before proceeding!</strong
            >
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
          Scan to fill the stamps with BCH
        </div>
        <div class="flex justify-center">
          <div ref="qrElement" id="invoice-container" class="full-width" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

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

<script setup lang="ts">
import { nextTick, ref, reactive } from 'vue';
import { useQuasar } from 'quasar';

import { StampCollection, CashPayServer_Invoice } from 'src/types.js';

import { OraclesService } from 'src/services/oracles.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

import CashPayServer from '@developers.cash/cash-pay-server-js';

const $q = useQuasar();

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

const toggleVisible = () => {
  state.visible = !state.visible;

  if (state.visible) {
    // The QR Code div will not be rendered until the next tick.
    // So, we have to wrap it like this.
    nextTick(() => {
      generateQrCode();
    });
  }
};

async function createFundingTx(): Promise<CashPayServer_Invoice> {
  // Create BIP70 invoice instance
  const invoice = new CashPayServer.Invoice();

  // Get amount without currency reference
  const rawAmount = props.stampCollection.amount;

  // Get currency
  const currency = props.stampCollection.currency;

  // Get Currency Unit Code.
  const unitCode = props.oracles.getOracleUnitCode(currency);

  // Initialise the output amount to be in BCH
  let bchAmount = rawAmount;

  // If the currency selected is not BCH, convert bchAmount to the equivalent amount in the selected currency
  if (currency !== 'BCH') {
    // Get the BCH price in the selected currency
    const bchPrice = props.oracles.getOraclePriceCommonUnits(currency);

    // Set BCH amount to the equivalent amount in the selected currency
    bchAmount = rawAmount / bchPrice;
  }

  // Add addresses to transaction
  for (const node of props.wallet.wallets.value) {
    const address = node
      .deriveHDPublicNode()
      .publicKey()
      .deriveAddress()
      .toCashAddr();
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
    .on(['broadcasted'], async (e: unknown) => {
      $q.loading.show();
      // NOTE: This is a hack.
      //       We have to wait for the tx to propagate before refreshing.
      //       Subscriptions in our current Electrum version are broken.
      //       So we just wait 5 seconds instead.

      setTimeout(async () => {
        await props.wallet.refreshChildNodes();

        $q.loading.hide();

        $q.notify({
          message: 'Stamps funded successfully!',
        });
      }, 2500);
    });

  // Create the QR code by sending request to CashPayServer
  await invoice.create();
}

// Vue function to allow parent component to call toggleVisible
defineExpose({
  toggleVisible,
});
</script>
