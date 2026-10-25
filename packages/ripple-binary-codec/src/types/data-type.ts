import { SerializedType, JSON } from './serialized-type'
import { BinaryParser } from '../serdes/binary-parser'
import { readUInt16BE, writeUInt16BE } from '../utils'

/**
 * Serialized type codes that STData and STDataType can carry, by the names
 * xrpld uses in their JSON form (STDataType.cpp, dataTypeFromJson).
 */
const DATA_TYPE_CODES: Record<string, number> = {
  UINT16: 1,
  UINT32: 2,
  UINT64: 3,
  UINT128: 4,
  UINT256: 5,
  AMOUNT: 6,
  VL: 7,
  ACCOUNT: 8,
  NUMBER: 9,
  UINT8: 16,
  UINT160: 17,
  UINT192: 21,
  ISSUE: 24,
  CURRENCY: 26,
}

const DATA_TYPE_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(DATA_TYPE_CODES).map(([name, code]) => [code, name]),
)

const TYPE_CODE_WIDTH = 2

/**
 * The name of a serialized type code, or the code as a decimal string when it
 * has no name, as xrpld's STDataType::getInnerTypeString does.
 *
 * @param code - A serialized type code.
 * @returns The type name.
 */
function dataTypeName(code: number): string {
  return DATA_TYPE_NAMES[code] ?? code.toString()
}

/**
 * The serialized type code of a type name.
 *
 * @param typeName - A type name such as `UINT32`.
 * @param owner - The type reporting the error.
 * @returns The serialized type code.
 * @throws When the name is not one STData supports.
 */
function dataTypeCode(typeName: unknown, owner: string): number {
  const code =
    typeof typeName === 'string' ? DATA_TYPE_CODES[typeName] : undefined
  if (code === undefined) {
    throw new Error(`${owner}: unsupported type ${String(typeName)}`)
  }
  return code
}

/**
 * Two bytes holding a serialized type code, big-endian.
 *
 * @param code - A serialized type code.
 * @returns The encoded code.
 */
function encodeTypeCode(code: number): Uint8Array {
  const bytes = new Uint8Array(TYPE_CODE_WIDTH)
  writeUInt16BE(bytes, code, 0)
  return bytes
}

/**
 * Reads a two-byte serialized type code.
 *
 * @param parser - The parser positioned at the code.
 * @returns The code.
 */
function readTypeCode(parser: BinaryParser): number {
  return Number(readUInt16BE(parser.read(TYPE_CODE_WIDTH), 0))
}

/**
 * STDataType: the name of a serialized type, encoded as its two-byte type
 * code. JSON form `{ "type": "UINT32" }`.
 */
class DataType extends SerializedType {
  /**
   * @param bytes - The two-byte type code; defaults to UINT16.
   */
  constructor(bytes?: Uint8Array) {
    super(
      bytes === undefined || bytes.length === 0
        ? encodeTypeCode(DATA_TYPE_CODES.UINT16)
        : bytes,
    )
  }

  /**
   * Reads a DataType from a BinaryParser.
   *
   * @param parser - The parser positioned at the DataType.
   * @returns The DataType.
   */
  static fromParser(parser: BinaryParser): DataType {
    return new DataType(encodeTypeCode(readTypeCode(parser)))
  }

  /**
   * Creates a DataType from its JSON form.
   *
   * @param value - A DataType or `{ type: <name> }`.
   * @returns The DataType.
   * @throws When the value is not an object with a supported type name.
   */
  static from(value: DataType | JSON): DataType {
    if (value instanceof DataType) {
      return value
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('DataType: expected an object with type')
    }
    return new DataType(encodeTypeCode(dataTypeCode(value.type, 'DataType')))
  }

  /**
   * The JSON form of this DataType.
   *
   * @returns `{ type: <name> }`.
   */
  toJSON(): JSON {
    return { type: dataTypeName(readTypeCode(new BinaryParser(this.toHex()))) }
  }
}

export {
  DataType,
  dataTypeCode,
  dataTypeName,
  encodeTypeCode,
  readTypeCode,
  DATA_TYPE_CODES,
}
