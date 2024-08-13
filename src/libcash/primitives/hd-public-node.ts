import { PublicKey } from './public-key.js';

import {
  encodeHdPublicKey,
  decodeHdPublicKey,
  deriveHdPath,
} from '@bitauth/libauth';

import type {
  DecodedHdKey,
  HdKeyNetwork,
  HdPublicNodeValid,
} from '@bitauth/libauth';

/**
 * Hierarchically Deterministic Public Node Entity.
 */
export class HDPublicNode {
  // The HD Public Node.
  public readonly node: HdPublicNodeValid;

  /**
   * Construct a new HD Public Node.
   *
   * @param node {HdPublicNode} The HD Public Node.
   */
  constructor(node: HdPublicNodeValid) {
    this.node = node;
  }

  /**
   * Creates a HD Public Node from the given XPriv Key.
   *
   * @param xpub {string} The XPriv Key.
   *
   * @throws {Error} If HD Public Node cannot be created.
   *
   * @returns {HDPrivateNode} The created HD Public Node.
   */
  public static fromXPub(xpub: string): HDPublicNode {
    // Attempt to decode the XPub Key.
    const decodeResult = decodeHdPublicKey(xpub);

    // If a string is returned, this indicates an error...
    if (typeof decodeResult === 'string') {
      throw new Error(decodeResult);
    }

    // Return a new HD Public Node from the given XPub.
    return new HDPublicNode(decodeResult.node);
  }

  /**
   * Returns the XPub string for this node.
   *
   * @returns {string} The XPub string for this node.
   */
  public toString(): string {
    // Return the Mainnet XPub.
    return this.toXPub();
  }

  /**
   * Gets the Public Key Entity for this node.
   *
   * @returns {PublicKey} The Public Key Entity for this node.
   */
  public publicKey(): PublicKey {
    // Return a Public Key Entity from the public key of our node.
    return new PublicKey(this.node.publicKey);
  }

  /**
   * Derives a HD Public Node from the given BIP32 path.
   *
   * @param path {string} The BIP32 Path (e.g. m/44'/145'/0'/0/1).
   *
   * @throws {Error} If HD Public Node cannot be derived.
   *
   * @returns {HDPrivateNode} The derived HD Public Node
   */
  public derivePath(path: string): HDPublicNode {
    // Attempt to derive the given path.
    const derivePathResult = deriveHdPath(this.node, path);

    // If a string is returned, this indicates an error...
    if (typeof derivePathResult === 'string') {
      throw new Error(derivePathResult);
    }

    // Return a new HD Public Node Entity derived from the given path.
    return new HDPublicNode(derivePathResult);
  }

  /**
   * Converts this node to an XPub Key for export.
   *
   * @param network {HdKeyNetwork} The network to encode for.
   *
   * @returns {string} The XPub Key.
   */
  public toXPub(network: HdKeyNetwork = 'mainnet'): string {
    // Create our node info structure.
    const nodeInfo = {
      network: network,
      node: this.node,
    } as DecodedHdKey<HdPublicNodeValid>;

    // Encode the XPub from our node info.
    return encodeHdPublicKey(nodeInfo).hdPublicKey;
  }
}
