import {
  Base58AddressFormatVersion,
  addressContentsToLockingBytecode,
  lockingBytecodeToAddressContents,
  isHex,
  binToHex,
  hexToBin,
  decodeBase58Address,
  decodeCashAddress,
  disassembleBytecodeBCH,
  encodeBase58AddressFormat,
  encodeCashAddress,
  sha256,
  ripemd160,
} from '@bitauth/libauth';

import type { KnownAddressTypeContents } from '@bitauth/libauth';

export type AddressType = 'P2PK' | 'P2PKH' | 'P2SH20' | 'P2SH32';

/**
 * Address Entity.
 */
export class Address {
  public readonly addressContents: KnownAddressTypeContents;

  constructor(addressContents: KnownAddressTypeContents) {
    this.addressContents = addressContents;
  }

  /**
   * Decode a CashAddr into an Address Entity.
   *
   * @param address {string} The CashAddr to decode.
   *
   * @throws {Error} If address cannot be decoded.
   *
   * @returns {Address} Instance of Address.
   *
   * @example
   * const address = Address.fromCashAddr('bitcoincash:qpeqv9k9j3l7fepp9du24f9pr5jdu7c2mvn4wwldav')
   */
  public static fromCashAddr(cashAddr: string): Address {
    // CashAddr
    const decodeResult = decodeCashAddress(cashAddr);

    // If a string is returned, this indicates an error...
    if (typeof decodeResult === 'string') {
      throw new Error(decodeResult);
    }

    // Define the encode type in advance.
    let encodeType: AddressType;

    // Determine the encoding to use based on the Decoding Result's Type.
    switch (decodeResult.type) {
      case 'p2pkh':
        encodeType = 'P2PKH';
        break;
      case 'p2sh':
        encodeType = decodeResult.payload.length === 32 ? 'P2SH32' : 'P2SH20';
        break;
      default:
        throw new Error(`Unsupported address type: ${decodeResult.type}`);
    }

    // Return new instance of address.
    return new Address({ payload: decodeResult.payload, type: encodeType });
  }

  /**
   * Decode a Legacy Address into an Address Entity.
   *
   * @param address {string} The Legacy (Base58) Address to decode.
   *
   * @throws {Error} If address cannot be decoded.
   *
   * @returns {Address} Instance of Address.
   */
  public static fromLegacy(legacyAddress: string): Address {
    // Decode the Legacy (Base58) Address.
    const decodeResult = decodeBase58Address(legacyAddress);

    // If a string is returned, this indicates an error...
    if (typeof decodeResult === 'string') {
      throw new Error(decodeResult);
    }

    // Define the encode type in advance.
    let encodeType: AddressType;

    // Determine the encoding to use based on the Decoding Result's Type.
    switch (decodeResult.version) {
      case Base58AddressFormatVersion.p2pkh:
      case Base58AddressFormatVersion.p2pkhTestnet:
        encodeType = 'P2PKH';
        break;
      case Base58AddressFormatVersion.p2sh20:
      case Base58AddressFormatVersion.p2sh20Testnet:
        encodeType = 'P2SH20';
        break;
      default:
        throw new Error(`Unsupported address type: ${decodeResult.version}`);
    }

    return new Address({ payload: decodeResult.payload, type: encodeType });
  }

  /**
   * Decode a Cash Address or Legacy Address.
   *
   * @param address {string} The address to attempt to decode.
   *
   * @throws {Error} If address cannot be decoded.
   *
   * @returns {Address} Instance of Address.
   */
  public static fromCashAddrOrLegacy(address: string): Address {
    // Attempt to decode as a Cash Address.
    try {
      return Address.fromCashAddr(address);
    } catch (error) {
      // And if that fails, attempt to decode as a Base58 Address.
      return Address.fromLegacy(address);
    }
  }

