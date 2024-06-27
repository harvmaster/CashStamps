// TODO: This code should be shifted to the Oracle Library.
//       See: https://gitlab.com/GeneralProtocols/priceoracle/library/-/issues/79

// Import Oracle Library.
import type {
  PriceMessage,
  OracleProtocol,
  SignedOracleMessage,
} from '@generalprotocols/price-oracle';

/**
 * Response entry for the Oracle Messages (/v1/oracleMessages) endpoint.
 */
export interface OracleRelayMessageEntry {
  /** The message encoded as a hexadecimal string. */
  message: string;

  /** The public key of the Oracle encoded as a hexadecimal string. */
  publicKey: string;

  /** The signature encoded as a hexadecimal string. */
  signature: string;
}

/**
 * Response typing for the Oracle Messages (/v1/oracleMessages) endpoint.
 */
export interface OracleRelayMessagesResponse {
  /** Array of Oracle Message Entries. */
  oracleMessages: Array<OracleRelayMessageEntry>;
}

/**
 * Response typing for the Oracle Metadata (/v1/oracleMetadata) endpoint.
 */
export interface OracleRelayMetadataResponse {
  /** Array of Oracle Message Entries. */
  oracleMetadata: Array<OracleRelayMessageEntry>;
}

/**
 * The payload we receive from our Oracle SSE Message (/sse/v1/messages) endpoint.
 */
export interface OracleRelaySseMessagePayload {
  /** The message encoded as a hexadecimal string. */
  message: string;

  /** The signature encoded as a hexadecimal string. */
  signature: string;
}

/**
 * Draft Oracle Metadata Interface.
 */
export interface OracleClientMetadata {
  startingTimestamp: number;
  endingTimestamp: number;
  sourceNumeratorUnitName: string;
  sourceNumeratorUnitCode: string;
  sourceDenominatorUnitName: string;
  sourceDenominatorUnitCode: string;
  attestationScaling: number;
}

export interface OracleClientMetadataEvent {
  oraclePublicKey: string;
  metadata: OracleClientMetadata;
}

export interface OracleClientPriceMessage {
  signedPriceMessage: SignedOracleMessage;
  parsedPriceMessage: PriceMessage;
}

export interface OracleClientPriceMessageEvent
  extends OracleClientPriceMessage {
  oraclePublicKey: string;
}

export interface OracleClientFilter {
  count?: number;
  minMessageTimestamp?: number;
  maxMessageTimestamp?: number;
  minMessageSequence?: number;
  maxMessageSequence?: number;
  minDataSequence?: number;
  maxDataSequence?: number;
  minMetadataType?: number;
  maxMetadataType?: number;
}

// TODO: This is clunky. We should probably define something in the library to make it so we do not need to do this
export type OracleProtocolMetadataTypes =
  keyof typeof OracleProtocol.METADATA_TYPES;
