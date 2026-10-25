import { hexToBytes } from '@xrplf/isomorphic/utils'

/**
 * Largest MPTokenSchema, in bytes (rippled `kMaxSchemaLength`).
 */
export const MAX_MPT_SCHEMA_BYTE_LENGTH = 256

/**
 * Deepest array/tuple nesting an MPTokenSchema may declare (rippled `kMaxSchemaDepth`).
 */
const MAX_MPT_SCHEMA_DEPTH = 8

/**
 * MPTokenSchema type codes (rippled `SchemaType`). Codes not listed are reserved.
 */
enum SchemaType {
  Boolean = 0x01,
  U8 = 0x02,
  U16 = 0x03,
  U32 = 0x04,
  U64 = 0x05,
  U128 = 0x06,
  U256 = 0x07,
  Xfl = 0x08,
  Account = 0x09,
  Currency = 0x0a,
  H160 = 0x0b,
  H256 = 0x0c,
  PubKey = 0x0d,
  Str = 0x0e,
  Bin = 0x0f,
  Array = 0x20,
  TupleOpen = 0x30,
  TupleClose = 0x31,
}

/** Byte widths of the fixed-size type codes. */
enum Width {
  One = 1,
  Two = 2,
  Four = 4,
  Eight = 8,
  Sixteen = 16,
  Twenty = 20,
  ThirtyTwo = 32,
  ThirtyThree = 33,
}

const FIXED_WIDTHS = new Map<number, number>([
  [SchemaType.Boolean, Width.One],
  [SchemaType.U8, Width.One],
  [SchemaType.U16, Width.Two],
  [SchemaType.U32, Width.Four],
  [SchemaType.U64, Width.Eight],
  [SchemaType.Xfl, Width.Eight],
  [SchemaType.U128, Width.Sixteen],
  [SchemaType.Account, Width.Twenty],
  [SchemaType.Currency, Width.Twenty],
  [SchemaType.H160, Width.Twenty],
  [SchemaType.U256, Width.ThirtyTwo],
  [SchemaType.H256, Width.ThirtyTwo],
  [SchemaType.PubKey, Width.ThirtyThree],
])

/** Standard XRPL variable-length prefix boundaries. */
enum VLPrefix {
  OneByteMax = 192,
  TwoByteMax = 240,
  ThreeByteMax = 254,
  TwoByteBase = 193,
  ThreeByteFirst = 241,
  ThreeByteBase = 12481,
  ByteRange = 256,
  TwoByteRange = 65536,
}

/** A read position inside a byte array. */
class Cursor {
  public readonly bytes: Uint8Array
  public index: number

  /**
   * Create a cursor over a byte array.
   *
   * @param bytes - The bytes to read.
   * @param index - The starting position.
   */
  public constructor(bytes: Uint8Array, index = 0) {
    this.bytes = bytes
    this.index = index
  }

  /**
   * Bytes left after the cursor position.
   *
   * @returns The remaining byte count.
   */
  public remaining(): number {
    return this.bytes.length - this.index
  }

  /**
   * The byte at the cursor position, without advancing.
   *
   * @returns The byte.
   */
  public peek(): number {
    return this.bytes[this.index]
  }

  /**
   * Read one byte and advance the cursor.
   *
   * @returns The byte read.
   */
  public readByte(): number {
    const value = this.bytes[this.index]
    this.index += 1
    return value
  }

  /**
   * Advance the cursor.
   *
   * @param count - The number of bytes to skip.
   */
  public skip(count: number): void {
    this.index += count
  }
}

/** Outcome of walking one schema type. */
interface Walk {
  ok: boolean
  /** True when the type reads at least one data byte. */
  consumes: boolean
}

const FAILED: Walk = { ok: false, consumes: false }
const CONSUMED: Walk = { ok: true, consumes: true }

/**
 * Read a standard XRPL VL length prefix and advance past it.
 *
 * @param data - The data cursor.
 * @returns The payload length, or undefined when the prefix is truncated or invalid.
 */
function readVLPrefix(data: Cursor): number | undefined {
  if (data.remaining() < Width.One) {
    return undefined
  }
  const b0 = data.readByte()
  if (b0 <= VLPrefix.OneByteMax) {
    return b0
  }
  if (b0 <= VLPrefix.TwoByteMax) {
    if (data.remaining() < Width.One) {
      return undefined
    }
    return (
      VLPrefix.TwoByteBase +
      (b0 - VLPrefix.TwoByteBase) * VLPrefix.ByteRange +
      data.readByte()
    )
  }
  if (b0 <= VLPrefix.ThreeByteMax) {
    if (data.remaining() < Width.Two) {
      return undefined
    }
    const b1 = data.readByte()
    const b2 = data.readByte()
    return (
      VLPrefix.ThreeByteBase +
      (b0 - VLPrefix.ThreeByteFirst) * VLPrefix.TwoByteRange +
      b1 * VLPrefix.ByteRange +
      b2
    )
  }
  return undefined
}

/**
 * Consume a fixed-width value; a boolean must be 0x00 or 0x01.
 *
 * @param code - The type code.
 * @param width - The byte width of the type.
 * @param data - The data cursor, or undefined for a schema-only walk.
 * @returns The walk outcome.
 */
function walkFixed(
  code: number,
  width: number,
  data: Cursor | undefined,
): Walk {
  if (data === undefined) {
    return CONSUMED
  }
  if (data.remaining() < width) {
    return FAILED
  }
  if (code === SchemaType.Boolean && data.peek() > Width.One) {
    return FAILED
  }
  data.skip(width)
  return CONSUMED
}

