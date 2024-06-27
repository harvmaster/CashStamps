// TODO: Clean me up and then create an MR for @generalprotocols/price-oracle to add this.
//       It will be generally useful for other implementers.

import type {
  OracleProtocolMetadataTypes,
  OracleClientMetadata,
  OracleClientMetadataEvent,
  OracleClientPriceMessage,
  OracleClientPriceMessageEvent,
  OracleRelayMessageEntry,
  OracleRelayMessagesResponse,
  OracleRelayMetadataResponse,
  OracleRelaySseMessagePayload,
  OracleClientFilter,
} from './oracle-client-types.js';

// Import Oracle Library.
import {
  OracleData,
  OracleProtocol,
  SignedOracleMessage,
} from '@generalprotocols/price-oracle';

// Import utility functions to handle bitcoin cash data structures from libauth.
import { hexToBin } from '@bitauth/libauth';

import { EventEmitter } from 'events';
import EventSourcePolyfill from '@sanity/eventsource';

export class OracleClient extends EventEmitter {
  // SSE socket to use if we are listening for new Oracle Messages.
  public sseSocket?: EventSource;

  constructor(
    public readonly serviceUrl: string,
    public readonly oraclePublicKeys: Array<string>
  ) {
    super();

    // NOTE: If we are in a browser environment, we have to manage the SSE connection.
    //       Many (most?) browsers will kill connections when tab visibility changes.
    if (globalThis.document) {
      globalThis.document.addEventListener(
        'visibilitychange',
        this.handleBrowserConnection.bind(this)
      );
    }
  }

  async start(syncLatest = true, subscribeToMessages = true): Promise<void> {
    // Declare an array of Promises to store our fetch and store of Metadata and Price messages .
    const startPromises = [];

    if (syncLatest) {
      // Fetch the initial metadata and price for each of our Oracles.
      for (const oraclePublicKey of this.oraclePublicKeys) {
        // Add Promise to fetch and store the metadata messages for this public key.
        startPromises.push(
          (async () => {
            const metadata = await this.getMetadata(oraclePublicKey);
            this.emit('metadata', {
              oraclePublicKey,
              metadata,
            });
          })()
        );

        // Add Promise to Fetch and store the price messages for this public key.
        startPromises.push(
          (async () => {
            const priceMessage = await this.getPrice(oraclePublicKey);
            this.emit('priceMessage', {
              oraclePublicKey,
              ...priceMessage,
            });
          })()
        );
      }
    }

    // If we should subscribe to Oracle Messages (i.e. updates to Prices or Metadata)...
    if (subscribeToMessages) {
      // Add promise to subscribe to SSE endpoint to receive new Oracle Messages.
      startPromises.push(this.subscribeToMessages());
    }

    // Return a Promise.all so that we can await completion of our fetch and store operations.
    await Promise.all(startPromises);
  }

