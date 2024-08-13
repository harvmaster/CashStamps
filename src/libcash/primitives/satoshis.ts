/**
 * Satoshis Primitive
 */
export class Satoshis {
  public readonly satoshis: bigint;

  /**
   * Construct a new instance of Satoshis.
   *
   * This is the same as using fromSatoshis().
   *
   * @param satoshis {number} The satoshi amount.
   */
  constructor(satoshis: bigint | number) {
    // Set the satoshi amount.
    this.satoshis = BigInt(satoshis);
  }

  /**
   * Instantiates from a Satoshi Amount.
   *
   * @param satoshis {number} The Satoshi amount.
   *
   * @returns {Satoshis} New instance of Satoshis.
   */
  public static fromSats(satoshis: bigint | number): Satoshis {
    return new Satoshis(satoshis);
  }

  /**
   * Instantiates from a Satoshi Amount.
   *
   * @param satoshis {number} The Satoshi amount.
   *
   * @deprecated Use fromSats() instead.
   *
   * @returns {Satoshis} New instance of Satoshis.
   */
  public static fromSatoshis(satoshis: bigint | number): Satoshis {
    return new Satoshis(satoshis);
  }

  /**
   * Instantiates from a Bits Amount (100 satoshis = 1 bit).
   *
   * @param bits {number} The Bits amount.
   *
   * @returns {Satoshis} New instance of Satoshis.
   */
  public static fromBits(bits: number): Satoshis {
    const satoshis = Satoshis.roundToDigits(bits * 100, 0);

    return new Satoshis(satoshis);
  }

  /**
   * Instantiates from a mBCH Amount (100,000 satoshis = 1 mBCH).
   *
   * @param mBCH {number} The mBCH amount.
   *
   * @returns {Satoshis} New instance of Satoshis.
   */
  public static fromMBCH(mBCH: number): Satoshis {
    const satoshis = Satoshis.roundToDigits(mBCH * 100_000, 0);

    return new Satoshis(satoshis);
  }

  /**
   * Instantiates from a BCH Amount (100,000,000 satoshis = 1 BCH).
   *
   * @param bch {number} The BCH amount.
   *
   * @returns {Satoshis} New instance of Satoshis.
   */
  public static fromBCH(bch: number): Satoshis {
    const satoshis = Satoshis.roundToDigits(bch * 100_000_000, 0);

    return new Satoshis(satoshis);
  }

  /**
   * Rounds a number to the given number of digits.
   *
   * @param numberToRound {number} The number to round.
   * @param digits        {number} The number of digits to round to.
   *
   * @returns {Number} The rounded number.
   */
  public static roundToDigits(numberToRound: number, digits: number): number {
    // Set the options of the Number Format object.
    const options = {
      style: 'decimal',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: false,
      numberingSystem: 'latn',
    };

    // Create an instance of number format using above options.
    // NOTE: We force the locale to en-GB so that the number is formatted correctly (e.g. with a decimal, not a comma).
    const numberFormat = new Intl.NumberFormat('en-GB', options);

    // Format the number.
    const formattedAmount = numberFormat.format(numberToRound);

    // Return the formatted number.
    return Number(formattedAmount);
  }

  /**
   * Converts the amount to Satoshis (as a BigInt).
   *
   * @returns {bigint} The satoshi amount.
   */
  public toBigInt(): bigint {
    return this.satoshis;
  }

  /**
   * Converts the amount to Satoshis.
   *
   * @returns {number} The satoshi amount.
   */
  public toSats(): number {
    return Number(this.satoshis);
  }

  /**
   * Converts the amount to Satoshis.
   *
   * @deprecated Use toSats() instead.
   *
   * @returns {number} The satoshi amount.
   */
  public toSatoshis(): number {
    return Number(this.satoshis);
  }

  /**
   * Converts the amount to Bits (100 satoshis = 1 bit).
   *
   * @returns {number} The bit amount.
   */
  public toBits(): number {
    return Satoshis.roundToDigits(Number(this.satoshis) / 100, 2);
  }

  /**
   * Converts the amount to mBCH (100,000 satoshis = 1 mBCH).
   *
   * @returns {number} The mBCH amount.
   */
  public toMBCH(): number {
    return Satoshis.roundToDigits(Number(this.satoshis) / 100_000, 5);
  }

  /**
   * Converts the amount to BCH (100,000,000 satoshis = 1 BCH).
   *
   * @returns {number} The BCH amount.
   */
  public toBCH(): number {
    return Satoshis.roundToDigits(Number(this.satoshis) / 100_000_000, 8);
  }
}
