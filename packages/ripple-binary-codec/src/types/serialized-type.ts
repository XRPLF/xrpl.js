import { BytesList } from '../serdes/binary-serializer'
import { BinaryParser } from '../serdes/binary-parser'
import { XrplDefinitionsBase } from '../enums'
import { bytesToHex } from '@xrplf/isomorphic/utils'
import definitions from '../enums/definitions.json'

/**
 * Enum for SerializedTypeID values used in XRPL
 * These match the C++ implementation's STI_ constants
 */
export enum SerializedTypeID {
  STI_NOTPRESENT = 0,
  STI_UINT16 = 1,
  STI_UINT32 = 2,
  STI_UINT64 = 3,
  STI_UINT128 = 4,
  STI_UINT256 = 5,
  STI_AMOUNT = 6,
  STI_VL = 7,
  STI_ACCOUNT = 8,
  STI_NUMBER = 9,
  STI_INT32 = 10,
  STI_INT64 = 11,

  STI_OBJECT = 14,
  STI_ARRAY = 15,

  STI_UINT8 = 16,
  STI_UINT160 = 17,
  STI_PATHSET = 18,
  STI_VECTOR256 = 19,
  STI_UINT96 = 20,
  STI_UINT192 = 21,
  STI_UINT384 = 22,
  STI_UINT512 = 23,
  STI_ISSUE = 24,
  STI_XCHAIN_BRIDGE = 25,
  STI_CURRENCY = 26,
  STI_DATA = 27,
  STI_DATATYPE = 28,
  STI_JSON = 29,
}

/**
 * Maps built dynamically from definitions.json TYPES.
 * This ensures type string names (e.g. "Hash256", "Hash128") stay in sync
 * with the canonical definitions rather than using hardcoded uppercase variants.
 */

// Map of type name strings to SerializedTypeID values
export const TYPE_STRING_TO_ID: Record<string, SerializedTypeID> = {}

// Map of numeric type codes to SerializedTypeID values
export const TYPE_NUMBER_TO_ID: Record<number, SerializedTypeID> = {}

// Map of SerializedTypeID values to type name strings
export const TYPE_ID_TO_STRING: Record<number, string> = {}

// Populate all three maps from definitions.json TYPES
for (const [name, id] of Object.entries(definitions.TYPES)) {
  if (id >= 0) {
    const typeId = id as SerializedTypeID
    TYPE_STRING_TO_ID[name] = typeId
    TYPE_NUMBER_TO_ID[id] = typeId
    TYPE_ID_TO_STRING[typeId] = name
  }
}

type JSON = string | number | boolean | null | undefined | JSON[] | JsonObject

type JsonObject = { [key: string]: JSON }

/**
 * The base class for all binary-codec types
 */
class SerializedType {
  protected readonly bytes: Uint8Array = new Uint8Array(0)

  constructor(bytes?: Uint8Array) {
    this.bytes = bytes ?? new Uint8Array(0)
  }

  static fromParser(parser: BinaryParser, hint?: number): SerializedType {
    throw new Error('fromParser not implemented')
    return this.fromParser(parser, hint)
  }

  static from(value: SerializedType | JSON | bigint): SerializedType {
    throw new Error('from not implemented')
    return this.from(value)
  }

  /**
   * Write the bytes representation of a SerializedType to a BytesList
   *
   * @param list The BytesList to write SerializedType bytes to
   */
  toBytesSink(list: BytesList): void {
    list.put(this.bytes)
  }

  /**
   * Get the hex representation of a SerializedType's bytes
   *
   * @returns hex String of this.bytes
   */
  toHex(): string {
    return bytesToHex(this.toBytes())
  }

  /**
   * Get the bytes representation of a SerializedType
   *
   * @returns A Uint8Array of the bytes
   */
  toBytes(): Uint8Array {
    if (this.bytes) {
      return this.bytes
    }
    const bytes = new BytesList()
    this.toBytesSink(bytes)
    return bytes.toBytes()
  }

  /**
   * Return the JSON representation of a SerializedType
   *
   * @param _definitions rippled definitions used to parse the values of transaction types and such.
   *                          Unused in default, but used in STObject, STArray
   *                          Can be customized for sidechains and amendments.
   * @returns any type, if not overloaded returns hexString representation of bytes
   */
  toJSON(_definitions?: XrplDefinitionsBase, _fieldName?: string): JSON {
    return this.toHex()
  }

  /**
   * @returns hexString representation of this.bytes
   */
  toString(): string {
    return this.toHex()
  }

  getSType(): SerializedTypeID {
    return this.getSType()
  }
}

/**
 * Base class for SerializedTypes that are comparable.
 *
 * @template T - What types you want to allow comparisons between. You must specify all types. Primarily used to allow
 * comparisons between built-in types (like `string`) and SerializedType subclasses (like `Hash`).
 *
 * Ex. `class Hash extends Comparable<Hash | string>`
 */
class Comparable<T extends Object> extends SerializedType {
  lt(other: T): boolean {
    return this.compareTo(other) < 0
  }

  eq(other: T): boolean {
    return this.compareTo(other) === 0
  }

  gt(other: T): boolean {
    return this.compareTo(other) > 0
  }

  gte(other: T): boolean {
    return this.compareTo(other) > -1
  }

  lte(other: T): boolean {
    return this.compareTo(other) < 1
  }

  /**
   * Overload this method to define how two Comparable SerializedTypes are compared
   *
   * @param other The comparable object to compare this to
   * @returns A number denoting the relationship of this and other
   */
  compareTo(other: T): number {
    throw new Error(`cannot compare ${this.toString()} and ${other.toString()}`)
  }
}

export { SerializedType, Comparable, JSON, JsonObject }
