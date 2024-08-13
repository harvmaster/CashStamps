import { Address } from './address.js';

import {
  binToHex,
  hexToBin,
  isHex,
  secp256k1,
  sha256,
  ripemd160,
} from '@bitauth/libauth';

/**
 * Public Key Entity.
 */
export class PublicKey {
  // The raw bytes representing the Public Key.
  public readonly bytes: Uint8Array;

  /**
   * Construct a new Public Key.
   *
   * @param bytes {Uint8Array} The raw bytes (33) for the Public Key.
   */
  constructor(bytes: Uint8Array) {
    // Ensure that exactly 33 Bytes are given.
    if (!secp256k1.validatePublicKey(bytes)) {
      throw new Error(`Invalid Public Key.`);
    }

    this.bytes = bytes;
  }

  /**
   * Create a Public Key entity from the given hexadecimal string.
   *
   * @param publicKeyHex {string} Hexadecimal encoding of the Public Key bytes.
   *
   * @throws {Error} If Public Key cannot be created.
   *
   * @returns {PublicKey} The created Public Key entity.
   */
  public static fromHex(publicKeyHex: string): PublicKey {
    // Ensure that the given string is hex.
    if (!isHex(publicKeyHex)) {
      throw new Error(
        `The given string (${publicKeyHex}) is not valid hexadecimal.`
      );
    }

    // Convert the hex to binary (Uint8Array).
    const publicKey = hexToBin(publicKeyHex);

    // Create a Public Key Entity from the binary.
    return new PublicKey(publicKey);
  }

  /**
   * Derive the Hash160 for this Public Key.
   *
   * @returns {Uint8Array} The Hash160 of the Public Key.
   */
  public deriveHash160(): Uint8Array {
    // SHA256 Hash the public key.
    const sha256Hash = sha256.hash(this.bytes);

    // RIPEMD160 the SHA256 hash.
    const ripemd160Hash = ripemd160.hash(sha256Hash);

    // And then return it.
    return ripemd160Hash;
  }

  /**
   * Derive the Hash160 as Hex for this Public Key.
   *
   * @returns {string} The Hash160 of the Public Key as hex.
   */
  public deriveHash160Hex(): string {
    const hash160Bytes = this.deriveHash160();

    return binToHex(hash160Bytes);
  }

  /**
   * Derive the Address for this Public Key.
   *
   * @returns {Address} The Address for this Public Key.
   */
  public deriveAddress(): Address {
    // Get the RIPEMD160 Hash of the Public Key.
    const ripemd160Hash = this.deriveHash160();

    // Return an instance of address
    return Address.fromHash160(ripemd160Hash, 'P2PKH');
  }

  /**
   * Verify that a compact message hash was signed with the corresponding Private Key.
   *
   * @param messageHash {Uint8Array} The hash of the message.
   * @param signature   {Uint8Array) The signature of the message.
   *
   * @returns {boolean} True if signature and message hash verifies, false otherwise..
   */
  public verifyMessageHashCompact(
    messageHash: Uint8Array,
    signature: Uint8Array
  ): boolean {
    const validity = secp256k1.verifySignatureCompact(
      signature,
      this.bytes,
      messageHash
    );

    return validity;
  }

  /**
   * Verify that a DER message hash was signed with the corresponding Private Key.
   *
   * @param messageHash {Uint8Array} The hash of the message.
   * @param signature   {Uint8Array) The signature of the message.
   *
   * @returns {boolean} True if signature and message hash verifies, false otherwise..
   */
  public verifyMessageHashDER(
    messageHash: Uint8Array,
    signature: Uint8Array
  ): boolean {
    const validity = secp256k1.verifySignatureDER(
      signature,
      this.bytes,
      messageHash
    );

    return validity;
  }

  /**
   * Verify that a Schnorr message hash was signed with the corresponding Private Key.
   *
   * @param messageHash {Uint8Array} The hash of the message.
   * @param signature   {Uint8Array) The signature of the message.
   *
   * @returns {boolean} True if signature and message hash verifies, false otherwise..
   */
  public verifyMessageHashSchnorr(
    messageHash: Uint8Array,
    signature: Uint8Array
  ): boolean {
    const validity = secp256k1.verifySignatureSchnorr(
      signature,
      this.bytes,
      messageHash
    );

    return validity;
  }

  /**
   * Encode the raw bytes of this Public Key to a hexadecimal representation.
   *
   * @returns {string} The raw bytes Public Key encoded as Hexadecimal.
   */
  public toHex(): string {
    return binToHex(this.bytes);
  }

  /**
   * Get the raw bytes of this Public Key.
   *
   * @returns {Uint8Array} The raw bytes of the Public Key.
   */
  public toBytes(): Uint8Array {
    // Return the raw bytes for this Public Key.
    return this.bytes;
  }

  /**
   * Return the hexadecimal representation of the raw bytes of the Public Key.
   *
   * @returns {string} The raw bytes of the Public Key as hexadecimal.
   */
  public toString(): string {
    // Return the raw Public Key byes encoded as a hexadecimal string.
    return this.toHex();
  }
}