/**
 * Consume a VL-prefixed str or bin value.
 *
 * @param data - The data cursor, or undefined for a schema-only walk.
 * @returns The walk outcome.
 */
function walkVariable(data: Cursor | undefined): Walk {
  if (data === undefined) {
    return CONSUMED
  }
  const length = readVLPrefix(data)
  if (length === undefined || data.remaining() < length) {
    return FAILED
  }
  data.skip(length)
  return CONSUMED
}

/**
 * Walk an array: its element type once against the schema, then once per
 * element against the data. An element that reads no data is rejected.
 *
 * @param schema - The schema cursor, positioned after the array code.
 * @param data - The data cursor, or undefined for a schema-only walk.
 * @param depth - The nesting depth of the array.
 * @returns The walk outcome.
 */
function walkArray(
  schema: Cursor,
  data: Cursor | undefined,
  depth: number,
): Walk {
  if (depth + 1 > MAX_MPT_SCHEMA_DEPTH) {
    return FAILED
  }
  const elementBegin = schema.index
  const element = walkType(schema, undefined, depth + 1)
  if (!element.ok || !element.consumes) {
    return FAILED
  }
  if (data === undefined) {
    return CONSUMED
  }
  if (data.remaining() < Width.One) {
    return FAILED
  }
  const count = data.readByte()
  for (let item = 0; item < count; item++) {
    const elementSchema = new Cursor(schema.bytes, elementBegin)
    if (!walkType(elementSchema, data, depth + 1).ok) {
      return FAILED
    }
  }
  return CONSUMED
}

/**
 * Walk a tuple up to its matching tupleClose.
 *
 * @param schema - The schema cursor, positioned after the tupleOpen code.
 * @param data - The data cursor, or undefined for a schema-only walk.
 * @param depth - The nesting depth of the tuple.
 * @returns The walk outcome; it consumes when any member does.
 */
function walkTuple(
  schema: Cursor,
  data: Cursor | undefined,
  depth: number,
): Walk {
  if (depth + 1 > MAX_MPT_SCHEMA_DEPTH) {
    return FAILED
  }
  let consumes = false
  while (schema.remaining() >= Width.One) {
    if (schema.peek() === SchemaType.TupleClose) {
      schema.skip(1)
      return { ok: true, consumes }
    }
    const member = walkType(schema, data, depth + 1)
    if (!member.ok) {
      return FAILED
    }
    consumes = consumes || member.consumes
  }
  return FAILED
}

/**
 * Walk one schema type, consuming its data when a data cursor is given.
 *
 * @param schema - The schema cursor.
 * @param data - The data cursor, or undefined for a schema-only walk.
 * @param depth - The nesting depth of the type.
 * @returns The walk outcome.
 */
function walkType(
  schema: Cursor,
  data: Cursor | undefined,
  depth: number,
): Walk {
  if (schema.remaining() < Width.One) {
    return FAILED
  }
  const code = schema.readByte()
  const width = FIXED_WIDTHS.get(code)
  if (width !== undefined) {
    return walkFixed(code, width, data)
  }
  if (code === SchemaType.Str || code === SchemaType.Bin) {
    return walkVariable(data)
  }
  if (code === SchemaType.Array) {
    return walkArray(schema, data, depth)
  }
  if (code === SchemaType.TupleOpen) {
    return walkTuple(schema, data, depth)
  }
  return FAILED
}

/**
 * Walk a whole schema, and the data with it when given.
 *
 * @param schemaBytes - The schema bytes.
 * @param data - The data cursor, or undefined for a schema-only walk.
 * @returns Whether every schema type walked successfully.
 */
function walkSchema(
  schemaBytes: Uint8Array,
  data: Cursor | undefined,
): boolean {
  if (
    schemaBytes.length === 0 ||
    schemaBytes.length > MAX_MPT_SCHEMA_BYTE_LENGTH
  ) {
    return false
  }
  const schema = new Cursor(schemaBytes)
  while (schema.remaining() > 0) {
    if (!walkType(schema, data, 0).ok) {
      return false
    }
  }
  return true
}

/**
 * Check that an MPTokenSchema is well-formed (rippled `isWellFormedSchema`):
 * 1 to 256 bytes of known type codes, every array code followed by an element
 * type that reads data, every tupleOpen matched by a tupleClose, and nesting no
 * deeper than 8.
 *
 * @param schemaHex - The schema as an even-length hex string.
 * @returns Whether the schema is well-formed.
 */
export function isWellFormedMPTokenSchema(schemaHex: string): boolean {
  return walkSchema(hexToBytes(schemaHex), undefined)
}

/**
 * Check that MPTokenMetadata decodes exactly against an MPTokenSchema (rippled
 * `dataMatchesSchema`): every value is present at its declared width, array
 * counts fit the data, and no data byte is left over.
 *
 * @param schemaHex - The schema as an even-length hex string.
 * @param metadataHex - The metadata as an even-length hex string.
 * @returns Whether the metadata matches the schema.
 */
export function mptokenMetadataMatchesSchema(
  schemaHex: string,
  metadataHex: string,
): boolean {
  const data = new Cursor(hexToBytes(metadataHex))
  return walkSchema(hexToBytes(schemaHex), data) && data.remaining() === 0
}