  /**
   * Instantiate an address from Contract Bytecode.
   *
   * @param contractBytes {Uint8Array} The contract bytecode
   *
   * @throws {Error} If address cannot be instantiated from Contract Bytecode.
   *
   * @returns {Address} Instance of Address.
   */
  public static fromRedeemScript(
    contractBytes: Uint8Array,
    type: 'P2SH20' | 'P2SH32' = 'P2SH32'
  ): Address {
    // Do an initial SHA256 on the Contract Bytes.
    let payload = sha256.hash(contractBytes);

    if (type === 'P2SH20') {
      // RIPEMD160 the SHA256 hash.
      payload = ripemd160.hash(payload);
    } else if (type === 'P2SH32') {
      // SHA256 Hash the SHA256 hash a seconr time.
      payload = sha256.hash(payload);
    }

    // Return a new instance of address.
    return new Address({ payload, type });
  }

  /**
   * Instantiate an address from Contract Bytecode as a hex string.
   *
   * @param contractBytes {Uint8Array} The contract bytecode
   *
   * @throws {Error} If address cannot be instantiated from Contract Bytecode.
   *
   * @returns {Address} Instance of Address.
   */
  public static fromRedeemScriptHex(
    hex: string,
    type: 'P2SH20' | 'P2SH32' = 'P2SH32'
  ): Address {
    if (!isHex(hex)) {
      throw new Error('Invalid hex');
    }

    const contractBytecode = hexToBin(hex);

    // Return a new instance of address.
    return Address.fromRedeemScript(contractBytecode, type);
  }

  /**
   * Attempt to instantiate Address from Locking Bytecode.
   *
   * @param lockScript {Uint8Array} The lockscript bytes.
   *
   * @throws {Error} If lock script cannot be decoded into an address.
   *
   * @returns {Address} Instance of Address.
   */
  public static fromLockscriptBytes(lockScript: Uint8Array): Address {
    const addressContents = lockingBytecodeToAddressContents(lockScript);

    // If the type is not recognized, throw an error...
    if (addressContents.type === 'unknown') {
      throw new Error(`Invalid type (${addressContents.type})`);
    }

    return new Address(addressContents);
  }

  /**
   * Attempt to instantiate Address from Locking Bytecode as a hex string.
   *
   * @param hex {Uint8Array} The lockscript bytes as hex.
   *
   * @throws {Error} If lock script cannot be decoded into an address.
   *
   * @returns {Address} Instance of Address.
   */
  public static fromLockscriptHex(hex: string): Address {
    if (!isHex(hex)) {
      throw new Error('Invalid hex');
    }

    const lockScriptBytes = hexToBin(hex);

    return Address.fromLockscriptBytes(lockScriptBytes);
  }

  /**
   * Instantiate an address from a Ripemd160 hash.
   *
   * @param hash160 {Uint8Array}  The hash to use.
   * @param type    {AddressType} The type of the address to instantiate (e.g. P2PKH).
   *
   * @throws {Error} If hash160 is not 20 bytes.
   *
   * @returns {Address} Instance of Address.
   */
  public static fromHash160(
    hash160: Uint8Array,
    type: AddressType = 'P2PKH'
  ): Address {
    // If the Hash160 bytes is not 20 in length, it is invalid...
    if (hash160.length !== 20) {
      throw new Error(
        `Invalid hash160 length: Expected 20 (Received ${hash160.length})`
      );
    }

    return new Address({ payload: hash160, type });
  }

  /**
   * Instantiate an address from a Ripemd160 hash (as hex).
   *
   * @param hash160Hex {string}      The hash to use (as hex).
   * @param type       {AddressType} The type of the address to instantiate (e.g. P2PKH).
   *
   * @throws {Error} If hash160 is not 20 bytes.
   *
   * @returns {Address} Instance of Address.
   */
  public static fromHash160Hex(
    hash160Hex: string,
    type: AddressType = 'P2PKH'
  ): Address {
    if (!isHex(hash160Hex)) {
      throw new Error('Invalid hex');
    }

    const hash160Bytes = hexToBin(hash160Hex);

    return Address.fromHash160(hash160Bytes, type);
  }

