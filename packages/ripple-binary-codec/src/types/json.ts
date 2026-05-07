/* eslint-disable max-lines */
import { BinaryParser } from '../serdes/binary-parser'
import { JsonObject, SerializedType, SerializedTypeID } from './serialized-type'
import { bytesToHex } from '@xrplf/isomorphic/utils'
import { BinarySerializer, BytesList } from '../serdes/binary-serializer'

/**
 * STJson: Serialized Type for JSON-like structures (objects or arrays).
 *
 * Supports two modes:
 * - Object: Key-value pairs where keys are VL-encoded strings
 * - Array: Ordered list of values
 *
 * Values are [SType marker][VL-encoded SType serialization].
 * Values can be any SType, including nested STJson.
 *
 * Serialization format: [type_byte][VL_length][data...]
 * - type_byte: 0x00 = Object, 0x01 = Array
 *
 * Depth constraint: Maximum nesting depth of 1 level
 */
class STJson extends SerializedType {
  private static readonly JsonType = {
    Object: 0x00,
    Array: 0x01,
  }

  private data: Map<string, SerializedType | null> | (SerializedType | null)[]
  private jsonType: number
  private default_ = false

  /**
   * Construct STJson from bytes
   * @param bytes - Uint8Array containing serialized JSON
   */
  constructor(bytes: Uint8Array) {
    super(bytes)
    this.data = new Map()
    this.jsonType = STJson.JsonType.Object
  }

  /**
   * Create an empty STJson with the given type
   */
  private static createEmpty(
    type: number,
    initialData?:
      | Map<string, SerializedType | null>
      | (SerializedType | null)[],
  ): STJson {
    const json = new STJson(new Uint8Array())
    json.data = initialData ?? (type === STJson.JsonType.Array ? [] : new Map())
    json.jsonType = type
    return json
  }

  /**
   * Parse STJson from BinaryParser
   *
   * @param parser - BinaryParser positioned at the start of STJson
   * @returns STJson instance
   */
  static fromParser(parser: BinaryParser): STJson {
    const dataLength = parser.readVariableLengthLength()

    if (dataLength < 0) {
      throw new Error('Invalid STJson length')
    }

    if (dataLength === 0) {
      const json = new STJson(new Uint8Array())
      json.data = new Map()
      return json
    }

    // Read type byte
    const typeByte = parser.read(1)[0]
    const type = typeByte
    const initialBytesLeft = parser.size()

    if (type === STJson.JsonType.Array) {
      const array: (SerializedType | null)[] = []
      while (
        parser.size() > 0 &&
        initialBytesLeft - parser.size() < dataLength
      ) {
        const valueVL = parser.readVariableLength()
        if (valueVL.length > 0) {
          const valueSit = new BinaryParser(bytesToHex(valueVL))
          const value = STJson.makeValueFromVLWithType(valueSit)
          array.push(value)
        } else {
          array.push(null)
        }
      }

      const json = new STJson(new Uint8Array())
      json.data = array
      json.jsonType = STJson.JsonType.Array
      return json
    } else {
      // JsonType.Object
      const map = new Map<string, SerializedType | null>()
      while (
        parser.size() > 0 &&
        initialBytesLeft - parser.size() < dataLength
      ) {
        const [key, value] = STJson.parsePair(parser)
        map.set(key, value)
      }

      const json = new STJson(new Uint8Array())
      json.data = map
      json.jsonType = STJson.JsonType.Object
      return json
    }
  }

  /**
   * Parse a single key-value pair from the parser
   */
  private static parsePair(
    parser: BinaryParser,
  ): [string, SerializedType | null] {
    const keyVL = parser.readVariableLength()
    const key = new TextDecoder().decode(keyVL)

    const valueVL = parser.readVariableLength()
    let value: SerializedType | null = null

    if (valueVL.length > 0) {
      const valueSit = new BinaryParser(bytesToHex(valueVL))
      value = STJson.makeValueFromVLWithType(valueSit)
    }

    return [key, value]
  }

