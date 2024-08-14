import { PublicKey } from './public-key.js';

import {
  binToHex,
  decodePrivateKeyWif,
  encodePrivateKeyWif,
  generatePrivateKey,
  hexToBin,
  isHex,
  binToUtf8,
  utf8ToBin,
  bigIntToCompactUint,
  secp256k1,
  sha256,
} from '@bitauth/libauth';

import type {
  RecoverableSignature,
  WalletImportFormatType,
} from '@bitauth/libauth';

/**
 * Private Key entity.
 */
export class PrivateKey {
  // The raw bytes representing the Private Key.
  public readonly bytes: Uint8Array;

  /**
   * Construct a new Private Key.
   *
   * @throws {Error} If Private Key cannot be constructed.
   *
   * @param bytes {Uint8Array} The raw bytes (32) for the Private Key.
   */
  constructor(bytes: Uint8Array) {
    // Ensure that the Private Key is valid.
    if (!secp256k1.validatePrivateKey(bytes)) {
      throw new Error(
        `Private Key is invalid: Must be >= 0x01 and <= 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140.`
      );
    }

    this.bytes = bytes;
  }

  /**
   * Create a Private Key Entity from the given bytes (as hexadecimal string).
   *
   * @param privateKeyHex {string} Raw Private Key bytes encoded as hexadecimal string.
   *
   * @throws {Error} If Private Key could not be created.
   *
   * @returns {PrivateKey} The created Private Key Entity.
   */
  public static fromHex(privateKeyHex: string): PrivateKey {
    // Ensure that the given string is hex.
    if (!isHex(privateKeyHex)) {
      throw new Error(
        `The given string (${privateKeyHex}) is not valid hexadecimal.`
      );
    }

    // Convert the hex to binary (Uint8Array).
    const privateKeyBin = hexToBin(privateKeyHex);

    // Create a Private Key Entity from the binary.
    return new PrivateKey(privateKeyBin);
  }

  /**
   * Create a Private Key from a given WIF (Note that the network information from the WIF will be lost).
   *
   * @throws {Error} If Private Key cannot be created.
   *
   * @returns {PrivateKey} The Private Key
   */
  public static fromWIF(
    wif: string,
    supportedPrefixes = ['bitcoincash:']
  ): PrivateKey {
    // Remove the prefixes from the WIF (if they exist).
    const wifWithoutPrefixes = supportedPrefixes.reduce((result, prefix) => {
      return result.startsWith(prefix) ? result.slice(prefix.length) : result;
    }, wif);

    // Attempt to decode the WIF.
    const decodeResult = decodePrivateKeyWif(wifWithoutPrefixes);

    // If a string is returned, this indicates an error...
    if (typeof decodeResult === 'string') {
      throw new Error(decodeResult);
    }

    // Return a new Private Key entity.
    return new PrivateKey(decodeResult.privateKey);
  }

  /**
   * Generate a random Private Key.
   *
   * @returns {PrivateKey} The randomly generated Private Key
   */
  public static generateRandom(): PrivateKey {
    const bytes = generatePrivateKey();

    return new PrivateKey(bytes);
  }

  /**
   * Derive the public key from this private key.
   *
   * @throws {Error} If Public Key cannot be derived.
   *
   * @returns {PublicKey} The derived Public Key.
   */
  public derivePublicKey(): PublicKey {
    // Attempt to derive the public key.
    const deriveResult = secp256k1.derivePublicKeyCompressed(this.bytes);

    // If a string is returned, this indicates an error...
    if (typeof deriveResult === 'string') {
      throw new Error(deriveResult);
    }

    // Return the derived Public Key.
    return new PublicKey(deriveResult);
  }

  /**
   * Sign a message hash with this Private Key using a Recoverable Compact Signature.
   *
   * @param messageHash {Uint8Array} The hash of the message.
   *
   * @throws {Error} If message hash cannot be signed.
   *
   * @returns {Uint8Array} The generated signature.
   */
  public signMessageHashRecoverableCompact(
    messageHash: Uint8Array
  ): RecoverableSignature {
    // Attempt to sign the message.
    const signResult = secp256k1.signMessageHashRecoverableCompact(
      this.bytes,
      messageHash
    );

    // If a string is returned, this indicates an error...
    if (typeof signResult === 'string') {
      throw new Error(signResult);
    }

    // Return the signature.
    return signResult;
  }

