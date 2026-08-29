import {
  type SettlementItem,
  SettlementServiceClient,
} from '@infracash/settlement-service';
import { getLocalEndOfDayISO } from 'src/utils/misc.js';
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
import { computed, ref, shallowRef } from 'vue';

export type AutoExpireServiceOpts = {
  stampCollection: StampCollection;
  wallet: WalletHD;
};

export class AutoExpireService {
  opts?: AutoExpireServiceOpts;

  settlementServiceClient?: SettlementServiceClient;

  isServiceAvailable = ref(false);

  isAutoExpireEnabled = computed(() =>
    this.items.value.length ? true : false
  );

  autoExpiredStampCount = computed(() => {
    const broadcastedStamps = this.items.value.filter(
      (stamp) => stamp.broadcasted
    );

    return broadcastedStamps.length;
  });

  expiryDate = computed(() => {
    return this.items.value[0]?.meta || undefined;
  });

  items = shallowRef<Array<SettlementItem>>([]);

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
    this.opts = undefined;
    this.items.value = [];
  }

  async enable(opts: { payoutBytecode: Uint8Array }) {
    if (!this.settlementServiceClient || !this.opts) {
      return;
    }

    const transactions = await this.buildRefundTransactions(
      opts.payoutBytecode
    );

    const settlementItems = transactions
      .map((transaction, i) => {
        if (!transaction || !this.opts) return null;

        return {
          id: `${i}`, // Guaranteed to correspond to stamp index `i`
          trigger: {
            time: {
              $gte: getLocalEndOfDayISO(this.opts.stampCollection.expiry),
            },
          },
          transactions: [binToHex(transaction)],
          meta: getLocalEndOfDayISO(this.opts.stampCollection.expiry),
          retain: true,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    await this.settlementServiceClient.create({ items: settlementItems });
    await this.refresh();
  }

  async disable() {
    if (!this.settlementServiceClient || !this.opts) {
      return;
    }

    await this.settlementServiceClient.delete({});
    await this.refresh();
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
      const result = await this.settlementServiceClient.list();
      this.items.value = result.items;
    } catch (error) {
      this.items.value = [];
    }
  }

  public wasAutoExpired(stampNumber: number): boolean {
    const item = this.items.value.find((item) => item.id === `${stampNumber}`);
    return item?.broadcasted ? true : false;
  }

  private async buildRefundTransactions(
    payoutBytecode: Uint8Array
  ): Promise<Array<Uint8Array | null>> {
    if (!this.settlementServiceClient || !this.opts) {
      throw new Error('Settlement Service not started');
    }

    return Promise.all(
      this.opts.wallet.wallets.value.map(async (wallet) => {
        const inputs = await wallet.getUnspentDirectives();

        // If no inputs available for this stamp/wallet, return null to preserve the index
        if (inputs.length === 0) {
          return null;
        }

        const input = inputs[0];
        const inputValue = input.unlockingBytecode.valueSatoshis;

        let encodedTransaction = new Uint8Array();

        for (let i = 0; i < 2; i++) {
          const feeSats = getMinimumFee(
            BigInt(encodedTransaction.length),
            1000n
          );
          const outputValue = inputValue - feeSats;

          if (outputValue <= 0n) {
            throw new Error(
              `Input value ${inputValue} insufficient to cover fee ${feeSats}`
            );
          }

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

          encodedTransaction = encodeTransaction(
            generatedTransaction.transaction
          );
        }

        return encodedTransaction;
      })
    );
  }
}
