import { SettlementServiceClient } from '@infracash/settlement-service';
import { WalletHD } from 'src/utils/wallet-hd.js';
import { type StampCollection } from 'src/types.js';

import {
  sha256,
  utf8ToBin,
  generateTransaction,
  getMinimumFee,
  encodeTransaction,
  binToHex,
} from '@bitauth/libauth';
import { ref } from 'vue';

export type AutoExpireServiceOpts = {
  stampCollection: StampCollection;
  wallet: WalletHD;
};

export class AutoExpireService {
  opts?: AutoExpireServiceOpts;

  settlementServiceClient?: SettlementServiceClient;

  isServiceAvailable = ref(false);
  isAutoExpireEnabled = ref(false);

  async start(opts: AutoExpireServiceOpts): Promise<void> {
    this.opts = opts;

    // Derive the key from the mnemonic by hashing it.
    const settlementServiceKey = sha256.hash(
      utf8ToBin(this.opts.stampCollection.mnemonic)
    );

    this.settlementServiceClient = new SettlementServiceClient({
      privateKey: settlementServiceKey,
    });

    await this.refresh();
  }

  async stop() {
    delete this.settlementServiceClient;
  }

  async enable(opts: { payoutBytecode: Uint8Array }) {
    if (!this.settlementServiceClient || !this.opts) {
      return;
    }

    const transactions = await this.buildRefundTransactions(
      opts.payoutBytecode
    );
    const transactionsHex = transactions.map((transactionBytes: Uint8Array) =>
      binToHex(transactionBytes)
    );

    // Hand each per-input refund transaction to the settlement service to
    // hold and auto-broadcast on the agreed refund (X) date.
    await this.settlementServiceClient.create({
      id: 'stamps.cash',
      trigger: {
        time: {
          $gte: new Date(this.opts.stampCollection.expiry).toISOString(),
        },
      },
      transactions: transactionsHex,
    });

    this.isAutoExpireEnabled.value = true;
  }

  async disable() {
    if (!this.settlementServiceClient || !this.opts) {
      return;
    }

    await this.settlementServiceClient.delete({ id: 'stamps.cash' });
    this.isAutoExpireEnabled.value = false;
  }

  async refresh() {
    if (!this.settlementServiceClient || !this.opts) {
      return;
    }

    // Check if the settlement service is alive.
    this.isServiceAvailable.value = await this.settlementServiceClient.isLive();

    // If settlement service is not alive, return to exit early.
    if (!this.isServiceAvailable.value) {
      return;
    }

    // Check if there are active auto-expiry items for this collection.
    try {
      await this.settlementServiceClient.get({ id: 'stamps.cash' });
      this.isAutoExpireEnabled.value = true;
    } catch (error) {
      this.isAutoExpireEnabled.value = false;
    }
  }

  private async buildRefundTransactions(
    payoutBytecode: Uint8Array
  ): Promise<Uint8Array[]> {
    if (!this.settlementServiceClient || !this.opts) {
      throw new Error('Settlement Service not started');
    }

    // Get a list of inputs belonging to each wallet.
    const inputs = await Promise.all(
      this.opts.wallet.wallets.value.map((wallet) =>
        wallet.getUnspentDirectives()
      )
    );

    // Flatten the inputs.
    const inputsFlattened = inputs.flat();

    const encodedTransactions: Array<Uint8Array> = [];

    // Build one transaction per input.
    for (const input of inputsFlattened) {
      const inputValue = input.unlockingBytecode.valueSatoshis;

      // We need to calculate the number of bytes so that we can calculate the fee.
      // So we loop twice and store the final transaction here each time.
      // 1st time will have zero fee. 2nd time will accommodate the fee.
      let encodedTransaction = new Uint8Array();

      for (let i = 0; i < 2; i++) {
        // Get the fee using 1000 sats/KB.
        const feeSats = getMinimumFee(BigInt(encodedTransaction.length), 1000n);

        const outputValue = inputValue - feeSats;

        // Guard against dust / negative outputs for tiny inputs.
        if (outputValue <= 0n) {
          throw new Error(
            `Input value ${inputValue} insufficient to cover fee ${feeSats}`
          );
        }

        // Attempt to generate the transaction.
        const generatedTransaction = generateTransaction({
          version: 2,
          locktime: 0,
          inputs: [input],
          outputs: [
            {
              lockingBytecode: payoutBytecode,
              valueSatoshis: outputValue,
            },
          ],
        });

        if (!generatedTransaction.success) {
          console.error(generatedTransaction.errors);
          throw new Error('Failed to generate transaction');
        }

        // Encode the transaction for broadcasting (and fee estimation).
        encodedTransaction = encodeTransaction(
          generatedTransaction.transaction
        );
      }

      encodedTransactions.push(encodedTransaction);
    }

    return encodedTransactions;
  }
}
