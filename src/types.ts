export interface TemplateV1 {
  version: 1;
  uuid: string;
  label: string;
  front: string;
  back: string;
  style: string;
  readonly: boolean;
}

export interface TemplateV2 {
  version: 2;
  uuid: string;
  label: string;
  front: string;
  back: string;
  style: string;
  readonly: boolean;
}

export type Template = TemplateV1 | TemplateV2;

export type TemplateData = { [key: string]: string };

export type StampCollection = {
  version: 3;
  mnemonic: string;
  name: string;
  amount: number;
  currency: string;
  quantity: number;
  expiry: string;
  templateUUID?: string;
  templateData?: TemplateData;
};

export type CashPayServer_Output = {
  address?: string;
  amount: number | string;
  script?: string;
};

export type CashPayServer_Webhook = {
  [key: string]: string;
};

export type CashPayServer_Totals = {
  nativeTotal: number;
  userCurrencyTotal: number;
};

export type CashPayServer_Service = {
  paymentURI: string;
  walletURI: string;
  webSocketURI: string;
};

export type CashPayServer_InvoiceOptions = {
  endpoint: string;
  listen: boolean;
  on: {
    [key: string]: Function[];
  };
  socket: any;
  expiryTimer: any;
};

export type CashPayServer_Invoice = {
  id: string;
  outputs: CashPayServer_Output[];
  network: string;
  expires: number;
  memo: string;
  memoPaid: string;
  merchantData: string;
  apiKey: string;
  data: string;
  privateData: string;
  userCurrency: string;
  webhook: CashPayServer_Webhook;
  _id: string;
  totals: CashPayServer_Totals;
  service: CashPayServer_Service;
  currency: string;
  _instance: CashPayServer_InvoiceOptions;

  on(events: string | string[], callback: Function): CashPayServer_Invoice;
  addAddress(address: string, amount: string | number): CashPayServer_Invoice;
  addOutput(script: string, amount?: number): CashPayServer_Invoice;
  setNetwork(network: string): CashPayServer_Invoice;
  setExpires(seconds: number): CashPayServer_Invoice;
  setMemo(memo: string): CashPayServer_Invoice;
  setMemoPaid(memoPaid: string): CashPayServer_Invoice;
  setMerchantData(base64: string): CashPayServer_Invoice;
  setAPIKey(key: string): CashPayServer_Invoice;
  setData(data: string | object): CashPayServer_Invoice;
  setPrivateData(data: string | object): CashPayServer_Invoice;
  setUserCurrency(currency: string): CashPayServer_Invoice;
  setWebhook(
    endpoint: string,
    events?: string | string[]
  ): CashPayServer_Invoice;
  create(): Promise<CashPayServer_Invoice>;
  createFrom(
    endpoint: string,
    params?: object,
    options?: object
  ): Promise<void>;
  createFromExisting(invoice: object): Promise<void>;
  payload(): object;
  destroy(): Promise<void>;
  intoContainer(
    container: HTMLElement,
    options?: {
      template?: string;
      lang?: {
        expiresIn?: string;
        invoiceHasExpired?: string;
      };
      destroyOnRemoved?: boolean;
    }
  ): CashPayServer_Invoice;
};
