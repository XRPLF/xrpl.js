import { bytesToHex } from '@xrplf/isomorphic/utils'

import { Blob } from './blob'
import { readDataValue } from './data'
import { dataTypeName } from './data-type'
import { SerializedType, JSON, JsonObject } from './serialized-type'
import { BinaryParser } from '../serdes/binary-parser'
import { BinarySerializer, BytesList } from '../serdes/binary-serializer'

/** STJson's leading byte for an array. */
const JSON_TYPE_ARRAY = 0x01

/** STJson's leading byte for an object. */
const JSON_TYPE_OBJECT = 0x00

/** Serialized type code of STJson (STI_JSON). */
const STI_JSON = 29

/** STI_NUMBER, which xrpld's STJson reads as raw bytes (STJson.cpp makeValueFromVLWithType). */
const STI_NUMBER_NAME = 'NUMBER'

/**
 * Reads one STJson value: a variable-length blob holding a one-byte
 * serialized type code and the value, or an empty blob for null.
 *
 * @param parser - The parser positioned at the value's length prefix.
 * @returns The value's JSON form.
 */
function readJsonValue(parser: BinaryParser): JSON {
  const blob = parser.readVariableLength()
  if (blob.length === 0) {
    return null
  }
  const valueParser = new BinaryParser(bytesToHex(blob))
  const code = valueParser.readUInt8()
  if (code === STI_JSON) {
    return readJsonPayload(valueParser)
  }
  const typeName = dataTypeName(code)
  const value =
    typeName === STI_NUMBER_NAME
      ? undefined
      : readDataValue(valueParser, typeName)
  return value === undefined
    ? bytesToHex(valueParser.read(valueParser.size()))
    : value.toJSON()
}

/**
 * Reads a length-prefixed STJson payload into its JSON form: an object whose
 * keys are the hex of the stored key bytes, or an array (STJson::getJson).
 *
 * @param parser - The parser positioned at the payload's length prefix.
 * @returns The object or array.
 */
function readJsonPayload(parser: BinaryParser): JSON {
  const payload = parser.readVariableLength()
  if (payload.length === 0) {
    return {}
  }
  const body = new BinaryParser(bytesToHex(payload))
  if (body.readUInt8() === JSON_TYPE_ARRAY) {
    const array: JSON[] = []
    while (!body.end()) {
      array.push(readJsonValue(body))
    }
    return array
  }
  const object: JsonObject = {}
  while (!body.end()) {
    const key = bytesToHex(body.readVariableLength())
    object[key] = readJsonValue(body)
  }
  return object
}

/**
 * Whether a JSON value is an object with no keys.
 *
 * @param value - The value.
 * @returns True for `{}`.
 */
function isEmptyObject(value: JSON): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  )
}

/**
 * STJson: a length-prefixed object or array of typed values, used for
 * contract state (sfContractJson). It is decoded to the JSON xrpld returns;
 * like xrpld (STParsedJSON.cpp, STI_JSON), a non-empty one cannot be built
 * from JSON.
 */
class Json extends SerializedType {
  /**
   * @param bytes - The length-prefixed payload; defaults to an empty object.
   */
  constructor(bytes?: Uint8Array) {
    super(
      bytes === undefined || bytes.length === 0
        ? Json.emptyPayload(JSON_TYPE_OBJECT)
        : bytes,
    )
  }

  /**
   * The encoding of an empty object or array, as STJson::add writes it.
   *
   * @param jsonType - JSON_TYPE_OBJECT or JSON_TYPE_ARRAY.
   * @returns The length-prefixed payload.
   */
  private static emptyPayload(jsonType: number): Uint8Array {
    return Uint8Array.from([1, jsonType])
  }

  /**
   * Reads a Json from a BinaryParser.
   *
   * @param parser - The parser positioned at the Json's length prefix.
   * @returns The Json.
   * @throws When the payload is malformed.
   */
  static fromParser(parser: BinaryParser): Json {
    const payload = parser.readVariableLength()
    const list = new BytesList()
    new BinarySerializer(list).writeLengthEncoded(new Blob(payload))
    const json = new Json(list.toBytes())
    json.toJSON()
    return json
  }

  /**
   * Returns a Json unchanged, or an empty object or array. A non-empty value
   * cannot be built from JSON, because its JSON form does not name the
   * serialized type of each value.
   *
   * @param value - A Json, `{}` or `[]`.
   * @returns The Json.
   * @throws For any other value.
   */
  static from(value: Json | JSON): Json {
    if (value instanceof Json) {
      return value
    }
    if (Array.isArray(value) && value.length === 0) {
      return new Json(Json.emptyPayload(JSON_TYPE_ARRAY))
    }
    if (isEmptyObject(value)) {
      return new Json(Json.emptyPayload(JSON_TYPE_OBJECT))
    }
    throw new Error('Json: encoding from JSON is not supported')
  }

  /**
   * The JSON form of this Json.
   *
   * @returns An object with hex keys, or an array.
   */
  toJSON(): JSON {
    return readJsonPayload(new BinaryParser(this.toHex()))
  }
}

export { Json }
