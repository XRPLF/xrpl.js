import * as enums from './definitions.json'
import { SerializedType } from '../types/serialized-type'
import { Buffer } from 'buffer/'
import { BytesList } from '../binary'
import { coreTypes } from '../types'

const TYPE_WIDTH = 2
const LEDGER_ENTRY_WIDTH = 2
const TRANSACTION_TYPE_WIDTH = 2
const TRANSACTION_RESULT_WIDTH = 1

interface DefinitionsData {
  TYPES: Record<string, number>
  LEDGER_ENTRY_TYPES: Record<string, number>
  FIELDS: (string | FieldInfo)[][]
  TRANSACTION_RESULTS: Record<string, number>
  TRANSACTION_TYPES: Record<string, number>
}

/*
 * @brief: Serialize a field based on type_code and Field.nth
 */
function fieldHeader(type: number, nth: number): Buffer {
  const header: Array<number> = []
  if (type < 16) {
    if (nth < 16) {
      header.push((type << 4) | nth)
    } else {
      header.push(type << 4, nth)
    }
  } else if (nth < 16) {
    header.push(nth, type)
  } else {
    header.push(0, type, nth)
  }
  return Buffer.from(header)
}

/*
 * @brief: Bytes, name, and ordinal representing one type, ledger_type, transaction type, or result
 */
export class Bytes {
  readonly bytes: Buffer

  constructor(
    readonly name: string,
    readonly ordinal: number,
    readonly ordinalWidth: number,
  ) {
    this.bytes = Buffer.alloc(ordinalWidth)
    for (let i = 0; i < ordinalWidth; i++) {
      this.bytes[ordinalWidth - i - 1] = (ordinal >>> (i * 8)) & 0xff
    }
  }

  toJSON(): string {
    return this.name
  }

  toBytesSink(sink: BytesList): void {
    sink.put(this.bytes)
  }

  toBytes(): Uint8Array {
    return this.bytes
  }
}

/*
 * @brief: Collection of Bytes objects, mapping bidirectionally
 */
class BytesLookup {
  constructor(types: Record<string, number>, readonly ordinalWidth: number) {
    Object.entries(types).forEach(([k, v]) => {
      this.add(k, v)
    })
  }

  /**
   * Add a new name value pair to the BytesLookup. Does not work properly if either name or value already
   * exist within the BytesLookup.
   *
   * @param name - A human readable name for the field.
   * @param value - The numeric value for the field.
   */
  add(name: string, value: number): void {
    this[name] = new Bytes(name, value, this.ordinalWidth)
    this[value.toString()] = this[name]
  }

  from(value: Bytes | string): Bytes {
    return value instanceof Bytes ? value : (this[value] as Bytes)
  }

  // TODO: Type this better
  fromParser(parser: any): Bytes {
    return this.from(parser.readUIntN(this.ordinalWidth).toString())
  }
}

/*
 * type FieldInfo is the type of the objects containing information about each field in definitions.json
 */
interface FieldInfo {
  nth: number
  isVLEncoded: boolean
  isSerialized: boolean
  isSigningField: boolean
  type: string
}

interface FieldInstance {
  readonly nth: number
  readonly isVariableLengthEncoded: boolean
  readonly isSerialized: boolean
  readonly isSigningField: boolean
  readonly type: Bytes
  readonly ordinal: number
  readonly name: string
  readonly header: Buffer
  readonly associatedType: typeof SerializedType
}

function buildField(
  [name, info]: [string, FieldInfo],
  typeOrdinal: number,
): FieldInstance {
  const field = fieldHeader(typeOrdinal, info.nth)
  return {
    name: name,
    nth: info.nth,
    isVariableLengthEncoded: info.isVLEncoded,
    isSerialized: info.isSerialized,
    isSigningField: info.isSigningField,
    ordinal: (typeOrdinal << 16) | info.nth,
    type: new Bytes(info.type, typeOrdinal, TYPE_WIDTH),
    header: field,
    associatedType: SerializedType, // For later assignment in ./types/index.js or Definitions.updateAll(...)
  }
}

/*
 * @brief: The collection of all fields as defined in definitions.json
 */
class FieldLookup {
  constructor(
    fields: Array<[string, FieldInfo]>,
    types: Record<string, number>,
  ) {
    fields.forEach(([k, v]) => {
      this.add(k, v, types[v.type])
    })
  }

  public add(name: string, field_info: FieldInfo, typeOrdinal: number): void {
    this[name] = buildField([name, field_info], typeOrdinal)
    this[this[name].ordinal.toString()] = this[name]
  }

  fromString(value: string): FieldInstance {
    return this[value] as FieldInstance
  }
}
/**
 * Stores the various types and fields for rippled to be used to encode/decode information later on.
 *
 */