  /**
   * Factory for SType value from VL blob (with SType marker)
   */
  private static makeValueFromVLWithType(parser: BinaryParser): SerializedType {
    if (parser.size() === 0) {
      throw new Error('Empty data when parsing STJson value')
    }

    const typeId = parser.read(1)[0]

    // Delegate to appropriate type's fromParser
    // This is a placeholder - actual implementation would dispatch to concrete types
    // For now, we create an STJson if type is Object or Array
    if (typeId === STJson.JsonType.Object || typeId === STJson.JsonType.Array) {
      return STJson.fromParser(parser)
    }

    throw new Error(`Unsupported type ID in STJson: ${typeId}`)
  }

  /**
   * Check if this is an array type
   */
  isArray(): boolean {
    return this.jsonType === STJson.JsonType.Array
  }

  /**
   * Check if this is an object type
   */
  isObject(): boolean {
    return this.jsonType === STJson.JsonType.Object
  }

  /**
   * Get the JSON type
   */
  getType(): number {
    return this.jsonType
  }

  /**
   * Get nesting depth (0 = no nesting, 1 = one level of nesting)
   */
  getDepth(): number {
    if (this.isArray()) {
      const array = this.data as (SerializedType | null)[]
      for (const value of array) {
        if (value && value instanceof STJson) {
          return 1 + value.getDepth()
        }
      }
      return 0
    } else {
      // isObject()
      const map = this.data as Map<string, SerializedType | null>
      for (const value of map.values()) {
        if (value && value instanceof STJson) {
          return 1 + value.getDepth()
        }
      }
      return 0
    }
  }

  /**
   * Validate nesting depth (max 1 level)
   */
  private validateDepth(
    value: SerializedType | null,
    currentDepth: number,
  ): void {
    if (!value) {
      return
    }

    if (!(value instanceof STJson)) {
      return
    }

    const valueDepth = value.getDepth()
    if (currentDepth + valueDepth > 1) {
      throw new Error('STJson nesting depth exceeds maximum of 1')
    }
  }

  /**
   * Set a field in an object
   */
  setObjectField(key: string, value: SerializedType | null): void {
    if (!this.isObject()) {
      throw new Error('STJson::setObjectField called on non-object')
    }
    this.validateDepth(value, 0)
    ;(this.data as Map<string, SerializedType | null>).set(key, value)
  }

  /**
   * Get a field from an object
   */
  getObjectField(key: string): SerializedType | null | undefined {
    if (!this.isObject()) {
      return undefined
    }
    return (this.data as Map<string, SerializedType | null>).get(key)
  }

  /**
   * Set a nested object field (one level deep)
   */
  setNestedObjectField(
    key: string,
    nestedKey: string,
    value: SerializedType | null,
  ): void {
    if (!this.isObject()) {
      throw new Error('STJson::setNestedObjectField called on non-object')
    }

    const map = this.data as Map<string, SerializedType | null>
    let nestedObj = map.get(key)

    if (!nestedObj || !(nestedObj instanceof STJson) || !nestedObj.isObject()) {
      const newNested = STJson.createEmpty(STJson.JsonType.Object)
      map.set(key, newNested as SerializedType)
      nestedObj = newNested
    }

    if (nestedObj instanceof STJson) {
      nestedObj.setObjectField(nestedKey, value)
    }
  }

  /**
   * Get a nested object field
   */
  getNestedObjectField(
    key: string,
    nestedKey: string,
  ): SerializedType | null | undefined {
    if (!this.isObject()) {
      return undefined
    }

    const nestedObj = (this.data as Map<string, SerializedType | null>).get(key)
    if (nestedObj instanceof STJson && nestedObj.isObject()) {
      return nestedObj.getObjectField(nestedKey)
    }
    return undefined
  }

  /**
   * Get the inner data as a Map (for objects)
   */
  getMap(): Map<string, SerializedType | null> {
    if (!this.isObject()) {
      throw new Error('STJson is not an object type')
    }
    return this.data as Map<string, SerializedType | null>
  }

  /**
   * Get the inner data as an array
   */
  getArray(): (SerializedType | null)[] {
    if (!this.isArray()) {
      throw new Error('STJson is not an array type')
    }
    return this.data as (SerializedType | null)[]
  }

