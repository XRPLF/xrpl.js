import { UInt } from "./uint";
import { BinaryParser } from "../serdes/binary-parser";

/**
 * Derived UInt class for serializing/deserializing 32 bit UInt
 */
class UInt32 extends UInt {
  protected static readonly width: number = 32 / 8; // 4
  static readonly defaultUInt32: UInt32 = new UInt32(
    Buffer.alloc(UInt32.width)
  );

  constructor(bytes: Buffer) {
    super(bytes ?? UInt32.defaultUInt32.bytes);
  }

  static fromParser(parser: BinaryParser): UInt {
    return new UInt32(parser.read(UInt32.width));
  }

  /**
   * Construct a UInt32 object from a number
   *
   * @param val UInt32 object or number
   */
  static from(val: UInt32 | number): UInt32 {
    if (val instanceof UInt32) {
      return val;
    }

    const buf = Buffer.alloc(UInt32.width);
    buf.writeUInt32BE(val);
    return new UInt32(buf);
  }

  /**
   * get the value of a UInt32 object
   *
   * @returns the number represented by this.bytes
   */
  valueOf(): number {
    return this.bytes.readUInt32BE();
  }
}

export { UInt32 };
