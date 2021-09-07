import BigNumber from 'bignumber.js'
import { decodeAccountID } from 'ripple-address-codec'
import { decode, encode } from 'ripple-binary-codec'

import { ValidationError } from '../../common/errors'
import { Transaction } from '../../models/transactions'

import HashPrefix from './hashPrefix'
import ledgerSpaces from './ledgerSpaces'
import sha512Half from './sha512Half'
import { SHAMap, NodeType } from './shamap'

const BITS_IN_HEX = 16
const BYTE_LENGTH = 4

function padLeftZero(string: string, length: number): string {
  return Array(length - string.length + 1).join('0') + string
}

function intToHex(integer: number, byteLength: number): string {
  return padLeftZero(Number(integer).toString(BITS_IN_HEX), byteLength * 2)
}

function bytesToHex(bytes: number[]): string {
  return Buffer.from(bytes).toString('hex')
}

function bigintToHex(
  integerString: string | number | BigNumber,
  byteLength: number,
): string {
  const hex = new BigNumber(integerString).toString(16)
  return padLeftZero(hex, byteLength * 2)
}

function ledgerSpaceHex(name: string): string {
  return intToHex(ledgerSpaces[name].charCodeAt(0), 2)
}

function addressToHex(address: string): string {
  return Buffer.from(decodeAccountID(address)).toString('hex')
}

function currencyToHex(currency: string): string {
  if (currency.length === 3) {
    const bytes = new Array(20 + 1).join('0').split('').map(parseFloat)
    bytes[12] = currency.charCodeAt(0) & 0xff
    bytes[13] = currency.charCodeAt(1) & 0xff
    bytes[14] = currency.charCodeAt(2) & 0xff
    return bytesToHex(bytes)
  }
  return currency
}

function addLengthPrefix(hex: string): string {
  const length = hex.length / 2
  if (length <= 192) {
    return bytesToHex([length]) + hex
  }
  if (length <= 12480) {
    const x = length - 193
    // eslint-disable-next-line no-bitwise -- adding a prefix to hex requires bitwise operations
    return bytesToHex([193 + (x >>> 8), x & 0xff]) + hex
  }
  if (length <= 918744) {
    const x = length - 12481
    // eslint-disable-next-line no-bitwise -- adding a prefix to hex requires bitwise operations
    return bytesToHex([241 + (x >>> 16), (x >>> 8) & 0xff, x & 0xff]) + hex
  }
  throw new Error('Variable integer overflow.')
}

/**
 * Hashes the Transaction object as the ledger does. Throws if the transaction is unsigned.
 *
 * @param tx - A transaction to hash. Tx may be in binary blob form. Tx must be signed.
 * @returns A hash of tx.
 * @throws ValidationError if the Transaction is unsigned.
 */

export function computeSignedTransactionHash(tx: Transaction | string): string {
  let txBlob
  let txObject
  if (typeof tx === 'string') {
    txBlob = tx
    txObject = decode(tx)
  } else {
    txBlob = encode(tx)
    txObject = tx
  }

  if (
    txObject.TxnSignature === undefined &&
    (txObject.Signers === undefined ||
      txObject.Signers[0].Signer.TxnSignature === undefined)
  ) {
    throw new ValidationError('The transaction must be signed to hash it.')
  }

  const prefix = HashPrefix.TRANSACTION_ID.toString(16).toUpperCase()
  return sha512Half(prefix.concat(txBlob))
}

/**
 * Hash the given binary transaction data with the single-signing prefix.
 *
 * See [Serialization Format](https://xrpl.org/serialization.html).
 *
 * @param txBlobHex - The binary transaction blob as a hexadecimal string.
 * @returns The hash to sign.
 */
export function computeBinaryTransactionSigningHash(txBlobHex: string): string {
  const prefix = HashPrefix.TRANSACTION_SIGN.toString(16).toUpperCase()
  return sha512Half(prefix + txBlobHex)
}

/**
 * Compute Account Root Index.
 *
 * All objects in a ledger's state tree have a unique index.
 * The Account Root index is derived by hashing the
 * address with a namespace identifier. This ensures every
 * index is unique.
 *
 * See [Ledger Object IDs](https://xrpl.org/ledger-object-ids.html).
 *
 * @param address - The classic account address.
 * @returns The Ledger Object Index for the account.
 */
