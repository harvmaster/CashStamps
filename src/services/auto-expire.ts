import {
  type SettlementItem,
  SettlementServiceClient,
} from '@infracash/settlement-service';
import { getLocalEndOfDayISO } from 'src/utils/misc.js';
import { Address } from 'src/utils/address.js';
import { WalletHD } from 'src/utils/wallet-hd.js';
import { type WalletP2PKH } from 'src/utils/wallet-p2pkh.js';
import { type StampCollection } from 'src/types.js';

import {
  sha256,
  utf8ToBin,
  generateTransaction,
  getMinimumFee,
  encodeTransaction,
  binToHex,
} from '@bitauth/libauth';
import { computed, ref, shallowRef, watch } from 'vue';

export type AutoExpireServiceOpts = {
  stampCollection: StampCollection;
  wallet: WalletHD;
};

type RefundMeta = {
  expiry?: string;
  payout?: string;
};

export class AutoExpireService {
  // Trailing debounce for the aggregate watcher: coalesces sync bursts (e.g.
  // 100 stamps updating at once) into a single evaluation. Short on purpose —
  // convergence in seconds, not the 45s a fixed interval would impose.
  static readonly EVALUATE_DEBOUNCE_MS = 5_000;

  // Item meta is JSON {expiry, payout} for new items, a plain ISO date for
  // legacy items (written before the payout was stored server-side).
  // The payout lives ONLY here — no local copy — so imported collections
  // converge on any machine once items are listed.
  static parseItemMeta(meta: string | undefined): RefundMeta {
    if (!meta) return {};
    try {
      const parsed = JSON.parse(meta) as Partial<RefundMeta>;
      if (parsed && typeof parsed === 'object') {
        return {
          ...(typeof parsed.expiry === 'string'
            ? { expiry: parsed.expiry }
            : {}),
          ...(typeof parsed.payout === 'string'
            ? { payout: parsed.payout }
            : {}),
        };
      }
    } catch {
      // Legacy plain-ISO meta falls through below.
    }
    return { expiry: meta };
  }

