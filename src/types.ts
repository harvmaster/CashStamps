export type Wallet = {
  address: string;
  privateKey: string;
  value: {
    amount: number;
    currency: string;
  }
  wif: string;
  create_date: string;
}