  async getMetadata(oraclePublicKey: string): Promise<OracleClientMetadata> {
    // Get the response data as JSON.
    const oracleMetadataResponseData = (await this.fetchFromEndpoint(
      `/api/v1/oracleMetadata?publicKey=${oraclePublicKey}`
    )) as OracleRelayMetadataResponse;

    // Declare an array to store an our Oracle Metadata as Signed Oracle Messages.
    const oracleMetadataMessages: Array<SignedOracleMessage> = [];

    // Iterate through each metadata message.
    for (const message of oracleMetadataResponseData.oracleMetadata) {
      // Convert the response message entry into a Signed Oracle Message.
      const signedOracleMessage =
        await OracleClient.convertToSignedOracleMessage(message);

      // Add this metadata message to our array of Oracle Metadata Messages.
      oracleMetadataMessages.push(signedOracleMessage);
    }

    // If we could not get Metadata messages for the given Oracle Public Key...
    if (!oracleMetadataMessages) {
      throw new Error(`Failed to find any Metadata for ${oraclePublicKey}`);
    }

    // Define a partial of our Oracle Metadata.
    const oracleMetadata: Partial<OracleClientMetadata> = {};

    // Parse our Metadata Messages and store the result in our partial.
    for (const metadataMessage of oracleMetadataMessages) {
      // Parse our cached message so that we can extract the message contents.
      const metadata = await OracleData.parseMetadataMessage(
        metadataMessage.message
      );

      // Look up this Metadata Type by checking for it in our pre-defined METADATA_TYPES.
      const metadataType =
        OracleProtocol.METADATA_TYPES[
          String(metadata.metadataType) as OracleProtocolMetadataTypes
        ];

      if (!metadataType) {
        console.warn(
          `Failed to parse Oracle Metadata for ${oraclePublicKey}: Unrecognized metadata type`
        );

        continue;
      }

      switch (metadataType.name) {
        case 'STARTING_TIMESTAMP':
          oracleMetadata.startingTimestamp = Number(metadata.metadataContent);
          break;
        case 'ENDING_TIMESTAMP':
          oracleMetadata.endingTimestamp = Number(metadata.metadataContent);
          break;
        case 'SOURCE_NUMERATOR_UNIT_NAME':
          oracleMetadata.sourceNumeratorUnitName = metadata.metadataContent;
          break;
        case 'SOURCE_NUMERATOR_UNIT_CODE':
          oracleMetadata.sourceNumeratorUnitCode = metadata.metadataContent;
          break;
        case 'SOURCE_DENOMINATOR_UNIT_NAME':
          oracleMetadata.sourceDenominatorUnitName = metadata.metadataContent;
          break;
        case 'SOURCE_DENOMINATOR_UNIT_CODE':
          oracleMetadata.sourceDenominatorUnitCode = metadata.metadataContent;
          break;
        case 'ATTESTATION_SCALING':
          oracleMetadata.attestationScaling = Number(metadata.metadataContent);
          break;
        // TODO: Handle unsupported param.
        default:
          break;
      }
    }

    // Set the fields that MUST be provded for this Oracle to be considered valid.
    const requiredFields = [
      'sourceNumeratorUnitName',
      'sourceNumeratorUnitCode',
      'sourceDenominatorUnitName',
      'sourceDenominatorUnitCode',
      'attestationScaling',
    ];

    // Iterate through each of the required fields, ensuring that they are set.
    for (const requiredField of requiredFields) {
      // If a required field is undefined...
      if (
        typeof oracleMetadata[requiredField as keyof OracleClientMetadata] ===
        'undefined'
      ) {
        throw new Error('Failed to parse Oracle Metadata');
      }
    }

    // There might be Typescript sugar to do this better (with the required fields above).
    return oracleMetadata as OracleClientMetadata;
  }

  async getPrice(
    oraclePublicKey: string,
    filter?: OracleClientFilter
  ): Promise<OracleClientPriceMessage> {
    const urlParams = new URLSearchParams();
    urlParams.set('publicKey', oraclePublicKey);
    urlParams.set('count', '1');

    if (filter) {
      Object.keys(filter).forEach((key) =>
        urlParams.append(key, (filter as any)[key])
      );
    }

    // Get the response data as JSON.
    const oracleMessagesResponseData = (await this.fetchFromEndpoint(
      `/api/v1/oracleMessages?${urlParams.toString()}`
    )) as OracleRelayMessagesResponse;

    // Ensure that there is one item in the payload received by the endpoint.
    if (oracleMessagesResponseData.oracleMessages.length !== 1) {
      throw new Error(
        `oracleMessages length (${oracleMessagesResponseData.oracleMessages.length}) is not equal to 1.`
      );
    }

    // Get our current Price Message by taking the first item in our our Oracle messages array.
    // NOTE: This endpoint orders Oracle Messages by messageSequence descending (meaning that this will be the latest).
    const oracleMessageEntry = oracleMessagesResponseData.oracleMessages[0];

    // Validate the Oracle Message Response (including signature validation) and convert it to a Signed Oracle Message.
    const signedPriceMessage = await OracleClient.convertToSignedOracleMessage(
      oracleMessageEntry
    );

    // Parse the Price Message.
    const parsedPriceMessage = await OracleData.parsePriceMessage(
      signedPriceMessage.message
    );

    // Store the Signed Price Message.
    return {
      parsedPriceMessage,
      signedPriceMessage,
    };
  }

  async subscribeToMessages(): Promise<void> {
    // Create an event stream for oracle messages.
    this.sseSocket = new EventSourcePolyfill(
      `${this.serviceUrl}/sse/v1/messages`
    ) as EventSource;

    // Invoke our Oracle Event Handler whenever we receive a new Oracle Message for the given Oracle Public Key.
    for (const oraclePublicKey of this.oraclePublicKeys) {
      this.sseSocket.addEventListener(
        oraclePublicKey,
        this.handleOracleMessage.bind(this)
      );
    }

    const waitForConnection = new Promise((resolve, reject): void => {
      // Set a timeout for our connection.
      const connectionTimeout = setTimeout(() => {
        reject(
          new Error(
            'Failed to subscribe to Oracle Events: Connection timed out.'
          )
        );
      }, 10000);

      // Add an event listener for when this connection opens.
      this.sseSocket?.addEventListener('open', () => {
        // Clear the timeout now that we have connected.
        clearTimeout(connectionTimeout);

        // Resolve our promise.
        resolve(true);
      });
    });

    // Wait for Oracle Connection to be opened.
    await waitForConnection;

    this.sseSocket.addEventListener('error', (error: unknown) => {
      // Log the error to the console.
      console.error('OracleClient', error);

      // Attempt to reconnect.
      this.subscribeToMessages();
    });
  }