  /**
   * Push an element to an array
   */
  pushArrayElement(value: SerializedType | null): void {
    if (!this.isArray()) {
      throw new Error('STJson::pushArrayElement called on non-array')
    }
    this.validateDepth(value, 0)
    ;(this.data as (SerializedType | null)[]).push(value)
  }

  /**
   * Get an array element by index
   */
  getArrayElement(index: number): SerializedType | null | undefined {
    if (!this.isArray()) {
      return undefined
    }
    const array = this.data as (SerializedType | null)[]
    return array[index]
  }

  /**
   * Set an array element by index
   */
  setArrayElement(index: number, value: SerializedType | null): void {
    if (!this.isArray()) {
      throw new Error('STJson::setArrayElement called on non-array')
    }
    this.validateDepth(value, 0)

    const array = this.data as (SerializedType | null)[]
    // Auto-resize with nulls if needed
    if (index >= array.length) {
      array.length = index + 1
      array.fill(null)
    }
    array[index] = value
  }

  /**
   * Set a field within an array element (element must be an object)
   */
  setArrayElementField(
    index: number,
    key: string,
    value: SerializedType | null,
  ): void {
    if (!this.isArray()) {
      throw new Error('STJson::setArrayElementField called on non-array')
    }

    this.validateDepth(value, 1)

    const array = this.data as (SerializedType | null)[]
    // Auto-resize with nulls if needed
    if (index >= array.length) {
      array.length = index + 1
      array.fill(null)
    }

    let element = array[index]
    if (!element || !(element instanceof STJson) || !element.isObject()) {
      const newElement = STJson.createEmpty(STJson.JsonType.Object)
      array[index] = newElement as SerializedType
      element = newElement
    }

    if (element instanceof STJson) {
      element.setObjectField(key, value)
    }
  }

  /**
   * Get a field within an array element
   */
  getArrayElementField(
    index: number,
    key: string,
  ): SerializedType | null | undefined {
    if (!this.isArray()) {
      return undefined
    }

    const array = this.data as (SerializedType | null)[]
    if (index >= array.length) {
      return undefined
    }

    const element = array[index]
    if (element instanceof STJson && element.isObject()) {
      return element.getObjectField(key)
    }
    return undefined
  }

  /**
   * Get the size of the array
   */
  arraySize(): number {
    if (!this.isArray()) {
      return 0
    }
    return (this.data as (SerializedType | null)[]).length
  }

  /**
   * Set a nested array element (array stored in object field)
   */
  setNestedArrayElement(
    key: string,
    index: number,
    value: SerializedType | null,
  ): void {
    if (!this.isObject()) {
      throw new Error('STJson::setNestedArrayElement called on non-object')
    }

    this.validateDepth(value, 1)

    const map = this.data as Map<string, SerializedType | null>
    let arrayJson = map.get(key)

    if (!arrayJson || !(arrayJson instanceof STJson) || !arrayJson.isArray()) {
      const newArray = STJson.createEmpty(STJson.JsonType.Array)
      map.set(key, newArray as SerializedType)
      arrayJson = newArray
    }

    if (arrayJson instanceof STJson) {
      arrayJson.setArrayElement(index, value)
    }
  }

  /**
   * Set a field within a nested array element
   */
  // eslint-disable-next-line max-params -- all 4 params are needed to address a nested array element field
  setNestedArrayElementField(
    key: string,
    index: number,
    nestedKey: string,
    value: SerializedType | null,
  ): void {
    if (!this.isObject()) {
      throw new Error('STJson::setNestedArrayElementField called on non-object')
    }

    this.validateDepth(value, 1)

    const map = this.data as Map<string, SerializedType | null>
    let arrayJson = map.get(key)

    if (!arrayJson || !(arrayJson instanceof STJson) || !arrayJson.isArray()) {
      const newArray = STJson.createEmpty(STJson.JsonType.Array)
      map.set(key, newArray as SerializedType)
      arrayJson = newArray
    }

    if (arrayJson instanceof STJson) {
      arrayJson.setArrayElementField(index, nestedKey, value)
    }
  }

  /**
   * Get a nested array element
   */
  getNestedArrayElement(
    key: string,
    index: number,
  ): SerializedType | null | undefined {
    if (!this.isObject()) {
      return undefined
    }

    const arrayJson = (this.data as Map<string, SerializedType | null>).get(key)
    if (arrayJson instanceof STJson && arrayJson.isArray()) {
      return arrayJson.getArrayElement(index)
    }
    return undefined
  }

