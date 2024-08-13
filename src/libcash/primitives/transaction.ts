import {
  binToHex,
  hexToBin,
  encodeTransaction,
  decodeTransaction,
  isHex,
} from '@bitauth/libauth';
import type { TransactionBCH } from '@bitauth/libauth';

/**
 * Transaction Entity.
 */
export class Transaction {
  constructor(public transaction: TransactionBCH) {}

  /**
   * Create a Transaction Entity from the given byte data.
   *
   * @param bytes {Uint8Array} The raw byte data of the transaction.
   *
   * @throws {Error} If transaction data cannot be decoded.
   *
   * @returns {Transaction} The created Transaction Entity.
   */
  public static fromBytes(bytes: Uint8Array): Transaction {
    // Attempt to decode the raw transaction bytes.
    const decodeResult = decodeTransaction(bytes);

    // If a string is returned, this indicates an error...
    if (typeof decodeResult === 'string') {
      throw new Error(decodeResult);
    }

    // Return a new instance of the Transaction Entity created from the decode result.
    return new Transaction(decodeResult);
  }

  /**
   * Create a Transaction Entity from the given byte data encoded as hexadecimal string.
   *
   * @param hex {string} The raw byte data (encoded as hexadecimal string) of the transaction.
   *
   * @throws {Error} If transaction cannot be decoded.
   *
   * @returns {Transaction} The created Transaction Entity.
   */
  public static fromHex(hex: string): Transaction {
    // Ensure that the given string is hex.
    if (!isHex(hex)) {
      throw new Error('The given string is not valid hexadecimal.');
    }

    // Convert our hex to binary.
    const bytes = hexToBin(hex);

    // Return the transaction constructed from our bytes.
    return Transaction.fromBytes(bytes);
  }

  public toBytes(): Uint8Array {
    const bytes = encodeTransaction(this.transaction);

    return bytes;
  }

  public toHex(): string {
    const bytes = this.toBytes();

    return binToHex(bytes);
  }

  public getVersion() {
    return this.transaction.version;
  }

  public getInputs() {
    return this.transaction.inputs;
  }

  public getOutputs() {
    return this.transaction.outputs;
  }

  public getLocktime() {
    return this.transaction.locktime;
  }
}
