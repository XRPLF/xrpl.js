import * as assert from "assert";
import { Field, FieldInstance } from "../enums";

/**
 * BinaryParser is used to compute fields and values from a HexString
 */
class BinaryParser {
  private bytes: Buffer;

  /**
   * Initialize bytes to a hex string
   *
   * @param hexBytes a hex string
   */
  constructor(hexBytes: string) {
    this.bytes = Buffer.from(hexBytes, "hex");
  }

  /**
   * Consume the first n bytes of the BinaryParser
   *
   * @param n the number of bytes to skip
   */
  skip(n: number): void {
    assert(n <= this.bytes.byteLength);
    this.bytes = this.bytes.slice(n);
  }

  /**
   * read the first n bytes from the BinaryParser
   *
   * @param n The number of bytes to read
   * @return The bytes
   */
  read(n: number): Buffer {
    assert(n <= this.bytes.byteLength);

    const slice = this.bytes.slice(0, n);
    this.skip(n);
    return slice;
  }

  /**
   * Read an integer of given size
   *
   * @param n The number of bytes to read
   * @return The number represented by those bytes
   */
  readUIntN(n: number): number {
    assert(0 < n && n <= 4, "invalid n");
    return this.read(n).reduce((a, b) => (a << 8) | b) >>> 0;
  }

  readUInt8(): number {
    return this.readUIntN(1);
  }

  readUInt16(): number {
    return this.readUIntN(2);
  }

  readUInt32(): number {
    return this.readUIntN(4);
  }

  size(): number {
    return this.bytes.byteLength;
  }

  end(customEnd?: number): boolean {
    const length = this.bytes.byteLength;
    return length === 0 || (customEnd !== undefined && length <= customEnd);
  }

  /**
   * Reads variable length encoded bytes
   *
   * @return The variable length bytes
   */
  readVariableLength(): Buffer {
    return this.read(this.readVariableLengthLength());
  }

  /**
   * Reads the length of the variable length encoded bytes
   *
   * @return The length of the variable length encoded bytes
   */
  readVariableLengthLength(): number {
    const b1 = this.readUInt8();
    if (b1 <= 192) {
      return b1;
    } else if (b1 <= 240) {
      const b2 = this.readUInt8();
      return 193 + (b1 - 193) * 256 + b2;
    } else if (b1 <= 254) {
      const b2 = this.readUInt8();
      const b3 = this.readUInt8();
      return 12481 + (b1 - 241) * 65536 + b2 * 256 + b3;
    }
    throw new Error("Invalid variable length indicator");
  }

  /**
   * Reads the field ordinal from the BinaryParser
   *
   * @return Field ordinal
   */
  readFieldOrdinal(): number {
    const tagByte = this.readUInt8();
    const type = (tagByte & 0xf0) >>> 4 || this.readUInt8();
    const nth = tagByte & 0x0f || this.readUInt8();
    return (type << 16) | nth;
  }

  /**
   * Read the field from the BinaryParser
   *
   * @return The field represented by the bytes at the head of the BinaryParser
   */
  readField(): FieldInstance {
    return Field.fromString(this.readFieldOrdinal().toString());
  }

  /**
   * Read a given type from the BinaryParser
   *
   * @param type The type that you want to read from the BinaryParser
   * @return The instance of that type read from the BinaryParser
   */
  readType(type) {
    return type.fromParser(this);
  }

  /**
   * Get the type associated with a given field
   *
   * @param field The field that you wan to get the type of
   * @return The type associated with the given field
   */
  typeForField(field: FieldInstance) {
    return field.associatedType;
  }

  /**
   * Read value of the type specified by field from the BinaryParser
   *
   * @param field The field that you want to get the associated value for
   * @return The value associated with the given field
   */
  readFieldValue(field: FieldInstance) {
    const type = this.typeForField(field);
    if (!type) {
      throw new Error(`unsupported: (${field.name}, ${field.type.name})`);
    }
    const sizeHint = field.isVariableLengthEncoded
      ? this.readVariableLengthLength()
      : null;
    const value = type.fromParser(this, sizeHint);
    if (value === undefined) {
      throw new Error(
        `fromParser for (${field.name}, ${field.type.name}) -> undefined `
      );
    }
    return value;
  }

  /**
   * Get the next field and value from the BinaryParser
   *
   * @return The field and value
   */
  readFieldAndValue() {
    const field = this.readField();
    return [field, this.readFieldValue(field)];
  }
}

export { BinaryParser };
