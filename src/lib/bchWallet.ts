// bchWallet.ts
// import { generatePrivateKey, deriveHdPublicKey, encodeCashAddress, CashAddressNetworkPrefix } from '@bitauth/libauth';

// export interface Wallet {
//   address: string;
//   privateKey: string;
// }
import { Wallet } from 'src/types';

export async function generateWallet(): Promise<Wallet> {
  //   // const privateKey = generatePrivateKey();
  //   // const publicKeyHash = await deriveHdPublicKey(privateKey.toString());
  //   // const address = encodeCashAddress({ payload: publicKeyHash, prefix: CashAddressNetworkPrefix.testnet });

  //   // return {
  //   //   address,
  //   //   privateKey: privateKey.toString('hex')
  //   // };

  return Promise.resolve({
    address: 'bchtest:qz2k6z4y0j7qz2k6z4y0j7qz2k6z4y0j7qz2k6z4y0j',
    privateKey: 'cVJ92k6z4y0j7z2k6z4y0j76z4y0j7qz2k6z',
    wif: 'cVJ92k6z4y0j7z2k6z4y0j76z4y0j7qz2k6z',
    value: 0,
  });
}

// import { encodePrivateKeyWif, generatePrivateKey, instantiateSha256, privateKeyToP2pkhCashAddress } from '@bitauth/libauth';
// import { Wallet } from 'src/types';

// export async function generateWallet(): Promise<Wallet> {
//   const privateKey = generatePrivateKey();
//   const { address } = privateKeyToP2pkhCashAddress({ privateKey })
//   const wif = await getWif(privateKey)

//   return {
//     address: address,
//     privateKey: privateKey.toString(),
//     wif,
//     value: 0
//   };
// }

// export const getWif = async (privateKey: Uint8Array) => {
//   const sha256 = await instantiateSha256()
//   const wif = encodePrivateKeyWif(privateKey, 'testnet', sha256)

//   return wif
// }
