import { Hash } from "./hash";

/**
 * Hash with a width of 128 bits
 */
class Hash128 extends Hash {
  static readonly width = 16;
  static readonly ZERO_128: Hash128 = new Hash128(Buffer.alloc(Hash128.width));

  constructor(bytes: Buffer) {
    super(bytes ?? Hash128.ZERO_128.bytes);
  }
}

export { Hash128 };
