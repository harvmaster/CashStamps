/**
 * TODO: These are intended as temporary stand-ins until this functionality has been implemented directly in LibAuth.
 *       We are doing this so that we may better standardize with the rest of the BCH eco-system in future.
 *       See: https://github.com/bitauth/libauth/pull/108
 */

import { binToHex, hexToBin } from '@bitauth/libauth';

export const extendedJsonReplacer = function (value: any): any {
  if (typeof value === 'bigint') {
    return `<bigint: ${value.toString()}n>`;
  } else if (value instanceof Uint8Array) {
    return `<Uint8Array: ${binToHex(value)}>`;
  } else if (value instanceof Date) {
    return `<Date: ${value.toISOString()}>`;
  }

  return value;
};

export const extendedJsonReviver = function (value: any): any {
  // Define RegEx that matches our Extended JSON fields.
  const bigIntRegex = /^<bigint: (?<bigint>[+-]?[0-9]*)n>$/;
  const uint8ArrayRegex = /^<Uint8Array: (?<hex>[a-f0-9]*)>$/;
  const dateRegex = /^<Date: (?<isostring>.+)>$/;

  // Only perform a check if the value is a string.
  // NOTE: We can skip all other values as all Extended JSON encoded fields WILL be a string.
  if (typeof value === 'string') {
    // Check if this value matches an Extended JSON encoded bigint.
    const bigintMatch = value.match(bigIntRegex);
    if (bigintMatch) {
      // Access the named group directly instead of using array indices
      const { bigint } = bigintMatch.groups!;

      // Return the value casted to bigint.
      return BigInt(bigint);
    }

    const uint8ArrayMatch = value.match(uint8ArrayRegex);
    if (uint8ArrayMatch) {
      // Access the named group directly instead of using array indices
      const { hex } = uint8ArrayMatch.groups!;

      // Return the value casted to Uint8Array.
      return hexToBin(hex);
    }

    const dateMatch = value.match(dateRegex);
    if (dateMatch) {
      // Access the named group directly instead of using array indices
      const { isostring } = dateMatch.groups!;

      // Return the value as a Date object.
      return new Date(isostring);
    }
  }

  // Return the original value.
  return value;
};

export const encodeExtendedJsonObject = function (value: any): any {
  // If this is an object type (and it is not null - which is technically an "object")...
  // ... and it is not an ArrayBuffer (e.g. Uint8Array) which is also technically an "object...
  if (
    typeof value === 'object' &&
    value !== null &&
    !ArrayBuffer.isView(value) &&
    !(value instanceof Date)
  ) {
    // If this is an array, recursively call this function on each value.
    if (Array.isArray(value)) {
      return value.map(encodeExtendedJsonObject);
    }

    // Declare object to store extended JSON entries.
    const encodedObject: any = {};

    // Iterate through each entry and encode it to extended JSON.
    for (const [key, valueToEncode] of Object.entries(value)) {
      encodedObject[key] = encodeExtendedJsonObject(valueToEncode);
    }

    // Return the extended JSON encoded object.
    return encodedObject;
  }

  // Return the replaced value.
  return extendedJsonReplacer(value);
};

export const decodeExtendedJsonObject = function (value: any): any {
  // If this is an object type (and it is not null - which is technically an "object")...
  // ... and it is not an ArrayBuffer (e.g. Uint8Array) which is also technically an "object...
  if (
    typeof value === 'object' &&
    value !== null &&
    !ArrayBuffer.isView(value) &&
    !(value instanceof Date)
  ) {
    // If this is an array, recursively call this function on each value.
    if (Array.isArray(value)) {
      return value.map(decodeExtendedJsonObject);
    }

    // Declare object to store decoded JSON entries.
    const decodedObject: any = {};

    // Iterate through each entry and decode it from extended JSON.
    for (const [key, valueToEncode] of Object.entries(value)) {
      decodedObject[key] = decodeExtendedJsonObject(valueToEncode);
    }

    // Return the extended JSON encoded object.
    return decodedObject;
  }

  // Return the revived value.
  return extendedJsonReviver(value);
};

export const encodeExtendedJson = function (
  value: any,
  space: number | undefined = undefined
): string {
  const replacedObject = encodeExtendedJsonObject(value);
  const stringifiedObject = JSON.stringify(replacedObject, null, space);

  return stringifiedObject;
};

export const decodeExtendedJson = function (json: string): any {
  const parsedObject = JSON.parse(json);
  const revivedObject = decodeExtendedJsonObject(parsedObject);

  return revivedObject;
};