  /**
   * Gets the type of address (P2PKH, P2SH).
   *
   * @returns {AddressType} The type of Address.
   */
  public type(): AddressType {
    return this.addressContents.type;
  }

  /**
   * Gets this address' raw Hash160 (Ripemd160) hash as a Uint8Array.
   *
   * @returns {Uint8Array} The Hash160 of this address.
   */
  public toHash160Bytes(): Uint8Array {
    return this.addressContents.payload;
  }

  /**
   * Gets this address' raw Hash160 (Ripemd16) hash as a hex string.
   *
   * @returns {Uint8Array} The Hash160 of this address.
   */
  public toHash160Hex(): string {
    return binToHex(this.addressContents.payload);
  }

  /**
   * Converts this address to CashAddr format.
   *
   * @param networkPrefix {'bitcoincash' | 'bchtest' | 'bchreg'} The Cash Address Network prefix.
   *
   * @throws {Error} If address cannot be encoded as a CashAddr.
   *
   * @returns {string} The address in CashAddr format.
   */
  public toCashAddr(
    networkPrefix: 'bitcoincash' | 'bchtest' | 'bchreg' = 'bitcoincash',
    supportTokens = false
  ): string {
    // Define the encode type in advance.
    let encodeType: 'p2pkh' | 'p2sh' | 'p2pkhWithTokens' | 'p2shWithTokens';

    // Determine the encoding to use based on the Address Content's Type.
    switch (this.addressContents.type) {
      case 'P2PKH':
        encodeType = supportTokens ? 'p2pkhWithTokens' : 'p2pkh';
        break;
      case 'P2SH20':
        encodeType = supportTokens ? 'p2shWithTokens' : 'p2sh';
        break;
      case 'P2SH32':
        encodeType = supportTokens ? 'p2shWithTokens' : 'p2sh';
        break;
      default:
        throw new Error(
          `Unsupported address type: ${this.addressContents.type}`
        );
    }

    // NOTE: This function will throw if the payload is invalid.
    return encodeCashAddress(
      networkPrefix,
      encodeType,
      this.addressContents.payload
    );
  }

  /**
   * Converts this address to Legacy (Base58) Address format.
   *
   * @throws {Error} If address cannot be encoded as a Legacy Address (Base58).
   *
   * @returns {string} The address in Legacy Address format.
   */
  public toLegacy(): string {
    // Define the encode type in advance.
    let encodeType: Base58AddressFormatVersion;

    // Determine the encoding to use based on the Address Content's Type.
    switch (this.addressContents.type) {
      case 'P2PKH':
        encodeType = Base58AddressFormatVersion.p2pkh;
        break;
      case 'P2SH20':
        encodeType = Base58AddressFormatVersion.p2sh20;
        break;
      default:
        throw new Error(
          `Unsupported address type: ${this.addressContents.type}`
        );
    }

    // Encode the address in Base58 format.
    return encodeBase58AddressFormat(encodeType, this.addressContents.payload);
  }

  /**
   * Get the corresponding lockscript for this address as a Uint8Array.
   *
   * @returns {Uint8Array} The lockscript as a Uint8Array.
   */
  public toLockscriptBytes(): Uint8Array {
    return addressContentsToLockingBytecode(this.addressContents);
  }

  /**
   * Get the corresponding lockscript for this address as a hex string.
   *
   * @returns {Uint8Array} The lockscript as a hex string.
   */
  public toLockscriptHex(): string {
    return binToHex(this.toLockscriptBytes());
  }

  /**
   * Get the corresponding lockscript for this address as ASM.
   *
   * @returns {Uint8Array} The lockscript as ASN.
   */
  public toLockscriptAsm(): string {
    const lockscriptBytes = this.toLockscriptBytes();

    const lockscriptAsm = disassembleBytecodeBCH(lockscriptBytes);

    return lockscriptAsm;
  }
}
