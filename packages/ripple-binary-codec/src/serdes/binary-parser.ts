import {
  XrplDefinitionsBase,
  DEFAULT_DEFINITIONS,
  FieldInstance,
} from '../enums'
import { type SerializedType } from '../types/serialized-type'
import { hexToBytes } from '@xrplf/isomorphic/utils'

/**
 * BinaryParser is used to compute fields and values from a HexString
 */
class BinaryParser {
  private bytes: Uint8Array
  definitions: XrplDefinitionsBase

  /**
   * Initialize bytes to a hex string
   *
   * @param hexBytes a hex string
   * @param definitions Rippled definitions used to parse the values of transaction types and such.
   *                          Can be customized for sidechains and amendments.
   */
  constructor(
    hexBytes: string,
    definitions: XrplDefinitionsBase = DEFAULT_DEFINITIONS,
  ) {
    this.bytes = hexToBytes(hexBytes)
    this.definitions = definitions
  }

  /**
   * Peek the first byte of the BinaryParser
   *
   * @returns The first byte of the BinaryParser
   */
  peek(): number {
    if (this.bytes.byteLength === 0) {
      throw new Error()
    }
    return this.bytes[0]
  }

  /**
   * Consume the first n bytes of the BinaryParser
   *
   * @param n the number of bytes to skip
   */
  skip(n: number): void {
    if (n > this.bytes.byteLength) {
      throw new Error()
    }
    this.bytes = this.bytes.slice(n)
  }

  /**
   * read the first n bytes from the BinaryParser
   *
   * @param n The number of bytes to read
   * @return The bytes
   */
  read(n: number): Uint8Array {
    if (n > this.bytes.byteLength) {
      throw new Error()
    }

    const slice = this.bytes.slice(0, n)
    this.skip(n)
    return slice
  }

  /**
   * Read an integer of given size
   *
   * @param n The number of bytes to read
   * @return The number represented by those bytes
   */
  readUIntN(n: number): number {
    if (0 >= n || n > 4) {
      throw new Error('invalid n')
    }
    return this.read(n).reduce((a, b) => (a << 8) | b) >>> 0
  }

  readUInt8(): number {
    return this.readUIntN(1)
  }

  readUInt16(): number {
    return this.readUIntN(2)
  }

  readUInt32(): number {
    return this.readUIntN(4)
  }

  size(): number {
    return this.bytes.byteLength
  }

  end(customEnd?: number): boolean {
    const length = this.bytes.byteLength
    return length === 0 || (customEnd !== undefined && length <= customEnd)
  }

  /**
   * Reads variable length encoded bytes
   *
   * @return The variable length bytes
   */
  readVariableLength(): Uint8Array {
    return this.read(this.readVariableLengthLength())
  }

  /**
   * Reads the length of the variable length encoded bytes
   *
   * @return The length of the variable length encoded bytes
   */
  readVariableLengthLength(): number {
    const b1 = this.readUInt8()
    if (b1 <= 192) {
      return b1
    } else if (b1 <= 240) {
      const b2 = this.readUInt8()
      return 193 + (b1 - 193) * 256 + b2
    } else if (b1 <= 254) {
      const b2 = this.readUInt8()
      const b3 = this.readUInt8()
      return 12481 + (b1 - 241) * 65536 + b2 * 256 + b3
    }
    throw new Error('Invalid variable length indicator')
  }

  /**
   * Reads the field ordinal from the BinaryParser
   *
   * @return Field ordinal
   */
  readFieldOrdinal(): number {
    let type = this.readUInt8()
    let nth = type & 15
    type >>= 4

    if (type === 0) {
      type = this.readUInt8()
      if (type === 0 || type < 16) {
        throw new Error(
          `Cannot read FieldOrdinal, type_code ${type} out of range`,
        )
      }
    }

    if (nth === 0) {
      nth = this.readUInt8()
      if (nth === 0 || nth < 16) {
        throw new Error(
          `Cannot read FieldOrdinal, field_code ${nth} out of range`,
        )
      }
    }

    return (type << 16) | nth
  }

  /**
   * Read the field from the BinaryParser
   *
   * @return The field represented by the bytes at the head of the BinaryParser
   */
  readField(): FieldInstance {
    return this.definitions.field.fromString(this.readFieldOrdinal().toString())
  }

  /**
   * Read a given type from the BinaryParser
   *
   * @param type The type that you want to read from the BinaryParser
   * @return The instance of that type read from the BinaryParser
   */
  readType(type: typeof SerializedType): SerializedType {
    return type.fromParser(this)
  }

  /**
   * Get the type associated with a given field
   *
   * @param field The field that you wan to get the type of
   * @return The type associated with the given field
   */
  typeForField(field: FieldInstance): typeof SerializedType {
    return field.associatedType
  }

  /**
   * Read value of the type specified by field from the BinaryParser
   *
   * @param field The field that you want to get the associated value for
   * @return The value associated with the given field
   */
  readFieldValue(field: FieldInstance): SerializedType {
    const type = this.typeForField(field)
    if (!type) {
      throw new Error(`unsupported: (${field.name}, ${field.type.name})`)
    }
    const sizeHint = field.isVariableLengthEncoded
      ? this.readVariableLengthLength()
      : undefined
    const value = type.fromParser(this, sizeHint)
    if (value === undefined) {
      throw new Error(
        `fromParser for (${field.name}, ${field.type.name}) -> undefined `,
      )
    }
    return value
  }

  /**
   * Get the next field and value from the BinaryParser
   *
   * @return The field and value
   */
  readFieldAndValue(): [FieldInstance, SerializedType] {
    const field = this.readField()
    return [field, this.readFieldValue(field)]
  }
}

export { BinaryParser }
