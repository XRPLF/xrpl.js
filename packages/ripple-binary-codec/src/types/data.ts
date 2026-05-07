import { BinaryParser } from '../serdes/binary-parser'
import {
  JsonObject,
  SerializedType,
  SerializedTypeID,
  TYPE_ID_TO_STRING,
  TYPE_STRING_TO_ID,
  TYPE_NUMBER_TO_ID,
} from './serialized-type'
import { readUInt16BE, writeUInt16BE } from '../utils'
import { bytesToHex, concat } from '@xrplf/isomorphic/utils'
import { Hash128 } from './hash-128'
import { Hash160 } from './hash-160'
import { Hash192 } from './hash-192'
import { Hash256 } from './hash-256'
import { AccountID } from './account-id'
import { Amount } from './amount'
import { Blob } from './blob'
import { Currency } from './currency'
import { STNumber } from './st-number'
import { Issue } from './issue'
import { UInt8 } from './uint-8'
import { UInt16 } from './uint-16'
import { UInt32 } from './uint-32'
import { UInt64 } from './uint-64'
import { BinarySerializer } from '../binary'

/**
 * Interface for Data JSON representation
 */
interface DataJSON extends JsonObject {
  type: string
  value: string | number | JsonObject
}

/**
 * Map from SerializedTypeID to the corresponding type class.
 * Types listed here use standard from()/fromParser()/toBytes() without
 * any extra framing (unlike VL and Account which need length prefixes).
 */
const SIMPLE_TYPE_MAP: Partial<
  Record<SerializedTypeID, typeof SerializedType>
> = {
  [SerializedTypeID.STI_UINT8]: UInt8,
  [SerializedTypeID.STI_UINT16]: UInt16,
  [SerializedTypeID.STI_UINT32]: UInt32,
  [SerializedTypeID.STI_UINT64]: UInt64,
  [SerializedTypeID.STI_UINT128]: Hash128,
  [SerializedTypeID.STI_UINT160]: Hash160,
  [SerializedTypeID.STI_UINT192]: Hash192,
  [SerializedTypeID.STI_UINT256]: Hash256,
  [SerializedTypeID.STI_AMOUNT]: Amount,
  [SerializedTypeID.STI_ISSUE]: Issue,
  [SerializedTypeID.STI_CURRENCY]: Currency,
  [SerializedTypeID.STI_NUMBER]: STNumber,
}

/**
 * Types whose from() method expects a numeric argument.
 * For these, json.value is coerced to a number before calling from().
 */
const NUMERIC_TYPES = new Set<SerializedTypeID>([
  SerializedTypeID.STI_UINT8,
  SerializedTypeID.STI_UINT16,
  SerializedTypeID.STI_UINT32,
])

/**
 * STData: Encodes XRPL's "Data" type.
 *
 * This type wraps both a SerializedTypeID and the actual data value.
 * It's encoded as a 2-byte type ID followed by the serialized data.
 *
 * Usage:
 *   Data.from({ type: "Amount", value: "1000000" })
 *   Data.from({ type: "UInt64", value: "123456789" })
 *   Data.fromParser(parser)
 */
class Data extends SerializedType {
  static readonly ZERO_DATA: Data = new Data(
    concat([
      new Uint8Array([0x00, 0x01]), // Type ID for UINT16 (SerializedTypeID.STI_UINT16 = 1) as uint16
      new Uint8Array([0x00, 0x00]), // Value: two zero bytes for UINT16
    ]),
  )

  /**
   * Construct Data from bytes
   * @param bytes - Uint8Array containing type ID and data
   */
  constructor(bytes: Uint8Array) {
    super(bytes ?? Data.ZERO_DATA.bytes)
  }

  /**
   * Create Data from various input types
   *
   * @param value - Can be:
   *   - Data instance (returns as-is)
   *   - DataJSON object with 'type' and 'value' fields
   * @returns Data instance
   * @throws Error if value type is not supported
   */
  static from(value: unknown): Data {
    if (value instanceof Data) {
      return value
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      'value' in value
    ) {
      const json = value as DataJSON
      return Data.fromJSON(json)
    }

    throw new Error('Data.from: value must be Data instance or DataJSON object')
  }

