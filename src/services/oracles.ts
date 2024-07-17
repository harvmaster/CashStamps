import { OracleClient } from 'src/utils/oracle-client.js';
import {
  OracleClientMetadata,
  OracleClientMetadataEvent,
  OracleClientPriceMessage,
  OracleClientPriceMessageEvent,
} from 'src/utils/oracle-client-types.js';

import { reactive } from 'vue';

import { OracleUnits } from '@generalprotocols/price-oracle';
import { binToHex } from '@bitauth/libauth';

// Interface to store Metadata for each Oracle.
export interface OracleMetadataStore {
  [oraclePublicKey: string]: OracleClientMetadata;
}

// Interface to store latest Price Message for each Oracle.
export interface OraclePriceStore {
  [oraclePublicKey: string]: OracleClientPriceMessage;
}

export class OraclesService {
  // The Oracle Client.
  readonly oracleClient: OracleClient;

  // The stores for our metadata and latest Price Messages.
  readonly oracleMetadataStore: OracleMetadataStore;
  readonly oraclePriceStore: OraclePriceStore;
  readonly oraclePriceCache: { [key: string]: number } = {};

  constructor(serviceUrl: string, oraclePublicKeys: Array<string>) {
    // Initialize our stores (and make them reactive).
    this.oracleMetadataStore = reactive({});
    this.oraclePriceStore = reactive({});

    // Instantiate our OracleClient with the given Service URL and Oracle Public Keys.
    this.oracleClient = new OracleClient(serviceUrl, oraclePublicKeys);

    // Setup hooks so that our stores update when we receive metadata and Price Messages.
    this.oracleClient.on('metadata', this.handleMetadataMessage.bind(this));
    this.oracleClient.on('priceMessage', this.handlePriceMessage.bind(this));
  }

  async start(): Promise<void> {
    // Sync on startup so that our Stores are populated and subscribe to Oracle SSE events.
    const syncOnStartup = true;
    const subscribeToEvents = true;

    // Start our Oracle Client.
    await this.oracleClient.start(syncOnStartup, subscribeToEvents);
  }

  getOracleIcon(
    oraclePublicKey: string | Uint8Array,
    type: 'numerator' | 'denominator' = 'denominator'
  ) {
    if (!oraclePublicKey) {
      return 'img:oracles/bch.png';
    }

    const oraclePublicKeyHex =
      oraclePublicKey instanceof Uint8Array
        ? binToHex(oraclePublicKey)
        : oraclePublicKey;

    const oracle = this.oracleMetadataStore[oraclePublicKeyHex];

    const unitCode =
      type === 'numerator'
        ? oracle.sourceNumeratorUnitCode
        : oracle.sourceDenominatorUnitCode;

    return `/oracles/${unitCode.toLowerCase()}.png`;
  }

  getOracleUnitCode(
    oraclePublicKey: string | Uint8Array,
    type: 'numerator' | 'denominator' = 'denominator'
  ) {
    const oraclePublicKeyHex =
      oraclePublicKey instanceof Uint8Array
        ? binToHex(oraclePublicKey)
        : oraclePublicKey;

    const oracle = this.oracleMetadataStore[oraclePublicKeyHex];

    const unitCode =
      type === 'numerator'
        ? oracle.sourceNumeratorUnitCode
        : oracle.sourceDenominatorUnitCode;

    return unitCode;
  }

  getOracleSymbol(oraclePublicKey: string | Uint8Array) {
    const oraclePublicKeyHex =
      oraclePublicKey instanceof Uint8Array
        ? binToHex(oraclePublicKey)
        : oraclePublicKey;

    switch(oraclePublicKeyHex) {
      // USD
      case '02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818': return '$';
      // EUR
      case '02bb9b3324df889a66a57bc890b3452b84a2a74ba753f8842b06bba03e0fa0dfc5': return '€';
      // AUD
      case '034e1d3be2ee29b3d9e53b354b09d9a5a2803c568d8c6520bc72d97494c9a100c2': return '$';
      // INR
      case '02e82ad82eb88fcdfd02fd5e2e0a67bc6ef4139bbcb63ce0b107a7604deb9f7ce1': return '₹';
      // CNY
      case '030654b9598186fe4bc9e1b0490c6b85b13991cdb9a7afa34af1bbeee22a35487a': return '¥';
    }

    return '';
  }

  getOracleScalingFactor(oraclePublicKey: string | Uint8Array) {
    const oraclePublicKeyHex =
      oraclePublicKey instanceof Uint8Array
        ? binToHex(oraclePublicKey)
        : oraclePublicKey;

    const oracle = this.oracleMetadataStore[oraclePublicKeyHex];

    return oracle.attestationScaling;
  }

