import { Hash } from "./hash";

/**
 * Hash with a width of 160 bits
 */
class Hash160 extends Hash {
  static readonly width = 20;
  static readonly ZERO_160: Hash160 = new Hash160(Buffer.alloc(Hash160.width));

  constructor(bytes: Buffer) {
    super(bytes ?? Hash160.ZERO_160.bytes);
  }
}

export { Hash160 };
