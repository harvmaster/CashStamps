import { ElectrumService } from 'src/services/electrum.js';

export type ServiceConfig<BlockchainType, WalletType> = {
  createBlockchain: () => BlockchainType;
  createWallet: (
    privateKeyBytes: Uint8Array,
    electrum: ElectrumService
  ) => WalletType;
};
