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
