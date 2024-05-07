import { DEFAULT_DEFINITIONS, XrplDefinitionsBase } from '../enums'
import { SerializedType, JsonObject } from './serialized-type'
import { STObject } from './st-object'
import { BinaryParser } from '../serdes/binary-parser'
import { concat } from '@xrplf/isomorphic/utils'

const ARRAY_END_MARKER = Uint8Array.from([0xf1])
const ARRAY_END_MARKER_NAME = 'ArrayEndMarker'

const OBJECT_END_MARKER = Uint8Array.from([0xe1])

/**
 * TypeGuard for Array<JsonObject>
 */
function isObjects(args): args is Array<JsonObject> {
  return (
    Array.isArray(args) &&
    args.every(
      (arg) =>
        typeof arg === 'object' &&
        Object.keys(arg).length === 1 &&
        typeof Object.values(arg)[0] === 'object',
    )
  )
}

/**
 * Class for serializing and deserializing Arrays of Objects
 */
class STArray extends SerializedType {
  /**
   * Construct an STArray from a BinaryParser
   *
   * @param parser BinaryParser to parse an STArray from
   * @returns An STArray Object
   */
  static fromParser(parser: BinaryParser): STArray {
    const bytes: Array<Uint8Array> = []

    while (!parser.end()) {
      const field = parser.readField()
      if (field.name === ARRAY_END_MARKER_NAME) {
        break
      }

      bytes.push(
        field.header,
        parser.readFieldValue(field).toBytes(),
        OBJECT_END_MARKER,
      )
    }

    bytes.push(ARRAY_END_MARKER)
    return new STArray(concat(bytes))
  }

  /**
   * Construct an STArray from an Array of JSON Objects
   *
   * @param value STArray or Array of Objects to parse into an STArray
   * @param definitions optional, types and values to use to encode/decode a transaction
   * @returns An STArray object
   */
  static from<T extends STArray | Array<JsonObject>>(
    value: T,
    definitions: XrplDefinitionsBase = DEFAULT_DEFINITIONS,
  ): STArray {
    if (value instanceof STArray) {
      return value
    }

    if (isObjects(value)) {
      const bytes: Array<Uint8Array> = []
      value.forEach((obj) => {
        bytes.push(STObject.from(obj, undefined, definitions).toBytes())
      })

      bytes.push(ARRAY_END_MARKER)
      return new STArray(concat(bytes))
    }

    throw new Error('Cannot construct STArray from value given')
  }

  /**
   * Return the JSON representation of this.bytes
   *
   * @param definitions optional, types and values to use to encode/decode a transaction
   * @returns An Array of JSON objects
   */
  toJSON(
    definitions: XrplDefinitionsBase = DEFAULT_DEFINITIONS,
  ): Array<JsonObject> {
    const result: Array<JsonObject> = []

    const arrayParser = new BinaryParser(this.toString(), definitions)

    while (!arrayParser.end()) {
      const field = arrayParser.readField()
      if (field.name === ARRAY_END_MARKER_NAME) {
        break
      }

      const outer = {}
      outer[field.name] = STObject.fromParser(arrayParser).toJSON(definitions)
      result.push(outer)
    }

    return result
  }
}

export { STArray }
