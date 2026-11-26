import { bytesToHex, concat } from '@xrplf/isomorphic/utils'
import { BinaryParser } from '../serdes/binary-parser'

import { AccountID } from './account-id'
import { Currency } from './currency'
import { JsonObject, SerializedType } from './serialized-type'
import { Hash192 } from './hash-192'
import { readUInt32BE, writeUInt32BE } from '../utils'

interface XRPIssue extends JsonObject {
  currency: string
}

interface IOUIssue extends JsonObject {
  currency: string
  issuer: string
}
interface MPTIssue extends JsonObject {
  mpt_issuance_id: string
}
/**
 * Interface for JSON objects that represent issues
 */
type IssueObject = XRPIssue | IOUIssue | MPTIssue

/**
 * Type guard for Issue Object
 */
function isIssueObject(arg): arg is IssueObject {
  const keys = Object.keys(arg).sort()
  const isXRP = keys.length === 1 && keys[0] === 'currency'
  const isIOU =
    keys.length === 2 && keys[0] === 'currency' && keys[1] === 'issuer'
  const isMPT = keys.length === 1 && keys[0] === 'mpt_issuance_id'

  return isXRP || isIOU || isMPT
}

const MPT_WIDTH = 44
const NO_ACCOUNT = AccountID.from('0000000000000000000000000000000000000001')

/**
 * Class for serializing/Deserializing Issue
 */
class Issue extends SerializedType {
  static readonly XRP_ISSUE: Issue = new Issue(new Uint8Array(20))

  constructor(bytes: Uint8Array) {
    super(bytes ?? Issue.XRP_ISSUE.bytes)
  }

  /**
   * Construct Issue from XRPIssue, IOUIssue or MPTIssue
   *
   * @param value An object representing an XRPIssue, IOUIssue or MPTIssue
   * @returns An Issue object
   */
  static from<T extends Issue | IssueObject>(value: T): Issue {
    if (value instanceof Issue) {
      return value
    }

    if (isIssueObject(value)) {
      if (value.currency) {
        const currency = Currency.from(value.currency.toString()).toBytes()

        //IOU case
        if (value.issuer) {
          const issuer = AccountID.from(value.issuer.toString()).toBytes()
          return new Issue(concat([currency, issuer]))
        }

        //XRP case
        return new Issue(currency)
      }

      // MPT case
      if (value.mpt_issuance_id) {
        const mptIssuanceIdBytes = Hash192.from(
          value.mpt_issuance_id.toString(),
        ).toBytes()
        const issuerAccount = mptIssuanceIdBytes.slice(4)
        const sequence = Number(readUInt32BE(mptIssuanceIdBytes.slice(0, 4), 0)) // sequence is in Big-endian format in mpt_issuance_id

        // Convert to Little-endian
        const sequenceBuffer = new Uint8Array(4)
        new DataView(sequenceBuffer.buffer).setUint32(0, sequence, true)

        return new Issue(
          concat([issuerAccount, NO_ACCOUNT.toBytes(), sequenceBuffer]),
        )
      }
    }

    throw new Error('Invalid type to construct an Issue')
  }

  /**
   * Read Issue from a BinaryParser
   *
   * @param parser BinaryParser to read the Issue from
   *
   * @returns An Issue object
   */
  static fromParser(parser: BinaryParser): Issue {
    // XRP
    const currencyOrAccount = parser.read(20)
    if (new Currency(currencyOrAccount).toJSON() === 'XRP') {
      return new Issue(currencyOrAccount)
    }

    // MPT
    const issuerAccountId = new AccountID(parser.read(20))
    if (NO_ACCOUNT.toHex() === issuerAccountId.toHex()) {
      const sequence = parser.read(4)
      return new Issue(
        concat([currencyOrAccount, NO_ACCOUNT.toBytes(), sequence]),
      )
    }

    // IOU
    return new Issue(concat([currencyOrAccount, issuerAccountId.toBytes()]))
  }

  /**
   * Get the JSON representation of this IssueObject
   *
   * @returns the JSON interpretation of this.bytes
   */
  toJSON(): IssueObject {
    // If the buffer is exactly 44 bytes, treat it as an MPTIssue.
    if (this.toBytes().length === MPT_WIDTH) {
      const issuerAccount = this.toBytes().slice(0, 20)
      const sequence = new DataView(this.toBytes().slice(40).buffer).getUint32(
        0,
        true,
      )

      // sequence part of mpt_issuance_id should be in Big-endian
      const sequenceBuffer = new Uint8Array(4)
      writeUInt32BE(sequenceBuffer, sequence, 0)

      return {
        mpt_issuance_id: bytesToHex(concat([sequenceBuffer, issuerAccount])),
      }
    }

    const parser = new BinaryParser(this.toString())

    const currency = Currency.fromParser(parser) as Currency
    if (currency.toJSON() === 'XRP') {
      return { currency: currency.toJSON() }
    }
    const issuer = AccountID.fromParser(parser) as AccountID

    return {
      currency: currency.toJSON(),
      issuer: issuer.toJSON(),
    }
  }
}

export { Issue, IssueObject }
