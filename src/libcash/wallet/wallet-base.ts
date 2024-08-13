import { PrivateKey, Transaction } from 'src/libcash/primitives/index.js';
import { EventEmitter } from 'src/libcash/utils/index.js';
import { type AddressListUnspent } from 'src/services/electrum-types';
import { ElectrumService } from 'src/services/electrum';

import {
  type CompilerBCH,
  type CompilationData,
  type InputTemplate,
} from '@bitauth/libauth';

export type InputTemplateBCH = InputTemplate<
  CompilerBCH,
  false,
  CompilationData
>;

export abstract class WalletBase extends PrivateKey {
  // Dependencies/Services
  public electrum: ElectrumService;

  constructor(privateKeyBytes: Uint8Array, electrum: ElectrumService) {
    super(privateKeyBytes);
    this.electrum = electrum;
  }

  abstract startMonitoring(): Promise<void>;

  abstract stopMonitoring(): Promise<void>;

  abstract getAddress(): string;

  abstract fetchHistory(): Promise<Array<Transaction>>;

  abstract fetchUnspentOutputs(): Promise<AddressListUnspent['response']>;

  abstract getUnspentDirectives(): Promise<Array<InputTemplateBCH>>;

  async refresh(): Promise<void> {
    await Promise.all([this.fetchUnspentOutputs(), this.fetchHistory()]);
  }

  async onAddressNotification(status: string | null) {
    // If status is null, it simply means that our subscribe call to Electrum was successful.
    if (!status) {
      return;
    }

    // Refresh our wallet's state.
    await this.refresh();
  }
}
