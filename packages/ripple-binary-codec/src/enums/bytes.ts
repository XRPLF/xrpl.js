import { BytesList, BinaryParser } from '../binary'

/*
 * @brief: Bytes, name, and ordinal representing one type, ledger_type, transaction type, or result
 */
export class Bytes {
  readonly bytes: Uint8Array

  constructor(
    readonly name: string,
    readonly ordinal: number,
    readonly ordinalWidth: number,
  ) {
    this.bytes = new Uint8Array(ordinalWidth)
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
export class BytesLookup {
  constructor(types: Record<string, number>, readonly ordinalWidth: number) {
    Object.entries(types).forEach(([k, v]) => {
      this.add(k, v)
    })
  }

  /**
   * Add a new name value pair to the BytesLookup.
   *
   * @param name - A human readable name for the field.
   * @param value - The numeric value for the field.
   * @throws if the name or value already exist in the lookup because it's unclear how to decode.
   */
  add(name: string, value: number): void {
    if (this[name]) {
      throw new SyntaxError(
        `Attempted to add a value with a duplicate name "${name}". This is not allowed because it is unclear how to decode.`,
      )
    }
    if (this[value.toString()]) {
      throw new SyntaxError(
        `Attempted to add a duplicate value under a different name (Given name: "${name}" and previous name: "${
          this[value.toString()]
        }. This is not allowed because it is unclear how to decode.\nGiven value: ${value.toString()}`,
      )
    }
    this[name] = new Bytes(name, value, this.ordinalWidth)
    this[value.toString()] = this[name]
  }

  from(value: Bytes | string): Bytes {
    return value instanceof Bytes ? value : (this[value] as Bytes)
  }

  fromParser(parser: BinaryParser): Bytes {
    return this.from(parser.readUIntN(this.ordinalWidth).toString())
  }
}
