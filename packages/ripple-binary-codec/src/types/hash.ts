import { ComparableClass } from "./serialized-type";
import { BinaryParser } from "../serdes/binary-parser";

/**
 * Base class defining how to encode and decode hashes
 */
class Hash extends ComparableClass {
  static readonly width: number;

  constructor(bytes: Buffer) {
    super(bytes);
  }

  /**
   * Construct a Hash object from an existing Hash object or a hex-string
   *
   * @param value A hash object or hex-string of a hash
   */
  static from(value: Hash | string): Hash {
    return value instanceof this ? value : new this(Buffer.from(value, "hex"));
  }

  /**
   * Read a Hash object from a BinaryParser
   *
   * @param parser BinaryParser to read the hash from
   * @param hint length of the bytes to read, optional
   */
  static fromParser(parser: BinaryParser, hint?: number): Hash {
    return new this(parser.read(hint ?? this.width));
  }

  /**
   * Overloaded operator for comparing two hash objects
   *
   * @param other The Hash to compare this to
   */
  compareTo(other: Hash): number {
    return Buffer.compare(
      this.bytes,
      (this.constructor as typeof Hash).from(other).bytes
    );
  }

  /**
   * @returns the hex-string representation of this Hash
   */
  toString(): string {
    return this.toHex();
  }

  /**
   * Returns four bits at the specified depth within a hash
   *
   * @param depth The depth of the four bits
   * @returns The number represented by the four bits
   */
  nibblet(depth: number): number {
    const byteIx = depth > 0 ? (depth / 2) | 0 : 0;
    let b = this.bytes[byteIx];
    if (depth % 2 === 0) {
      b = (b & 0xf0) >>> 4;
    } else {
      b = b & 0x0f;
    }
    return b;
  }
}

export { Hash };