  /**
   * Create Data from JSON representation
   *
   * @param json - Object with 'type' and 'value' fields
   * @returns Data instance
   * @throws Error if type is not supported
   */
  static fromJSON(json: DataJSON): Data {
    const typeId = TYPE_STRING_TO_ID[json.type]
    if (typeId === undefined) {
      throw new Error(`Data: unsupported type string: ${json.type}`)
    }

    let dataBytes: Uint8Array

    const TypeClass = SIMPLE_TYPE_MAP[typeId]
    if (TypeClass) {
      // For UInt8/16/32, coerce value to number; all others pass through
      const coercedValue = NUMERIC_TYPES.has(typeId)
        ? typeof json.value === 'string'
          ? parseInt(json.value, 10)
          : Number(json.value)
        : json.value
      dataBytes = TypeClass.from(coercedValue).toBytes()
    } else if (typeId === SerializedTypeID.STI_VL) {
      const val =
        typeof json.value === 'string' ? json.value : json.value.toString()
      dataBytes = Blob.from(val).toBytes()
      dataBytes = concat([
        BinarySerializer.encodeVariableLength(dataBytes.length),
        dataBytes,
      ])
    } else if (typeId === SerializedTypeID.STI_ACCOUNT) {
      const val =
        typeof json.value === 'string' ? json.value : json.value.toString()
      dataBytes = concat([
        new Uint8Array([0x14]),
        AccountID.from(val).toBytes(),
      ])
    } else {
      throw new Error(`Data.fromJSON(): unsupported type ID: ${typeId}`)
    }

    // Combine type header with data bytes
    const typeBytes = new Uint8Array(2)
    writeUInt16BE(typeBytes, typeId, 0)
    return new Data(concat([typeBytes, dataBytes]))
  }

  /**
   * Read Data from a BinaryParser stream
   *
   * @param parser - BinaryParser positioned at the start of Data
   * @returns Data instance
   */
  static fromParser(parser: BinaryParser): Data {
    // Read the 2-byte type ID
    const typeBytes = parser.read(2)
    const typeId = TYPE_NUMBER_TO_ID[readUInt16BE(typeBytes, 0)]

    let dataBytes: Uint8Array

    const TypeClass = SIMPLE_TYPE_MAP[typeId]
    if (TypeClass) {
      dataBytes = TypeClass.fromParser(parser).toBytes()
    } else if (typeId === SerializedTypeID.STI_VL) {
      const valueVL = parser.readVariableLength()
      dataBytes = concat([
        BinarySerializer.encodeVariableLength(valueVL.length),
        valueVL,
      ])
    } else if (typeId === SerializedTypeID.STI_ACCOUNT) {
      parser.skip(1)
      dataBytes = concat([
        new Uint8Array([0x14]),
        AccountID.fromParser(parser).toBytes(),
      ])
    } else {
      throw new Error(`Data: unsupported type ID when parsing: ${typeId}`)
    }

    return new Data(concat([typeBytes, dataBytes]))
  }

  /**
   * Get the inner SerializedTypeID
   *
   * @returns The inner type ID
   */
  getInnerType(): SerializedTypeID {
    return TYPE_NUMBER_TO_ID[readUInt16BE(this.bytes, 0)]
  }

  /**
   * Get the string representation of the inner type
   *
   * @returns String name of the type
   */
  getInnerTypeString(): string {
    const innerType = this.getInnerType()
    return TYPE_ID_TO_STRING[innerType] || innerType.toString()
  }

  /**
   * Get the data value
   *
   * @returns The stored data value
   */
  getValue(): SerializedType {
    const innerType = this.getInnerType()
    const parser = new BinaryParser(bytesToHex(this.bytes.slice(2)))

    const TypeClass = SIMPLE_TYPE_MAP[innerType]
    if (TypeClass) {
      return TypeClass.fromParser(parser)
    }

    if (innerType === SerializedTypeID.STI_VL) {
      const vlLength = parser.readVariableLengthLength()
      return Blob.fromParser(parser, vlLength)
    }

    if (innerType === SerializedTypeID.STI_ACCOUNT) {
      parser.skip(1)
      return AccountID.fromParser(parser)
    }

    throw new Error(`Data.getValue(): unsupported type ID: ${typeof innerType}`)
  }

  /**
   * Convert to JSON representation
   *
   * @returns JSON object with 'type' and 'value' fields
   */
  toJSON(): DataJSON {
    return {
      type: this.getInnerTypeString(),
      value: this.getValue().toJSON() as string | number | JsonObject,
    }
  }

  /**
   * Compare with another Data for equality
   *
   * @param other - Another Data to compare with
   * @returns true if both have the same inner type and data
   */
  equals(other: Data): boolean {
    if (!(other instanceof Data)) {
      return false
    }

    // Compare bytes directly
    if (this.bytes.length !== other.bytes.length) {
      return false
    }

    for (let i = 0; i < this.bytes.length; i++) {
      if (this.bytes[i] !== other.bytes[i]) {
        return false
      }
    }

    return true
  }

  getSType(): SerializedTypeID {
    return SerializedTypeID.STI_DATA
  }
}

export { Data }
