import { concat } from '@xrplf/isomorphic/utils'

import { AccountID } from './account-id'
import { Amount } from './amount'
import { Blob } from './blob'
import { Currency } from './currency'
import {
  DATA_TYPE_CODES,
  dataTypeCode,
  dataTypeName,
  encodeTypeCode,
  readTypeCode,
} from './data-type'
import { Hash128 } from './hash-128'
import { Hash160 } from './hash-160'
import { Hash192 } from './hash-192'
import { Hash256 } from './hash-256'
import { Issue } from './issue'
import { SerializedType, JSON } from './serialized-type'
import { STNumber } from './st-number'
import { UInt16 } from './uint-16'
import { UInt32 } from './uint-32'
import { UInt64 } from './uint-64'
import { UInt8 } from './uint-8'
import { BinaryParser } from '../serdes/binary-parser'
import { BinarySerializer, BytesList } from '../serdes/binary-serializer'

const UINT16_WIDTH = 2

/** Inner types whose encoding carries its own width. */
const FIXED_TYPES: Record<string, typeof SerializedType> = {
  UINT8: UInt8,
  UINT16: UInt16,
  UINT32: UInt32,
  UINT64: UInt64,
  UINT128: Hash128,
  UINT160: Hash160,
  UINT192: Hash192,
  UINT256: Hash256,
  AMOUNT: Amount,
  ISSUE: Issue,
  CURRENCY: Currency,
  NUMBER: STNumber,
}

/** Inner types that xrpld writes with a variable-length prefix (STBlob, STAccount). */
const LENGTH_PREFIXED_TYPES: Record<string, typeof SerializedType> = {
  VL: Blob,
  ACCOUNT: AccountID,
}

/**
 * Reads the value of a named inner type, as STData stores it.
 *
 * @param parser - The parser positioned at the value.
 * @param typeName - The inner type name, such as `UINT32`.
 * @returns The value, or undefined when STData does not carry that type.
 */
function readDataValue(
  parser: BinaryParser,
  typeName: string,
): SerializedType | undefined {
  const prefixed = LENGTH_PREFIXED_TYPES[typeName]
  if (prefixed !== undefined) {
    return prefixed.fromParser(parser, parser.readVariableLengthLength())
  }
  return FIXED_TYPES[typeName]?.fromParser(parser)
}

/**
 * The bytes of an inner value, as STData stores it.
 *
 * @param typeName - The inner type name, such as `UINT32`.
 * @param value - The value.
 * @returns The encoded value, with a length prefix for VL and ACCOUNT.
 */
function dataValueBytes(typeName: string, value: SerializedType): Uint8Array {
  const list = new BytesList()
  if (LENGTH_PREFIXED_TYPES[typeName] === undefined) {
    value.toBytesSink(list)
  } else {
    new BinarySerializer(list).writeLengthEncoded(value)
  }
  return list.toBytes()
}

/**
 * STData: a value of one of several serialized types, encoded as the two-byte
 * type code followed by the value. JSON form `{ "type": "UINT32", "value": 5 }`
 * (xrpld STData.cpp).
 */
class Data extends SerializedType {
  /**
   * @param bytes - The type code and value; defaults to UINT16 0.
   */
  constructor(bytes?: Uint8Array) {
    super(
      bytes === undefined || bytes.length === 0
        ? concat([
            encodeTypeCode(DATA_TYPE_CODES.UINT16),
            new Uint8Array(UINT16_WIDTH),
          ])
        : bytes,
    )
  }

  /**
   * Reads a Data from a BinaryParser.
   *
   * @param parser - The parser positioned at the Data.
   * @returns The Data.
   * @throws When the type code is not one STData carries.
   */
  static fromParser(parser: BinaryParser): Data {
    const code = readTypeCode(parser)
    const value = readDataValue(parser, dataTypeName(code))
    if (value === undefined) {
      throw new Error(`Data: unknown type code ${code}`)
    }
    return new Data(
      concat([encodeTypeCode(code), dataValueBytes(dataTypeName(code), value)]),
    )
  }

  /**
   * Creates a Data from its JSON form.
   *
   * @param value - A Data or `{ type: <name>, value: <value> }`.
   * @returns The Data.
   * @throws When the value is malformed or its type is not supported.
   */
  static from(value: Data | JSON): Data {
    if (value instanceof Data) {
      return value
    }
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value) ||
      value.value === undefined ||
      value.value === null
    ) {
      throw new Error('Data: expected an object with type and value')
    }
    const code = dataTypeCode(value.type, 'Data')
    const typeName = dataTypeName(code)
    const type = LENGTH_PREFIXED_TYPES[typeName] ?? FIXED_TYPES[typeName]
    return new Data(
      concat([
        encodeTypeCode(code),
        dataValueBytes(typeName, type.from(value.value)),
      ]),
    )
  }

  /**
   * The JSON form of this Data.
   *
   * @returns `{ type: <name>, value: <value> }`.
   */
  toJSON(): JSON {
    const parser = new BinaryParser(this.toHex())
    const typeName = dataTypeName(readTypeCode(parser))
    return { type: typeName, value: readDataValue(parser, typeName)?.toJSON() }
  }
}

export { Data, readDataValue }