  /**
   * Get a field within a nested array element
   */
  getNestedArrayElementField(
    key: string,
    index: number,
    nestedKey: string,
  ): SerializedType | null | undefined {
    if (!this.isObject()) {
      return undefined
    }

    const arrayJson = (this.data as Map<string, SerializedType | null>).get(key)
    if (arrayJson instanceof STJson && arrayJson.isArray()) {
      return arrayJson.getArrayElementField(index, nestedKey)
    }
    return undefined
  }

  /**
   * Serialize to binary
   */
  add(s: BinarySerializer): void {
    const bytesList = new BytesList()
    const tmp = new BinarySerializer(bytesList)

    // Add type byte
    tmp.put(new Uint8Array([this.jsonType]))

    if (this.isArray()) {
      const array = this.data as (SerializedType | null)[]
      for (const value of array) {
        STJson.addVLValue(tmp, value)
      }
    } else {
      // isObject()
      const map = this.data as Map<string, SerializedType | null>
      for (const [key, value] of map.entries()) {
        STJson.addVLKey(tmp, key)
        STJson.addVLValue(tmp, value)
      }
    }

    const innerBytes = bytesList.toBytes()
    const lengthBytes = BinarySerializer.encodeVariableLength(innerBytes.length)
    s.put(lengthBytes)
    s.put(innerBytes)
  }

  /**
   * Encode a key as VL
   */
  private static addVLKey(s: BinarySerializer, str: string): void {
    const keyBytes = new TextEncoder().encode(str)
    const lengthBytes = BinarySerializer.encodeVariableLength(keyBytes.length)
    s.put(lengthBytes)
    s.put(keyBytes)
  }

  /**
   * Encode a value as [SType marker][VL]
   */
  private static addVLValue(
    s: BinarySerializer,
    value: SerializedType | null,
  ): void {
    if (!value) {
      s.put(BinarySerializer.encodeVariableLength(0))
      return
    }

    const bytesList = new BytesList()
    const tmp = new BinarySerializer(bytesList)
    tmp.put(new Uint8Array([value.getSType()]))
    value.toBytesSink(bytesList)

    const innerBytes = bytesList.toBytes()
    const lengthBytes = BinarySerializer.encodeVariableLength(innerBytes.length)
    s.put(lengthBytes)
    s.put(innerBytes)
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): JsonObject | JsonObject[] {
    if (this.isArray()) {
      const array = this.data as (SerializedType | null)[]
      return array.map((item) => {
        return item ? item.toJSON() : null
      }) as JsonObject[]
    } else {
      // isObject()
      const map = this.data as Map<string, SerializedType | null>
      const result: JsonObject = {}
      for (const [key, value] of map.entries()) {
        result[key] = value ? value.toJSON() : null
      }
      return result
    }
  }

  /**
   * Compare with another STJson for equivalence
   */
  isEquivalent(t: SerializedType): boolean {
    if (!(t instanceof STJson)) {
      return false
    }
    return bytesToHex(this.bytes) === bytesToHex(t.bytes)
  }

  /**
   * Check if this is the default value
   */
  isDefault(): boolean {
    return this.default_
  }

  /**
   * Get blob representation
   */
  toBlob(): Uint8Array {
    const bytesList = new BytesList()
    const s = new BinarySerializer(bytesList)
    this.add(s)
    return bytesList.toBytes()
  }

  /**
   * Get the size (number of bytes in serialized form)
   */
  size(): number {
    const bytesList = new BytesList()
    const s = new BinarySerializer(bytesList)
    this.add(s)
    return bytesList.getLength()
  }

  /**
   * Set the value from another STJson
   */
  setValue(v: STJson): void {
    if (!(v instanceof STJson)) {
      throw new Error('setValue: value must be STJson')
    }
    this.data = v.data
    this.jsonType = v.jsonType
  }

  /**
   * Get serialized type ID
   */
  getSType(): SerializedTypeID {
    return SerializedTypeID.STI_JSON
  }
}

export { STJson }