class DefinitionContents {
  field: FieldLookup
  ledgerEntryType: BytesLookup
  type: BytesLookup
  transactionResult: BytesLookup
  transactionType: BytesLookup
  transactionNames: string[]
  addedDataTypes: Record<string, typeof SerializedType>

  /**
   * Present rippled types in a typed and updatable format.
   *
   * @param enums - A json encoding of the core types, transaction types, transaction results, transaction names, and fields.
   * For an example of the format see `definitions.json`
   * To generate a new definitions file from rippled source code, use this tool: https://github.com/RichardAH/xrpl-codec-gen

   */
  constructor(enums: DefinitionsData) {
    this.type = new BytesLookup(enums.TYPES, TYPE_WIDTH)
    this.ledgerEntryType = new BytesLookup(
      enums.LEDGER_ENTRY_TYPES,
      LEDGER_ENTRY_WIDTH,
    )
    this.transactionType = new BytesLookup(
      enums.TRANSACTION_TYPES,
      TRANSACTION_TYPE_WIDTH,
    )
    this.transactionResult = new BytesLookup(
      enums.TRANSACTION_RESULTS,
      TRANSACTION_RESULT_WIDTH,
    )
    this.field = new FieldLookup(
      enums.FIELDS as Array<[string, FieldInfo]>,
      enums.TYPES,
    )
    this.transactionNames = Object.entries(enums.TRANSACTION_TYPES)
      .filter(([_key, value]) => value >= 0)
      .map(([key, _value]) => key)

    this.addedDataTypes = {}
  }

  /**
   * Update the values of a Definitions object in-place.
   *
   * @param newDefinitions a definitions object to copy the fields of.
   * @param types a list of type objects with the same name as the fields defined. Used to call associateTypes(types)
   */
  public updateAll(
    newDefinitions: DefinitionContents,
    types: Record<string, typeof SerializedType>,
  ): void {
    this.field = newDefinitions.field
    this.ledgerEntryType = newDefinitions.ledgerEntryType
    this.type = newDefinitions.type
    this.transactionResult = newDefinitions.transactionResult
    this.transactionType = newDefinitions.transactionType
    this.transactionNames = newDefinitions.transactionNames
    this.addedDataTypes = newDefinitions.addedDataTypes

    this.associateTypes(types)
  }

  /**
   * Dynamically adds one new type at runtime.
   *
   * @param name - The name of the type. Should match the name of the newType class.
   * @param typeOrdinal - The number used to identify this type in the encoding.
   * @param newType - A corresponding class which implements SerializedType functions to allow for encoding/decoding.
   *                  The name of this class should match name.
   * @throws If name and newType's classname are different. // TODO: Should this actually be a requirement?
   */
  public addNewType(
    name: string,
    typeOrdinal: number,
    newType: typeof SerializedType,
  ): void {
    if (name != newType.name) {
      throw new Error(
        `Name should be the same as NewType's classname. Instead received: ${name} and ${newType.name}`,
      )
    }
    this.transactionType.add(name, typeOrdinal)
    this.addedDataTypes[name] = newType
    this.associateTypes()
  }

  /**
   * Associates each Field to a corresponding type that TypeScript can recognize.
   *
   * @param types a list of type objects with the same name as the fields defined.
   *              Defaults to the library's core definitions.
   */
  public associateTypes(
    types: Record<string, typeof SerializedType> = coreTypes,
  ): void {
    if (coreTypes == undefined) {
      console.log('ERROR ERROR ERROR AAAAAAA')
    }
    // Overwrite any existing type definitions with the given types
    const allTypes = Object.assign({}, this.addedDataTypes, types)

    Object.values(this.field).forEach((field) => {
      field.associatedType = allTypes[field.type.name]
    })

    this.field['TransactionType'].associatedType = this.transactionType
    this.field['TransactionResult'].associatedType = this.transactionResult
    this.field['LedgerEntryType'].associatedType = this.ledgerEntryType
  }
}

/**
 * To update the definitions, use `Definitions.updateAll(<Your imported definitions.json>)`
 */
const DEFINITIONS = new DefinitionContents(enums)
DEFINITIONS.associateTypes()

const Type = DEFINITIONS.type
const LedgerEntryType = DEFINITIONS.ledgerEntryType
const TransactionType = DEFINITIONS.transactionType
const TransactionResult = DEFINITIONS.transactionResult
const Field = DEFINITIONS.field

/*
 * @brief: All valid transaction types
 */
const TRANSACTION_TYPES = DEFINITIONS.transactionNames

export {
  DefinitionContents,
  DEFINITIONS,
  Field,
  FieldInstance,
  Type,
  LedgerEntryType,
  TransactionResult,
  TransactionType,
  TRANSACTION_TYPES,
}
