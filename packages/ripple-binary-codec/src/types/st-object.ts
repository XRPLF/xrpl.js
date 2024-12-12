import {
  DEFAULT_DEFINITIONS,
  FieldInstance,
  Bytes,
  XrplDefinitionsBase,
} from '../enums'
import { SerializedType, JsonObject } from './serialized-type'
import { xAddressToClassicAddress, isValidXAddress } from 'ripple-address-codec'
import { BinaryParser } from '../serdes/binary-parser'
import { BinarySerializer, BytesList } from '../serdes/binary-serializer'

import { STArray } from './st-array'
import { UInt64 } from './uint-64'

const OBJECT_END_MARKER_BYTE = Uint8Array.from([0xe1])
const OBJECT_END_MARKER = 'ObjectEndMarker'
const ST_OBJECT = 'STObject'
const DESTINATION = 'Destination'
const ACCOUNT = 'Account'
const SOURCE_TAG = 'SourceTag'
const DEST_TAG = 'DestinationTag'

/**
 * Break down an X-Address into an account and a tag
 *
 * @param field Name of field
 * @param xAddress X-Address corresponding to the field
 */
function handleXAddress(field: string, xAddress: string): JsonObject {
  const decoded = xAddressToClassicAddress(xAddress)

  let tagName
  if (field === DESTINATION) tagName = DEST_TAG
  else if (field === ACCOUNT) tagName = SOURCE_TAG
  else if (decoded.tag !== false)
    throw new Error(`${field} cannot have an associated tag`)

  return decoded.tag !== false
    ? { [field]: decoded.classicAddress, [tagName]: decoded.tag }
    : { [field]: decoded.classicAddress }
}

/**
 * Validate that two objects don't both have the same tag fields
 *
 * @param obj1 First object to check for tags
 * @param obj2 Second object to check for tags
 * @throws When both objects have SourceTag or DestinationTag
 */
function checkForDuplicateTags(obj1: JsonObject, obj2: JsonObject): void {
  if (!(obj1[SOURCE_TAG] === undefined || obj2[SOURCE_TAG] === undefined))
    throw new Error('Cannot have Account X-Address and SourceTag')
  if (!(obj1[DEST_TAG] === undefined || obj2[DEST_TAG] === undefined))
    throw new Error('Cannot have Destination X-Address and DestinationTag')
}

/**
 * Class for Serializing/Deserializing objects
 */
class STObject extends SerializedType {
  /**
   * Construct a STObject from a BinaryParser
   *
   * @param parser BinaryParser to read STObject from
   * @returns A STObject object
   */
  static fromParser(parser: BinaryParser): STObject {
    const list: BytesList = new BytesList()
    const bytes: BinarySerializer = new BinarySerializer(list)

    while (!parser.end()) {
      const field = parser.readField()
      if (field.name === OBJECT_END_MARKER) {
        break
      }

      const associatedValue = parser.readFieldValue(field)

      bytes.writeFieldAndValue(field, associatedValue)
      if (field.type.name === ST_OBJECT) {
        bytes.put(OBJECT_END_MARKER_BYTE)
      }
    }

    return new STObject(list.toBytes())
  }

  /**
   * Construct a STObject from a JSON object
   *
   * @param value An object to include
   * @param filter optional, denote which field to include in serialized object
   * @param definitions optional, types and values to use to encode/decode a transaction
   * @returns a STObject object
   */
  static from<T extends STObject | JsonObject>(
    value: T,
    filter?: (...any) => boolean,
    definitions: XrplDefinitionsBase = DEFAULT_DEFINITIONS,
  ): STObject {
    if (value instanceof STObject) {
      return value
    }

    const list: BytesList = new BytesList()
    const bytes: BinarySerializer = new BinarySerializer(list)

    let isUnlModify = false

    const xAddressDecoded = Object.entries(value).reduce((acc, [key, val]) => {
      let handled: JsonObject | undefined = undefined
      if (val && isValidXAddress(val.toString())) {
        handled = handleXAddress(key, val.toString())
        checkForDuplicateTags(handled, value)
      }
      return Object.assign(acc, handled ?? { [key]: val })
    }, {})

    let sorted = Object.keys(xAddressDecoded)
      .map((f: string): FieldInstance => definitions.field[f] as FieldInstance)
      .filter(
        (f: FieldInstance): boolean =>
          f !== undefined &&
          xAddressDecoded[f.name] !== undefined &&
          f.isSerialized,
      )
      .sort((a, b) => {
        return a.ordinal - b.ordinal
      })

    if (filter !== undefined) {
      sorted = sorted.filter(filter)
    }

    sorted.forEach((field) => {
      const associatedValue =
        field.type.name === ST_OBJECT
          ? this.from(xAddressDecoded[field.name], undefined, definitions)
          : field.type.name === 'STArray'
          ? STArray.from(xAddressDecoded[field.name], definitions)
          : field.type.name === 'UInt64'
          ? UInt64.from(xAddressDecoded[field.name], field.name)
          : field.associatedType.from(xAddressDecoded[field.name])

      if (associatedValue == undefined) {
        throw new TypeError(
          `Unable to interpret "${field.name}: ${
            xAddressDecoded[field.name]
          }".`,
        )
      }

      if ((associatedValue as unknown as Bytes).name === 'UNLModify') {
        // triggered when the TransactionType field has a value of 'UNLModify'
        isUnlModify = true
      }
      // true when in the UNLModify pseudotransaction (after the transaction type has been processed) and working with the
      // Account field
      // The Account field must not be a part of the UNLModify pseudotransaction encoding, due to a bug in rippled
      const isUnlModifyWorkaround = field.name == 'Account' && isUnlModify
      bytes.writeFieldAndValue(field, associatedValue, isUnlModifyWorkaround)
      if (field.type.name === ST_OBJECT) {
        bytes.put(OBJECT_END_MARKER_BYTE)
      }
    })

    return new STObject(list.toBytes())
  }

  /**
   * Get the JSON interpretation of this.bytes
   * @param definitions rippled definitions used to parse the values of transaction types and such.
   *                          Can be customized for sidechains and amendments.
   * @returns a JSON object
   */
  toJSON(definitions?: XrplDefinitionsBase): JsonObject {
    const objectParser = new BinaryParser(this.toString(), definitions)
    const accumulator = {}

    while (!objectParser.end()) {
      const field = objectParser.readField()
      if (field.name === OBJECT_END_MARKER) {
        break
      }

      accumulator[field.name] = objectParser
        .readFieldValue(field)
        .toJSON(definitions, field.name)
    }

    return accumulator
  }
}

export { STObject }
