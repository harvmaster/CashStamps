export type Wallet = {
  address: string;
  privateKey: string;
  value: {
    amount: number;
    denotion: string;
  }
  wif: string;
  create_date: string;
}