  getOraclePriceOracleUnits(oraclePublicKey: string | Uint8Array) {
    const oraclePublicKeyHex =
      oraclePublicKey instanceof Uint8Array
        ? binToHex(oraclePublicKey)
        : oraclePublicKey;

    const oracleMetaData = this.oracleMetadataStore[oraclePublicKeyHex];
    const oraclePriceMessage = this.oraclePriceStore[oraclePublicKeyHex];

    const oracleUnits = new OracleUnits(
      oraclePriceMessage.parsedPriceMessage.priceValue,
      oracleMetaData.attestationScaling
    );

    return oracleUnits.toOracleUnits();
  }

  getOraclePriceCommonUnits(oraclePublicKey: string | Uint8Array) {
    const oraclePublicKeyHex =
      oraclePublicKey instanceof Uint8Array
        ? binToHex(oraclePublicKey)
        : oraclePublicKey;

    const oracleMetaData = this.oracleMetadataStore[oraclePublicKeyHex];
    const oraclePriceMessage = this.oraclePriceStore[oraclePublicKeyHex];

    const oracleUnits = new OracleUnits(
      oraclePriceMessage.parsedPriceMessage.priceValue,
      oracleMetaData.attestationScaling
    );

    return Number(oracleUnits.toCommonUnits().toFixed(2));
  }

  toOracleUnits(
    priceInCommonUnits: number | bigint,
    oraclePublicKey: string | Uint8Array
  ) {
    const oraclePublicKeyHex =
      oraclePublicKey instanceof Uint8Array
        ? binToHex(oraclePublicKey)
        : oraclePublicKey;

    const oracleMetaData = this.oracleMetadataStore[oraclePublicKeyHex];

    return Math.round(
      Number(priceInCommonUnits) * oracleMetaData.attestationScaling
    );
  }

  toCommonUnits(
    priceInOracleUnits: number | bigint,
    oraclePublicKey: string | Uint8Array,
    decimals = 2
  ) {
    const oraclePublicKeyHex =
      oraclePublicKey instanceof Uint8Array
        ? binToHex(oraclePublicKey)
        : oraclePublicKey;

    const oracleMetaData = this.oracleMetadataStore[oraclePublicKeyHex];

    // TODO: Consider rounding properly.
    //       toFixed will just truncate.
    return Number(
      (Number(priceInOracleUnits) / oracleMetaData.attestationScaling).toFixed(
        decimals
      )
    );
  }

  // Get the price from the Oracle with the given public key and timestamp.
  async getPrice(oraclePublicKey: string | Uint8Array, timestamp?: number) {
    const oraclePublicKeyHex =
      oraclePublicKey instanceof Uint8Array
        ? binToHex(oraclePublicKey)
        : oraclePublicKey;

    // Fetch price message from the Oracle with a max timestamp of the given timestamp.
    const { parsedPriceMessage } = await this.oracleClient.getPrice(
      oraclePublicKeyHex,
      {
        maxMessageTimestamp: timestamp,
        // minMessageTimestamp: (timestamp || 0) - 60 * 60 * 1
      }
    );

    // Convert the price to common units.
    const price = this.toCommonUnits(
      parsedPriceMessage.priceValue,
      oraclePublicKeyHex
    );

    // Return the parsed price message
    return price;
  }

  async convertCurrency(
    currencyPublicKey: string,
    amount: number,
    timestamp?: number
  ): Promise<number> {
    // Return the amount if the currency is BCH (its already in BCH)
    if (currencyPublicKey === 'BCH') return amount;

    // Return the latest conversion rate if no timestamp is provided
    if (!timestamp) {
      const rate = this.getOraclePriceCommonUnits(currencyPublicKey);
      return amount * rate;
    }

    // Convert the timestamp to seconds
    timestamp = Math.floor(timestamp / 1000);

    // Check the cache for the conversion rate
    const key = `${currencyPublicKey}-${timestamp}`;
    if (this.oraclePriceCache[key]) return amount * this.oraclePriceCache[key];

    // Fetch the conversion rate from the Oracle
    const rate = await this.getPrice(currencyPublicKey, timestamp);
    if (!rate) throw new Error('Failed to fetch conversion rate');

    // Store the conversion rate in the cache
    this.oraclePriceCache[key] = rate;

    // Return the converted amount
    return amount * rate;
  }

  handleMetadataMessage(metadataEvent: OracleClientMetadataEvent): void {
    // Save the metadata to our store.
    this.oracleMetadataStore[metadataEvent.oraclePublicKey] =
      metadataEvent.metadata;
  }

  handlePriceMessage(priceMessageEvent: OracleClientPriceMessageEvent): void {
    // Save the price message to our store.
    this.oraclePriceStore[priceMessageEvent.oraclePublicKey] =
      priceMessageEvent;
  }
}
