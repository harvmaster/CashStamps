export type Wallet = {
  // address: string;
  // privateKey: string;
  funding: {
    amount: number;
    currency: string;
    funded: boolean;
  }
  wif: string;
  create_date: string;
}