import { AccountID } from './account-id'
import { Currency } from './currency'
import { BinaryParser } from '../serdes/binary-parser'
import { SerializedType, JsonObject } from './serialized-type'
import { Buffer } from 'buffer/'

/**
 * Constants for separating Paths in a PathSet
 */
const PATHSET_END_BYTE = 0x00
const PATH_SEPARATOR_BYTE = 0xff

/**
 * Constant for masking types of a Hop
 */
const TYPE_ACCOUNT = 0x01
const TYPE_CURRENCY = 0x10
const TYPE_ISSUER = 0x20

/**
 * The object representation of a Hop, an issuer AccountID, an account AccountID, and a Currency
 */
interface HopObject extends JsonObject {
  issuer?: string
  account?: string
  currency?: string
}

/**
 * TypeGuard for HopObject
 */
function isHopObject(arg): arg is HopObject {
  return (
    arg.issuer !== undefined ||
    arg.account !== undefined ||
    arg.currency !== undefined
  )
}

/**
 * TypeGuard for PathSet
 */
function isPathSet(arg): arg is Array<Array<HopObject>> {
  return (
    (Array.isArray(arg) && arg.length === 0) ||
    (Array.isArray(arg) && Array.isArray(arg[0]) && arg[0].length === 0) ||
    (Array.isArray(arg) && Array.isArray(arg[0]) && isHopObject(arg[0][0]))
  )
}

/**
 * Serialize and Deserialize a Hop
 */
class Hop extends SerializedType {
  /**
   * Create a Hop from a HopObject
   *
   * @param value Either a hop or HopObject to create a hop with
   * @returns a Hop
   */
  static from(value: Hop | HopObject): Hop {
    if (value instanceof Hop) {
      return value
    }

    const bytes: Array<Buffer> = [Buffer.from([0])]

    if (value.account) {
      bytes.push(AccountID.from(value.account).toBytes())
      bytes[0][0] |= TYPE_ACCOUNT
    }

    if (value.currency) {
      bytes.push(Currency.from(value.currency).toBytes())
      bytes[0][0] |= TYPE_CURRENCY
    }

    if (value.issuer) {
      bytes.push(AccountID.from(value.issuer).toBytes())
      bytes[0][0] |= TYPE_ISSUER
    }

    return new Hop(Buffer.concat(bytes))
  }

  /**
   * Construct a Hop from a BinaryParser
   *
   * @param parser BinaryParser to read the Hop from
   * @returns a Hop
   */
  static fromParser(parser: BinaryParser): Hop {
    const type = parser.readUInt8()
    const bytes: Array<Buffer> = [Buffer.from([type])]

    if (type & TYPE_ACCOUNT) {
      bytes.push(parser.read(AccountID.width))
    }

    if (type & TYPE_CURRENCY) {
      bytes.push(parser.read(Currency.width))
    }

    if (type & TYPE_ISSUER) {
      bytes.push(parser.read(AccountID.width))
    }

    return new Hop(Buffer.concat(bytes))
  }

  /**
   * Get the JSON interpretation of this hop
   *
   * @returns a HopObject, an JS object with optional account, issuer, and currency
   */
  toJSON(): HopObject {
    const hopParser = new BinaryParser(this.bytes.toString('hex'))
    const type = hopParser.readUInt8()

    let account, currency, issuer
    if (type & TYPE_ACCOUNT) {
      account = (AccountID.fromParser(hopParser) as AccountID).toJSON()
    }

    if (type & TYPE_CURRENCY) {
      currency = (Currency.fromParser(hopParser) as Currency).toJSON()
    }

    if (type & TYPE_ISSUER) {
      issuer = (AccountID.fromParser(hopParser) as AccountID).toJSON()
    }

    const result: HopObject = {}
    if (account) {
      result.account = account
    }

    if (issuer) {
      result.issuer = issuer
    }

    if (currency) {
      result.currency = currency
    }

    return result
  }

  /**
   * get a number representing the type of this hop
   *
   * @returns a number to be bitwise and-ed with TYPE_ constants to describe the types in the hop
   */
  type(): number {
    return this.bytes[0]
  }
}

/**
 * Class for serializing/deserializing Paths
 */
class Path extends SerializedType {
  /**
   * construct a Path from an array of Hops
   *
   * @param value Path or array of HopObjects to construct a Path
   * @returns the Path
   */
  static from(value: Path | Array<HopObject>): Path {
    if (value instanceof Path) {
      return value
    }

    const bytes: Array<Buffer> = []
    value.forEach((hop: HopObject) => {
      bytes.push(Hop.from(hop).toBytes())
    })

    return new Path(Buffer.concat(bytes))
  }

  /**
   * Read a Path from a BinaryParser
   *
   * @param parser BinaryParser to read Path from
   * @returns the Path represented by the bytes read from the BinaryParser
   */
  static fromParser(parser: BinaryParser): Path {
    const bytes: Array<Buffer> = []
    while (!parser.end()) {
      bytes.push(Hop.fromParser(parser).toBytes())

      if (
        parser.peek() === PATHSET_END_BYTE ||
        parser.peek() === PATH_SEPARATOR_BYTE
      ) {
        break
      }
    }
    return new Path(Buffer.concat(bytes))
  }

  /**
   * Get the JSON representation of this Path
   *
   * @returns an Array of HopObject constructed from this.bytes
   */
  toJSON(): Array<HopObject> {
    const json: Array<HopObject> = []
    const pathParser = new BinaryParser(this.toString())

    while (!pathParser.end()) {
      json.push(Hop.fromParser(pathParser).toJSON())
    }

    return json
  }
}

/**
 * Deserialize and Serialize the PathSet type
 */
class PathSet extends SerializedType {
  /**
   * Construct a PathSet from an Array of Arrays representing paths
   *
   * @param value A PathSet or Array of Array of HopObjects
   * @returns the PathSet constructed from value
   */
  static from<T extends PathSet | Array<Array<HopObject>>>(value: T): PathSet {
    if (value instanceof PathSet) {
      return value
    }

    if (isPathSet(value)) {
      const bytes: Array<Buffer> = []

      value.forEach((path: Array<HopObject>) => {
        bytes.push(Path.from(path).toBytes())
        bytes.push(Buffer.from([PATH_SEPARATOR_BYTE]))
      })

      bytes[bytes.length - 1] = Buffer.from([PATHSET_END_BYTE])

      return new PathSet(Buffer.concat(bytes))
    }

    throw new Error('Cannot construct PathSet from given value')
  }

  /**
   * Construct a PathSet from a BinaryParser
   *
   * @param parser A BinaryParser to read PathSet from
   * @returns the PathSet read from parser
   */
  static fromParser(parser: BinaryParser): PathSet {
    const bytes: Array<Buffer> = []

    while (!parser.end()) {
      bytes.push(Path.fromParser(parser).toBytes())
      bytes.push(parser.read(1))

      if (bytes[bytes.length - 1][0] == PATHSET_END_BYTE) {
        break
      }
    }

    return new PathSet(Buffer.concat(bytes))
  }

  /**
   * Get the JSON representation of this PathSet
   *
   * @returns an Array of Array of HopObjects, representing this PathSet
   */
  toJSON(): Array<Array<HopObject>> {
    const json: Array<Array<HopObject>> = []
    const pathParser = new BinaryParser(this.toString())

    while (!pathParser.end()) {
      json.push(Path.fromParser(pathParser).toJSON())
      pathParser.skip(1)
    }

    return json
  }
}

export { PathSet }