  static encodeItemMeta(expiry: string, payoutCashAddr: string): string {
    return JSON.stringify({ expiry, payout: payoutCashAddr });
  }
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
    return AutoExpireService.parseItemMeta(this.items.value[0]?.meta).expiry;
  });

  items = shallowRef<Array<SettlementItem>>([]);

  // Enabled but no parseable payout in any item: legacy (pre-meta) items or
  // foreign writes. UI surfaces this as a re-enable prompt.
  missingPayoutAddress = computed(
    () => this.isAutoExpireEnabled.value && !this.payoutFromItems()
  );

  // Last-synced local fingerprint per stamp id (`${index}`). Lets the
  // watcher skip stamps whose on-chain state hasn't moved without any
  // network calls. See localFingerprint().
  private lastSyncedFingerprint = new Map<string, string>();

  // Aggregate watcher teardown + debounce timer. Single watcher over the
  // whole collection fingerprint — Vue batches multi-stamp bursts into one
  // evaluation. No per-address wiring.
  private evaluateStopHandle?: () => void;
  private evaluateTimeout?: ReturnType<typeof setTimeout>;

  // True while a syncStamps() run is in flight. The watcher skips ticks
  // that land mid-sync (the in-flight run already covers them).
  private syncing = false;

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
    this.seedFingerprints();

    // Event-driven convergence: a single aggregate watcher over the whole
    // collection fingerprint (live UTXOs + payout + trigger). Fires seconds
    // after state settles — claims, top-ups, expiry edits — with no polling.
    this.startWatcher();
  }

  async stop() {
    this.stopWatcher();
    this.lastSyncedFingerprint.clear();
    delete this.settlementServiceClient;
    this.opts = undefined;
    this.items.value = [];
  }

  private startWatcher() {
    this.stopWatcher();
    const fingerprint = computed(() => {
      if (!this.opts) return '';
      const payout = this.payoutFromItems() ?? '';
      return this.opts.wallet.wallets.value
        .map((w, i) => this.localFingerprint(`${i}`, w, payout))
        .join('\n');
    });
    this.evaluateStopHandle = watch(fingerprint, () => {
      if (this.evaluateTimeout !== undefined) {
        clearTimeout(this.evaluateTimeout);
      }
      this.evaluateTimeout = setTimeout(() => {
        this.evaluateTimeout = undefined;
        void this.evaluate();
      }, AutoExpireService.EVALUATE_DEBOUNCE_MS);
    });
  }

  private stopWatcher() {
    if (this.evaluateTimeout !== undefined) {
      clearTimeout(this.evaluateTimeout);
      this.evaluateTimeout = undefined;
    }
    this.evaluateStopHandle?.();
    this.evaluateStopHandle = undefined;
    this.syncing = false;
  }

  // Public entry point for (re-)enabling. Thin wrapper over syncStamps():
  // enable is just a sync against the current server state with an explicit
  // payout. Diffing handles fresh enables (all missing -> batch create) and
  // re-enables over existing/legacy items (graduated delete + create).
  // Returns the number of stamp ids written.
  async enable(opts: { payoutBytecode: Uint8Array }): Promise<number> {
    if (!this.settlementServiceClient || !this.opts) {
      throw new Error('Auto-Expire service not started');
    }

    // Preserve the old error surfacing: syncStamps() silently returns 0 when
    // the service is down (correct for the background watcher), but an
    // explicit user action should fail loudly instead of reporting success.
    if (!this.isServiceAvailable.value) {
      throw new Error('Settlement service unavailable');
    }

    // Don't race an in-flight background sync against the user's explicit
    // payout. Wait (bounded — dialog shows a spinner) then delegate once.
    const deadline = Date.now() + 15_000;
    while (this.syncing && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (this.syncing) {
      throw new Error('Sync in progress, please try again');
    }

    return this.syncStamps(undefined, { payoutBytecode: opts.payoutBytecode });
  }

  async disable() {
    if (!this.settlementServiceClient || !this.opts) {
      return;
    }

    await this.settlementServiceClient.delete({});
    await this.refresh();
    this.lastSyncedFingerprint.clear();
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

  // Sync specific stamps (default: all). Builds each item fresh, diffs
  // against the cached list entries, and applies the delta in at most TWO
  // settlement requests regardless of stamp count: one batch delete ($in)
  // + one batch create (items array). No upsert is assumed, so updates are
  // delete-then-create; the gap between those two calls is the only window
  // where a browser close can leave items unprotected. Fingerprints advance
  // only on success, so a failed write retries on the next evaluation.
  // Returns the number of ids written.
  async syncStamps(
    ids?: number[],
    opts?: { payoutBytecode?: Uint8Array }
  ): Promise<number> {
    if (!this.settlementServiceClient || !this.opts) {
      return 0;
    }

    if (!this.isServiceAvailable.value) {
      return 0;
    }

    // Serialize runs: concurrent syncs would delete + create the same ids
    // against each other. The watcher skips while this is set.
    if (this.syncing) {
      return 0;
    }
    this.syncing = true;
    try {
      // Explicit payout (enable path) wins; otherwise fall back to the
      // payout stored in the cached items' meta. Fingerprints and built
      // meta must use the same normalized string.
      let payoutAddr: string;
      let payoutBytecode: Uint8Array;
      if (opts?.payoutBytecode) {
        payoutBytecode = opts.payoutBytecode;
        payoutAddr =
          Address.fromLockscriptBytes(payoutBytecode).toCashAddr();
      } else {
        const cachedPayout = this.payoutFromItems();
        if (!cachedPayout) {
          return 0;
        }
        payoutAddr = cachedPayout;
        payoutBytecode =
          Address.fromCashAddrOrLegacy(payoutAddr).toLockscriptBytes();
      }

      const wallets = this.opts.wallet.wallets.value;
      const targets = ids ?? wallets.map((_, i) => i);

      const toDeleteIds: string[] = [];
      const toCreateItems: Parameters<
        SettlementServiceClient['create']
      >[0]['items'] = [];
      const unchangedIds: string[] = [];
      const changedIds: string[] = [];

      // Read phase: rebuild every target concurrently. Each build is one
      // Electrum `listunspent` round-trip plus local compilation, with no
      // shared mutable state between stamps, so sequential awaits would just
      // multiply latency by the stamp count. Per-stamp failures are isolated
      // (stale fingerprint retries next evaluation) instead of sinking the
      // whole batch. Array order matches `targets` order.
      const builds = await Promise.all(
        targets.map(async (index) => {
          const wallet = wallets[index];
          if (!wallet) return null;
          try {
            const built = await this.buildSettlementItem(
              index,
              wallet,
              payoutBytecode
            );
            return { id: `${index}`, built };
          } catch (error) {
            console.warn(
              `AutoExpire: build for stamp ${index} failed, skipping: ${error}`
            );
            return null;
          }
        })
      );

      // Diff phase: pure-local compare over the resolved builds.
      for (const result of builds) {
        if (!result) continue;
        const { id, built } = result;
        const cached = this.items.value.find((item) => item.id === id);

        // Broadcasted items are terminal history: the refund already
        // executed, so there is nothing to rebuild and — critically —
        // nothing to delete. Treating a swept stamp as "empty, remove
        // leftover" would erase the broadcast record that
        // `autoExpiredStampCount` / `wasAutoExpired` read.
        if (cached?.broadcasted) {
          unchangedIds.push(id);
          continue;
        }

        if (!built) {
          // Stamp is empty (e.g. claimed): refund is moot. Remove any
          // leftover item so the server state matches reality.
          if (cached) {
            toDeleteIds.push(id);
            changedIds.push(id);
          } else {
            unchangedIds.push(id);
          }
          continue;
        }

        // Semantic meta compare: old items carry plain-ISO meta, new items
        // JSON. A mismatch here graduates legacy items on first sync.
        const cachedMeta = AutoExpireService.parseItemMeta(cached?.meta);
        const builtMeta = AutoExpireService.parseItemMeta(built.meta);
        if (
          cached &&
          cached.transactions?.[0] === built.transactions[0] &&
          JSON.stringify(cached.trigger) === JSON.stringify(built.trigger) &&
          cachedMeta.expiry === builtMeta.expiry &&
          (cachedMeta.payout ?? null) === (builtMeta.payout ?? null)
        ) {
          unchangedIds.push(id);
          continue;
        }

        if (cached) {
          toDeleteIds.push(id);
        }
        toCreateItems.push(built);
        changedIds.push(id);
      }

      // Baseline stays current even when nothing needs writing (matters for
      // the enable path, where the payout itself is new).
      for (const id of unchangedIds) {
        const wallet = wallets[Number(id)];
        if (wallet) {
          this.lastSyncedFingerprint.set(
            id,
            this.localFingerprint(id, wallet, payoutAddr)
          );
        }
      }

      if (changedIds.length === 0) {
        return 0;
      }

      // At most two settlement requests for the whole batch.
      if (toDeleteIds.length > 0) {
        await this.settlementServiceClient.delete({
          filter: { field: 'id', op: '$in', value: toDeleteIds },
        });
      }
      if (toCreateItems.length > 0) {
        await this.settlementServiceClient.create({ items: toCreateItems });
      }

      // Only advance changed fingerprints after both writes succeed — a
      // failure leaves the old baseline so the next evaluation retries.
      for (const id of changedIds) {
        const wallet = wallets[Number(id)];
        if (wallet) {
          this.lastSyncedFingerprint.set(
            id,
            this.localFingerprint(id, wallet, payoutAddr)
          );
        }
      }

      await this.refresh();

      return changedIds.length;
    } finally {
      this.syncing = false;
    }
  }

  // Aggregate evaluation: diff live fingerprints vs last-synced and
  // surgically sync diverged stamp ids. Cheap local pass first (no network);
  // syncStamps() hex-compares against cached items before writing, so
  // evaluation bursts can only ever cause reads, never spurious writes.
  private async evaluate(): Promise<void> {
    if (!this.settlementServiceClient || !this.opts) {
      return;
    }

    if (!this.isAutoExpireEnabled.value) {
      return;
    }

    // Skip ticks that land mid-sync; the in-flight run already covers them.
    if (this.syncing) {
      return;
    }

    try {
      const payout = this.payoutFromItems() ?? '';
      const wallets = this.opts.wallet.wallets.value;
      const diverged: number[] = [];
      for (const [index, wallet] of wallets.entries()) {
        const id = `${index}`;
        if (
          this.localFingerprint(id, wallet, payout) !==
          this.lastSyncedFingerprint.get(id)
        ) {
          diverged.push(index);
        }
      }

      if (diverged.length > 0) {
        await this.syncStamps(diverged);
      }
    } catch (error) {
      // Background safety net: never throw. The next state change retries.
      console.warn(`AutoExpire: evaluate() failed: ${error}`);
    }
  }

  // Cheap local fingerprint of everything a stamp's refund depends on:
  // live UTXO set (sorted — Electrum order isn't stable) + payout + trigger.
  // Reads cached reactive state only; no network. Deliberately NOT the raw
  // TX hex (input ordering can vary run-to-run for identical UTXO sets).
  private localFingerprint(
    id: string,
    wallet: WalletP2PKH,
    payout: string
  ): string {
    void id;
    const utxos = [...(wallet.unspents.value ?? [])]
      .map((u) => `${u.tx_hash}:${u.tx_pos}:${u.value}`)
      .sort()
      .join(',');
    return `${this.triggerISO()}|${payout}|${utxos}`;
  }

  private seedFingerprints() {
    if (!this.opts) return;
    const payout = this.payoutFromItems() ?? '';
    for (const [index, wallet] of this.opts.wallet.wallets.value.entries()) {
      this.lastSyncedFingerprint.set(
        `${index}`,
        this.localFingerprint(`${index}`, wallet, payout)
      );
    }
  }

  private triggerISO(): string {
    const expiry = this.opts?.stampCollection.expiry;
    if (!expiry) throw new Error('Auto-Expire service not started');
    return getLocalEndOfDayISO(expiry);
  }

  // Single source of truth for the payout address: first parseable payout
  // across cached items. Roams with the mnemonic; no local copy to diverge.
  private payoutFromItems(): string | null {
    for (const item of this.items.value) {
      const payout = AutoExpireService.parseItemMeta(item.meta).payout;
      if (payout) return payout;
    }
    return null;
  }

  private async buildSettlementItem(
    index: number,
    wallet: WalletP2PKH,
    payoutBytecode: Uint8Array
  ) {
    if (!this.settlementServiceClient || !this.opts) {
      throw new Error('Settlement Service not started');
    }

    const inputs = await wallet.getUnspentDirectives();

    // If no inputs available for this stamp/wallet, return null to preserve the index
    if (inputs.length === 0) {
      return null;
    }

    // Spend ALL UTXOs at this stamp's address, not just the first one.
    // Top-Up adds a second UTXO to underfunded stamps; refunding only
    // inputs[0] would strand the topped-up funds with no refund path.
    const inputValue = inputs.reduce(
      (sum, input) => sum + input.unlockingBytecode.valueSatoshis,
      0n
    );

    let encodedTransaction = new Uint8Array();

    for (let i = 0; i < 2; i++) {
      const feeSats = getMinimumFee(BigInt(encodedTransaction.length), 1000n);
      const outputValue = inputValue - feeSats;

      if (outputValue <= 0n) {
        throw new Error(
          `Input value ${inputValue} insufficient to cover fee ${feeSats}`
        );
      }

      const generatedTransaction = generateTransaction({
        version: 2,
        locktime: 0,
        inputs,
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

      encodedTransaction = encodeTransaction(generatedTransaction.transaction);
    }

    const iso = this.triggerISO();
    // Payout travels in meta (normalized cashaddr) so any machine holding
    // the mnemonic can rebuild without a local copy.
    const payoutAddr =
      Address.fromLockscriptBytes(payoutBytecode).toCashAddr();

    return {
      id: `${index}`, // Guaranteed to correspond to stamp index `i`
      trigger: {
        time: {
          $gte: iso,
        },
      },
      transactions: [binToHex(encodedTransaction)],
      meta: AutoExpireService.encodeItemMeta(iso, payoutAddr),
      retain: true,
    };
  }
}