export function computeAccountRootIndex(address: string): string {
  return sha512Half(ledgerSpaceHex('account') + addressToHex(address))
}

/**
 * [SignerList ID Format](https://xrpl.org/signerlist.html#signerlist-id-format).
 *
 * The index of a SignerList object is the SHA-512Half of the following values, concatenated in order:
 *   * The RippleState space key (0x0053)
 *   * The AccountID of the owner of the SignerList
 *   * The SignerListID (currently always 0).
 *
 * This method computes a SignerList index.
 *
 * @param address - The classic account address of the SignerList owner (starting with r).
 * @returns The ID of the account's SignerList object.
 */
export function computeSignerListIndex(address: string): string {
  return sha512Half(
    `${ledgerSpaceHex('signerList') + addressToHex(address)}00000000`,
  ) // uint32(0) signer list index
}

/**
 * [Offer ID Format](https://xrpl.org/offer.html#offer-id-format).
 *
 * The index of a Offer object is the SHA-512Half of the following values, concatenated in order:
 * * The Offer space key (0x006F)
 * * The AccountID of the account placing the offer
 * * The Sequence number of the OfferCreate transaction that created the offer.
 *
 * This method computes an Offer Index (aka Order Index).
 *
 * @param address - The classic account address of the SignerList owner (starting with r).
 * @param sequence
 * @returns The index of the account's Offer object.
 */
export function computeOfferIndex(address: string, sequence: number): string {
  const prefix = `00${intToHex(ledgerSpaces.offer.charCodeAt(0), 1)}`
  return sha512Half(prefix + addressToHex(address) + intToHex(sequence, 4))
}

export function computeTrustlineHash(
  address1: string,
  address2: string,
  currency: string,
): string {
  const address1Hex = addressToHex(address1)
  const address2Hex = addressToHex(address2)

  const swap = new BigNumber(address1Hex, 16).isGreaterThan(
    new BigNumber(address2Hex, 16),
  )
  const lowAddressHex = swap ? address2Hex : address1Hex
  const highAddressHex = swap ? address1Hex : address2Hex

  const prefix = ledgerSpaceHex('rippleState')
  return sha512Half(
    prefix + lowAddressHex + highAddressHex + currencyToHex(currency),
  )
}

export function computeTransactionTreeHash(transactions: any[]): string {
  const shamap = new SHAMap()

  transactions.forEach((txJSON) => {
    const txBlobHex = encode(txJSON)
    const metaHex = encode(txJSON.metaData)
    const txHash = computeSignedTransactionHash(txBlobHex)
    const data = addLengthPrefix(txBlobHex) + addLengthPrefix(metaHex)
    shamap.addItem(txHash, data, NodeType.TRANSACTION_METADATA)
  })

  return shamap.hash
}

export function computeStateTreeHash(entries: any[]): string {
  const shamap = new SHAMap()

  entries.forEach((ledgerEntry) => {
    const data = encode(ledgerEntry)
    shamap.addItem(ledgerEntry.index, data, NodeType.ACCOUNT_STATE)
  })

  return shamap.hash
}

// see rippled Ledger::calculateLedgerHash()
export function computeLedgerHash(ledgerHeader): string {
  const prefix = HashPrefix.LEDGER.toString(16).toUpperCase()
  return sha512Half(
    prefix +
      intToHex(ledgerHeader.ledger_index, 4) +
      bigintToHex(ledgerHeader.total_coins, 8) +
      ledgerHeader.parent_hash +
      ledgerHeader.transaction_hash +
      ledgerHeader.account_hash +
      intToHex(ledgerHeader.parent_close_time, 4) +
      intToHex(ledgerHeader.close_time, 4) +
      intToHex(ledgerHeader.close_time_resolution, 1) +
      intToHex(ledgerHeader.close_flags, 1),
  )
}

export function computeEscrowHash(address: string, sequence: number): string {
  return sha512Half(
    ledgerSpaceHex('escrow') +
      addressToHex(address) +
      intToHex(sequence, BYTE_LENGTH),
  )
}

export function computePaymentChannelHash(
  address: string,
  dstAddress: string,
  sequence: number,
): string {
  return sha512Half(
    ledgerSpaceHex('paychan') +
      addressToHex(address) +
      addressToHex(dstAddress) +
      intToHex(sequence, BYTE_LENGTH),
  )
}
