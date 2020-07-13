import { UInt } from "./uint";
import { BinaryParser } from "../serdes/binary-parser";

const HEX_REGEX = /^[A-F0-9]{16}$/;

/**
 * Derived UInt class for serializing/deserializing 64 bit UInt
 */
class UInt64 extends UInt {
  protected static readonly width: number = 64 / 8; // 8
  static readonly defaultUInt64: UInt64 = new UInt64(
    Buffer.alloc(UInt64.width)
  );

  constructor(bytes: Buffer) {
    super(bytes ?? UInt64.defaultUInt64.bytes);
  }

  static fromParser(parser: BinaryParser): UInt {
    return new UInt64(parser.read(UInt64.width));
  }

  /**
   * Construct a UInt64 object
   *
   * @param val A UInt64, hex-string, bigint, or number
   * @returns A UInt64 object
   */
  static from(val: UInt64 | string | bigint | number): UInt64 {
    if (val instanceof UInt64) {
      return val;
    }

    let buf = Buffer.alloc(UInt64.width);

    if (typeof val === "number") {
      if (val < 0) {
        throw new Error("value must be an unsigned integer");
      }
      buf.writeBigUInt64BE(BigInt(val));
    } else if (typeof val === "string") {
      if (!HEX_REGEX.test(val)) {
        throw new Error(val + "is not a valid hex-string");
      }
      buf = Buffer.from(val, "hex");
    } else {
      // typeof val === bigint
      buf.writeBigUInt64BE(val);
    }

    return new UInt64(buf);
  }

  /**
   * The JSON representation of a UInt64 object
   *
   * @returns a hex-string
   */
  toJSON(): string {
    return this.bytes.toString("hex").toUpperCase();
  }

  /**
   * Get the value of the UInt64
   *
   * @returns the number represented buy this.bytes
   */
  valueOf(): bigint {
    return this.bytes.readBigUInt64BE();
  }

  /**
   * Get the bytes representation of the UInt64 object
   *
   * @returns 8 bytes representing the UInt64
   */
  toBytes(): Buffer {
    return this.bytes;
  }
}

export { UInt64 };