  /**
   * Sign a message hash with this Private Key using a Compact Signature.
   *
   * @param messageHash {Uint8Array} The hash of the message.
   *
   * @throws {Error} If message hash cannot be signed.
   *
   * @returns {Uint8Array} The generated signature.
   */
  public signMessageHashCompact(messageHash: Uint8Array): Uint8Array {
    // Attempt to sign the message.
    const signResult = secp256k1.signMessageHashCompact(
      this.bytes,
      messageHash
    );

    // If a string is returned, this indicates an error...
    if (typeof signResult === 'string') {
      throw new Error(signResult);
    }

    // Return the signature.
    return signResult;
  }

  /**
   * Sign a message hash with this Private Key using a Schnorr Signature.
   *
   * @param messageHash {Uint8Array} The hash of the message.
   *
   * @throws {Error} If message hash cannot be signed.
   *
   * @returns {Uint8Array} The generated signature.
   */
  public signMessageHashSchnorr(messageHash: Uint8Array): Uint8Array {
    // Attempt to sign the message.
    const signResult = secp256k1.signMessageHashSchnorr(
      this.bytes,
      messageHash
    );

    // If a string is returned, this indicates an error...
    if (typeof signResult === 'string') {
      throw new Error(signResult);
    }

    // Return the signature.
    return signResult;
  }

  /**
   * Sign a message hash with this Private Key using a DER Signature.
   *
   * @param messageHash {Uint8Array} The hash of the message.
   *
   * @throws {Error} If message hash cannot be signed.
   *
   * @returns {Uint8Array} The generated signature.
   */
  public signMessageHashDER(messageHash: Uint8Array): Uint8Array {
    const signResult = secp256k1.signMessageHashDER(this.bytes, messageHash);

    // If a string is returned, this indicates an error...
    if (typeof signResult === 'string') {
      throw new Error(signResult);
    }

    // Return the signature.
    return signResult;
  }

  /**
   * Sign a message hash with this Private Key using an Electron Cash Signature.
   *
   * This applies the Bitcoin and Electron Magic Bytes.
   *
   * NOTE: Electron can verify this message successfully, but generates them differently internally.
   *
   * @param messageHash {Uint8Array} The hash of the message.
   *
   * @throws {Error} If message hash cannot be signed.
   *
   * @returns {Uint8Array} The generated signature.
   */
  public signMessageElectron(message: string): Uint8Array {
    // Compile the message.
    const magicBytes = utf8ToBin('\x18Bitcoin Signed Message:\n');
    const messageBytes = utf8ToBin(message);
    const messageLengthBytes = bigIntToCompactUint(BigInt(messageBytes.length)); // hexToBin(messageBytes.length.toString(16)); //
    const messageFinal = new Uint8Array([
      ...magicBytes,
      ...messageLengthBytes,
      ...messageBytes,
    ]);

    // Hash the message.
    // NOTE: That we hash256 (2 x sha256) the message.
    const messageHash = sha256.hash(sha256.hash(messageFinal));

    // Use Recoverable Compact Signature.
    const signature = this.signMessageHashRecoverableCompact(messageHash);

    // Apply Electon encoding.
    const electronEncoding = new Uint8Array([
      ...[31 + signature.recoveryId],
      ...signature.signature,
    ]);

    // Return the signature.
    return electronEncoding;
  }

  /**
   * Convert the raw bytes of this Private Key to hexadecimal encoding.
   *
   * @returns {string} The raw bytes of the Private Key as a hexadecimal string.
   */
  public toHex(): string {
    // Return the hexadecimal encoded bytes  of this Private Key.
    return binToHex(this.bytes);
  }

  /**
   * Convert this Private Key to a raw 32 byte representation.
   *
   * @returns {Uint8Array} The raw Private Key as a Uint8Array.
   */
  public toBytes(): Uint8Array {
    // Return the raw bytes for this Private Key.
    return this.bytes;
  }

  /**
   * Convert this Private Key to a WIF format.
   *
   * @param type {WalletImportFormatType} The type of WIF to create.
   *
   * @returns {string} The Private Key in WIF format.
   */
  public toWif(type: WalletImportFormatType = 'mainnet'): string {
    // Return the encoded Private Key WIF.
    return encodePrivateKeyWif(this.bytes, type);
  }

  /**
   * Returns the Private Key as a mainnet WIF.
   *
   * @returns {string} The Private Key as a mainnet WIF.
   */
  public toString(): string {
    // Return the encoded Mainnet Private Key WIF.
    return this.toWif();
  }
}
