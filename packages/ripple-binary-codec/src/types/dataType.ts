import { BinaryParser } from '../serdes/binary-parser'
import {
  JsonObject,
  SerializedType,
  SerializedTypeID,
  TYPE_ID_TO_STRING,
  TYPE_STRING_TO_ID,
} from './serialized-type'
import { readUInt16BE, writeUInt16BE } from '../utils'

/**
 * Interface for DataType JSON representation
 */
interface DataTypeJSON extends JsonObject {
  type: string
}

/**
 * STDataType: Encodes XRPL's "DataType" type.
 *
 * This type wraps an inner SerializedTypeID to indicate what type of data
 * a field contains. It's encoded as a 2-byte unsigned integer representing
 * the inner type.
 *
 * Usage:
 *   DataType.from({ type: "Amount" })
 *   DataType.from("UInt64")
 *   DataType.fromParser(parser)
 */
class DataType extends SerializedType {
  private innerType: SerializedTypeID

  /**
   * Default bytes for DataType (STI_NOTPRESENT)
   */
  static readonly defaultBytes = new Uint8Array([0x00, 0x01])

  /**
   * Construct a DataType from bytes
   * @param bytes - 2-byte Uint8Array containing the inner type ID
   * @param innerType - Optional explicit inner type (used when constructing from value)
   * @throws Error if bytes is not a 2-byte Uint8Array
   */
  constructor(bytes?: Uint8Array, innerType?: SerializedTypeID) {
    const used = bytes ?? DataType.defaultBytes
    if (!(used instanceof Uint8Array) || used.length !== 2) {
      throw new Error(
        `DataType must be constructed from a 2-byte Uint8Array, got ${used?.length} bytes`,
      )
    }
    super(used)

    // If innerType is explicitly provided, use it; otherwise read from bytes
    if (innerType !== undefined) {
      this.innerType = innerType
    } else {
      this.innerType = readUInt16BE(used, 0) as unknown as SerializedTypeID
    }
  }

  /**
   * Construct from various input types
   *
   * @param value - Can be:
   *   - DataType instance (returns as-is)
   *   - DataTypeJSON object with 'type' field
   *   - String type name (e.g., "Amount", "UInt64")
   *   - SerializedTypeID enum value
   * @returns DataType instance
   * @throws Error if value type is not supported or type string is unknown
   */
  static from(value: unknown): DataType {
    if (value instanceof DataType) {
      return value
    }

    if (typeof value === 'object' && value !== null && 'type' in value) {
      const json = value as DataTypeJSON
      return DataType.fromTypeString(json.type)
    }

    if (typeof value === 'string') {
      return DataType.fromTypeString(value)
    }

    if (typeof value === 'number') {
      return DataType.fromTypeId(value as SerializedTypeID)
    }

    throw new Error(
      'DataType.from: value must be DataType, DataTypeJSON, string, or SerializedTypeID',
    )
  }

  /**
   * Construct from a type string
   *
   * @param typeStr - Type string like "Amount", "UInt64", etc.
   * @returns DataType instance
   * @throws Error if type string is not recognized
   */
  static fromTypeString(typeStr: string): DataType {
    const typeId = TYPE_STRING_TO_ID[typeStr]
    if (typeId === undefined) {
      throw new Error(`DataType: unsupported type string: ${typeStr}`)
    }
    return DataType.fromTypeId(typeId)
  }

  /**
   * Construct from a SerializedTypeID
   *
   * @param typeId - The SerializedTypeID enum value
   * @returns DataType instance
   */
  static fromTypeId(typeId: SerializedTypeID): DataType {
    const bytes = new Uint8Array(2)
    writeUInt16BE(bytes, typeId, 0)
    return new DataType(bytes, typeId)
  }

  /**
   * Read a DataType from a BinaryParser stream (2 bytes)
   *
   * @param parser - BinaryParser positioned at the start of a DataType
   * @returns DataType instance
   */
  static fromParser(parser: BinaryParser): DataType {
    const bytes = parser.read(2)
    return new DataType(bytes)
  }

  /**
   * Get the inner SerializedTypeID
   *
   * @returns The inner type ID
   */
  getInnerType(): SerializedTypeID {
    return this.innerType
  }

  /**
   * Set the inner SerializedTypeID
   *
   * @param typeId - The new inner type ID
   */
  setInnerType(typeId: SerializedTypeID): void {
    this.innerType = typeId
    writeUInt16BE(this.bytes, typeId, 0)
  }

  /**
   * Get the string representation of the inner type
   *
   * @returns String name of the type, or numeric string if unknown
   */
  getInnerTypeString(): string {
    return TYPE_ID_TO_STRING[this.innerType] || this.innerType.toString()
  }

  /**
   * Convert to JSON representation
   *
   * @returns JSON object with 'type' field
   */
  toJSON(): DataTypeJSON {
    return {
      type: this.getInnerTypeString(),
    }
  }

  getSType(): SerializedTypeID {
    return SerializedTypeID.STI_DATATYPE
  }
}

// Export the DataType class for external use
export { DataType }