  async handleOracleMessage(oracleEvent: Event): Promise<void> {
    try {
      // Force event to be interpreted as a MessageEvent.
      const messageEvent = oracleEvent as MessageEvent;

      // Extract the Oracle Public Key from messageEvent.type for legibility.
      const oraclePublicKey = messageEvent.type;

      // Extract the Oracle Payload from our SSE Event data.
      // NOTE: The payload for our SSE message are hexadecimal strings.
      const oracleDataPayload = JSON.parse(
        messageEvent.data
      ) as OracleRelaySseMessagePayload;

      // Convert this message into a Signed Oracle Message and verify the signature.
      const signedOracleMessage =
        await OracleClient.convertToSignedOracleMessage({
          ...oracleDataPayload,
          publicKey: oraclePublicKey,
        });

      // Destructure our Signed Oracle Message for legibility.
      const { message } = signedOracleMessage;

      // Parse the Oracle Message so that we can determine whether it is a Price Message or Metadata Message.
      const parsedOracleMessage = await OracleData.parseOracleMessage(message);

      // If the dataSequenceOrType field is more than or equal to one, this is a Price Message...
      if (parsedOracleMessage.dataSequenceOrType >= 1) {
        // Store the price message.
        this.emit('priceMessage', {
          oraclePublicKey,
          parsedPriceMessage: await OracleData.parsePriceMessage(
            signedOracleMessage.message
          ),
          signedPriceMessage: signedOracleMessage,
        });
      }
      // Otherwise, it is an Oracle Metadata message.
      else {
        console.warn('Ignoring Metadata Message');
      }
    } catch (error) {
      // Log the error, but otherwise do nothing.
      console.warn('Failed to handle oracle message: ', error);
    }
  }

  async fetchFromEndpoint(endpoint: string): Promise<any> {
    // Fetch from our Oracle Messages endpoint.
    const oracleEndpointResponse = await fetch(`${this.serviceUrl}${endpoint}`);

    // If we did not receive a 200 (ok) response, then throw an error...
    if (!oracleEndpointResponse.ok) {
      throw new Error(
        `${endpoint} failed with error: ${oracleEndpointResponse.statusText}`
      );
    }

    // Get the response data as JSON.
    const oracleEndpointResponseData =
      (await oracleEndpointResponse.json()) as OracleRelayMetadataResponse;

    return oracleEndpointResponseData;
  }

  async handleBrowserConnection(): Promise<void> {
    // If there is an SSE Socket...
    if (this.sseSocket) {
      // And the window is visible, then reconnect.
      if (globalThis.document.visibilityState === 'visible') {
        this.subscribeToMessages();
      }
      // Otherwise, if the window is invisible, disconnect.
      else if (document.visibilityState === 'hidden') {
        this.sseSocket.close();
      }
    }
  }

  static async convertToSignedOracleMessage(
    oracleMessageEntry: OracleRelayMessageEntry
  ): Promise<SignedOracleMessage> {
    // Convert the received payload from hex to binary.
    const message = hexToBin(oracleMessageEntry.message);
    const publicKey = hexToBin(oracleMessageEntry.publicKey);
    const signature = hexToBin(oracleMessageEntry.signature);

    // Verify the signature of our Oracle Data Message to ensure it is legitimate.
    const isValidSignature = await OracleData.verifyMessageSignature(
      message,
      signature,
      publicKey
    );

    // If the signature is not valid, then throw an error.
    if (!isValidSignature) {
      // Parse the message so that we can extract the message sequence.
      const { messageSequence } = await OracleData.parseOracleMessage(message);

      // Output error containing full message (in hexadecimal representation)  to console easier debugging.
      console.error(
        `Message #${messageSequence} for Public Key ${oracleMessageEntry.publicKey} has an Invalid Signature.`,
        oracleMessageEntry
      );

      // Throw a clear textual message.
      throw new Error(
        `Message #${messageSequence} for Public Key ${oracleMessageEntry.publicKey} has an Invalid Signature.`
      );
    }

    return { message, publicKey, signature };
  }
}

// NOTE: This defines types for our Oracle Client's Event Emitter.
export declare interface OracleClient {
  on(
    event: 'priceMessage',
    listener: (priceMessage: OracleClientPriceMessageEvent) => void
  ): this;
  on(
    event: 'metadata',
    listener: (metadata: OracleClientMetadataEvent) => void
  ): this;
}
