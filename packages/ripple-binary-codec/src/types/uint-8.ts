import { UInt } from "./uint";
import { BinaryParser } from "../serdes/binary-parser";

/**
 * Derived UInt class for serializing/deserializing 8 bit UInt
 */
class UInt8 extends UInt {
  protected static readonly width: number = 8 / 8 //1
  static readonly defaultUInt8: UInt8 = new UInt8(Buffer.alloc(UInt8.width))

  constructor(bytes: Buffer) {
    super(bytes ?? UInt8.defaultUInt8.bytes)
  }

  static fromParser(parser: BinaryParser): UInt {
    return new UInt8(parser.read(UInt8.width));
  }

  /**
   * Construct a UInt8 object from a number
   * 
   * @param val UInt8 object or number
   */
  static from(val: UInt8 | number): UInt8 {
    if(val instanceof UInt8) {
      return val;
    }

    let buf = Buffer.alloc(UInt8.width);
    buf.writeUInt8(val);
    return new UInt8(buf);
  }

  /**
   * get the value of a UInt8 object
   * 
   * @returns the number represented by this.bytes
   */
  valueOf(): number {
    return this.bytes.readUInt8();
  }
}

export { UInt8 };
