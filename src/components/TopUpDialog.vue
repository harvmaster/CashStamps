<template>
  <q-dialog v-model="state.visible" class="blur-background q-pa-lg">
    <q-card class="justify-center q-col-gutter-y-md">
      <!-- Nothing needs topping up -->
      <q-card-section v-if="state.visible && summary.stampsNeeding === 0">
        <q-banner class="bg-positive text-white text-center">
          <p class="text-weight-bold">
            {{ t('allStampsFunded') }}
          </p>
        </q-banner>
      </q-card-section>

      <template v-else>
        <!-- Summary of what's being topped up -->
        <q-card-section>
          <q-banner class="bg-info text-white text-center">
            <p class="text-weight-bold">
              {{
                t('topUpSummary', {
                  count: summary.stampsNeeding,
                  total: summary.totalStamps,
                })
              }}
            </p>
            <p>
              {{
                t('topUpAmountNeeded', {
                  amount: summary.totalDeficitBch.toFixed(8),
                })
              }}
            </p>
          </q-banner>
        </q-card-section>

        <!-- QR Code -->
        <q-card-section class="q-gutter-y-md">
          <div
            class="text-h6 no-margin text-weight-medium justify-center items-center text-center"
          >
            {{ t('scanToTopUp') }}
          </div>
          <div class="flex justify-center">
            <div
              ref="qrElement"
              id="topup-invoice-container"
              class="full-width"
            />
          </div>
        </q-card-section>

        <!-- BIP70/JPP Wallets -->
        <q-card-section class="text-center">
          <small>
            <div class="text-weight-bold">{{ t('paymentProtocolNotice') }}</div>
            <div>{{ t('knownWallets') }}</div>
          </small>
        </q-card-section>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { nextTick, ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import { type App } from 'src/services/app.js';
import { StampCollection, CashPayServer_Invoice } from 'src/types.js';
import { OraclesService } from 'src/services/oracles.js';
import { waitFor } from 'src/utils/misc.js';
import { WalletHD } from 'src/utils/wallet-hd.js';

import CashPayServer from '@developers.cash/cash-pay-server-js';

// translations
// NOTE: mirror the shape of FundingDialog.i18n.json. Keys used below:
//   allStampsFunded, topUpSummary, topUpAmountNeeded, scanToTopUp,
//   paymentProtocolNotice, knownWallets, stampsToppedUpSuccessfully
import translations from './TopUpDialog.i18n.json';

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
  app: App;
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

// Summary of what needs topping up, computed each time the dialog opens.
const summary = reactive<{
  stampsNeeding: number;
  totalStamps: number;
  totalDeficitBch: number;
}>({
  stampsNeeding: 0,
  totalStamps: 0,
  totalDeficitBch: 0,
});

// Get the QR Code element.
const qrElement = ref<HTMLElement | null>(null);

// `node.balance.value` is denominated in satoshis, while target amounts are
// computed in BCH — convert before comparing/subtracting the two.
const SATS_PER_BCH = 100_000_000;

function balanceInBch(node: WalletHD['wallets']['value'][number]): number {
  return node.balance.value / SATS_PER_BCH;
}

//---------------------------------------------------------------------------
// Methods
//---------------------------------------------------------------------------

// Work out the BCH amount each stamp *should* hold (the "target"),
// converting from the collection's fiat currency if necessary.
function getTargetBchAmount(): number {
  const fiatAmount = props.stampCollection.amount;
  const currency = props.stampCollection.currency;

  if (currency === 'BCH') {
    return fiatAmount;
  }

  const bchPrice = props.oracles.getOraclePriceCommonUnits(currency);
  return fiatAmount / bchPrice;
}

// Compute which wallets are underfunded relative to the target, and by how much.
// NOTE: assumes `wallet.balance.value` is denominated in BCH, matching the
//       `${bchAmount}BCH` format used in FundingDialog's createFundingTx.
//       Double check this against your actual wallet implementation.
// A stamp counts as "claimed" (already redeemed) if its balance has been
// swept out. Since this dialog is only reachable once the whole collection
// has been funded (every wallet was included in the same original funding
// tx — see FundingDialog's createFundingTx), a zero-or-negative balance
// here can only mean "claimed," never "never funded." Claimed stamps must
// NEVER be topped back up.
function isClaimed(node: WalletHD['wallets']['value'][number]): boolean {
  return balanceInBch(node) <= 0;
}

function computeSummary(targetBchAmount: number) {
  const wallets = props.wallet.wallets.value;

  let stampsNeeding = 0;
  let totalDeficitBch = 0;

  for (const node of wallets) {
    if (isClaimed(node)) continue;

    const deficit = targetBchAmount - balanceInBch(node);
    if (deficit > 0) {
      stampsNeeding++;
      totalDeficitBch += deficit;
    }
  }

  summary.stampsNeeding = stampsNeeding;
  summary.totalStamps = wallets.length;
  summary.totalDeficitBch = totalDeficitBch;
}

function toggleVisible() {
  state.visible = !state.visible;

  if (state.visible) {
    // Recompute the summary every time the dialog is opened, since price
    // (and therefore the target amount) may have moved since last time.
    const targetBchAmount = getTargetBchAmount();
    computeSummary(targetBchAmount);

    // Only generate a QR code if there's actually something to top up.
    if (summary.stampsNeeding > 0) {
      // The QR Code div will not be rendered until the next tick.
      nextTick(() => {
        generateQrCode(targetBchAmount);
      });
    }
  }
}

async function createTopUpTx(
  targetBchAmount: number
): Promise<CashPayServer_Invoice> {
  // Create BIP70 invoice instance
  const invoice = new CashPayServer.Invoice();

  // Get currency
  const currency = props.stampCollection.currency;

  // Get Currency Unit Code.
  const unitCode = props.oracles.getOracleUnitCode(currency);

  // Add only underfunded addresses, each topped up to the target amount.
  let addressesAdded = 0;

  for (const node of props.wallet.wallets.value) {
    // Never top up a stamp that's already been claimed/redeemed.
    if (isClaimed(node)) continue;

    const deficit = targetBchAmount - balanceInBch(node);

    // Skip stamps that are already fully (or over-) funded.
    if (deficit <= 0) continue;

    const address = node.getAddress();
    invoice.addAddress(address, `${deficit}BCH`);
    addressesAdded++;
  }

  if (addressesAdded === 0) {
    throw new Error('No stamps need topping up');
  }

  // Name invoice to show up in cryptocurrency wallet
  invoice
    .setMemo(`CashStamps Top Up: ${props.stampCollection.name}`)
    .setUserCurrency(unitCode);

  return invoice;
}

async function generateQrCode(targetBchAmount: number) {
  // If we failed to get the QR Code element, throw an error.
  if (!qrElement.value) {
    throw new Error('Failed to find qrElement');
  }

  // Create top-up tx template
  const invoice = await createTopUpTx(targetBchAmount);
  if (!invoice) {
    throw new Error('Failed to create top-up transaction');
  }

  // Set QR code to fill QrElement
  invoice
    ?.intoContainer(qrElement.value)

    // Listen for broadcasted event to update stamps
    .on(['broadcasted'], async (_e: unknown) => {
      // Show the loading indicator.
      $q.loading.show();

      // Wait for the wallet to be marked as funded again.
      await waitFor(props.wallet.isFunded, true);

      // Hide the loading indicator.
      $q.loading.hide();

      // Show the user a notification.
      $q.notify({
        message: t('stampsToppedUpSuccessfully'),
      });

      // Close the dialog now that the top-up has landed.
      state.visible = false;

      // NOTE: auto-expire convergence is handled by the service's aggregate
      // watcher (auto-expire.ts), which picks up the new UTXOs once Electrum
      // indexes them. No explicit sync here — it would race indexing.
    });

  // Create the QR code by sending request to CashPayServer
  await invoice.create();

  // Apply Paytaca Watchtower Hack.
  try {
    await paytacaWatchtowerHack();
  } catch (error) {
    console.warn(`Failed to apply Paytaca Hack: ${error}`);
  }
}

// HACK: As of 2024-10-20, Paytaca tracks addresses via its watchtower.
//       Addresses MUST be subscribed to before a balance will be shown.
//       As a work-around, we subscribe here instead PRIOR to funding.
//       Otherwise, first attempts at sweeping via Paytaca WILL fail.
async function paytacaWatchtowerHack() {
  // Only re-subscribe the addresses that are actually being topped up.
  const targetBchAmount = getTargetBchAmount();
  const addresses = props.wallet.wallets.value
    .filter(
      (node) => !isClaimed(node) && targetBchAmount - balanceInBch(node) > 0
    )
    .map((node) => node.getAddress());

  // Call the watchtower subscribe endpoint for each address.
  const subscribePromises = addresses.map((address) => {
    return fetch('https://watchtower.cash/api/subscription/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
      }),
    });
  });

  // Wait for all subscribe promises to complete.
  await Promise.all(subscribePromises);
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

#topup-invoice-container {
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
