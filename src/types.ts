import { z } from 'zod/v4';

export const TemplateV1Schema = z.object({
  version: z.literal(1),
  uuid: z.string(),
  label: z.string(),
  front: z.string(),
  back: z.string(),
  style: z.string(),
  variables: z.string().default('{}'),
  readonly: z.boolean(),
});
export type TemplateV1 = z.infer<typeof TemplateV1Schema>;

export const TemplateV2Schema = z.object({
  version: z.literal(2),
  uuid: z.string(),
  label: z.string(),
  front: z.string(),
  back: z.string(),
  style: z.string(),
  variables: z.string().default('{}'),
  readonly: z.boolean(),
});
export type TemplateV2 = z.infer<typeof TemplateV2Schema>;

// discriminatedUnion is preferable to union here since `version` is the tag
export const TemplateSchema = z.discriminatedUnion('version', [
  TemplateV1Schema,
  TemplateV2Schema,
]);
export type Template = z.infer<typeof TemplateSchema>;

const TemplateVariableEntrySchema = z.object({
  label: z.string(),
  type: z.enum(['color', 'hidden', 'image', 'string', 'text']),
  value: z.string(),
  hint: z.string().optional(),
});

export const TemplateVariablesSchema = z.record(
  z.string(),
  z.record(
    z.string(),
    z.union([
      TemplateVariableEntrySchema,
      z.record(z.string(), TemplateVariableEntrySchema),
    ])
  )
);
export type TemplateVariables = z.infer<typeof TemplateVariablesSchema>;

//-----------------------------------------------------------------------------
// Stamp Collection
//-----------------------------------------------------------------------------

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

//-----------------------------------------------------------------------------
// CashPayServer Types
// TODO: These should come from CashPayServer itself, but alas, it's JS, not TS.
//       Maybe split this out into own file if Jim doesn't get his shit together.
//-----------------------------------------------------------------------------

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
    [key: string]: any;
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

  on(events: string | string[], callback: any): CashPayServer_Invoice;
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
