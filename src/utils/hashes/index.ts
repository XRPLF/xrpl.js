/* eslint-disable id-length -- Small variables in the bit operations makes it easier to read */
/* eslint-disable @typescript-eslint/no-magic-numbers --
 * Most of the magic numbers are the size of data in bits. */
/* eslint-disable no-bitwise -- Manipulating bits requires bitwise operators */
import BigNumber from 'bignumber.js'
import { decodeAccountID } from 'ripple-address-codec'
import { decode, encode } from 'ripple-binary-codec'

import { ValidationError } from '../../common/errors'
import { Ledger, LedgerEntry } from '../../models/ledger'
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
  const hex = new BigNumber(integerString).toString(BITS_IN_HEX)
  return padLeftZero(hex, byteLength * 2)
}

function ledgerSpaceHex(name: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- Easier to read
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

// For context on the numbers, see: https://xrpl.org/serialization.html#length-prefixing
function addLengthPrefix(hex: string): string {
  const length = hex.length / 2
  if (length <= 192) {
    return bytesToHex([length]) + hex
  }
  if (length <= 12480) {
    const x = length - 193
    return bytesToHex([193 + (x >>> 8), x & 0xff]) + hex
  }
  if (length <= 918744) {
    const x = length - 12481
    return (
      bytesToHex([241 + (x >>> BITS_IN_HEX), (x >>> 8) & 0xff, x & 0xff]) + hex
    )
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
// eslint-disable-next-line import/no-unused-modules -- Could be useful for end users
export function computeSignedTransactionHash(tx: Transaction | string): string {
  let txBlob
  let txObject: Transaction
  if (typeof tx === 'string') {
    txBlob = tx
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Decode produces a Transaction in JSON format
    txObject = decode(tx) as unknown as Transaction
  } else {
    txBlob = encode(tx)
    txObject = tx
  }

  if (
    txObject.TxnSignature === undefined &&
    (txObject.Signers === undefined ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- JS users may encounter this runtime error
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
  )
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
 * @param sequence - The Sequence number of the OfferCreate transaction that created the offer.
 * If the OfferCreate transaction used a Ticket, use the TicketSequence value instead.
 * @returns The index of the account's Offer object.
 */
export function computeOfferIndex(address: string, sequence: number): string {
  const prefix = `00${intToHex(ledgerSpaces.offer.charCodeAt(0), 1)}`
  return sha512Half(prefix + addressToHex(address) + intToHex(sequence, 4))
}

/**
 * Computes the RippleState ID - https://xrpl.org/ripplestate.html#ripplestate-id-format.
 *
 * @param address1 - The AccountID of one side of the trustline.
 * @param address2 - The AccountID of the other side of the trustline.
 * @param currency - The 160 bit currency code for the trustline.
 * @returns The RippleState ID for this trustline.
 */
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

/**
 * Computes a combined hash for a set of transactions. This allows for easy comparison with other sets of Transactions.
 *
 * @param transactions - A set of all relevant transactions.
 * @returns A hash based on all given transactions.
 */
// TODO: Type transactions up the call heirarchy so that we can use 'TransactionAndMetadata' instead of 'any' here.
// (Currently the fields are not quite identical due to capitalization 'metaData' vs 'metadata')
// eslint-disable-next-line @typescript-eslint/no-explicit-any, import/no-unused-modules -- Allow transactions in JSON format
export function computeTransactionTreeHash(transactions: any[]): string {
  const shamap = new SHAMap()

  transactions.forEach((txJSON) => {
    const txBlobHex = encode(txJSON)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- metaData is a field in the JSON
    const metaHex = encode(txJSON.metaData)
    const txHash = computeSignedTransactionHash(txBlobHex)
    const data = addLengthPrefix(txBlobHex) + addLengthPrefix(metaHex)
    shamap.addItem(txHash, data, NodeType.TRANSACTION_METADATA)
  })

  return shamap.hash
}

/**
 * Get an ID for the top node in the state tree, which can be used to quickly compare if two ledgers have the same state.
 *
 * @param entries - All LedgerEntries in the current state.
 * @returns A hash based on all LedgerEntries provided.
 */
export function computeStateTreeHash(entries: LedgerEntry[]): string {
  const shamap = new SHAMap()

  entries.forEach((ledgerEntry) => {
    const data = encode(ledgerEntry)
    shamap.addItem(ledgerEntry.index, data, NodeType.ACCOUNT_STATE)
  })

  return shamap.hash
}

/**
 * Creates a hash for this ledger - Mirrors rippled's Ledger::calculateLedgerHash() function.
 *
 * @param ledgerHeader - A Ledger object to hash.
 * @returns An identifying hash for this ledger object.
 */
export function computeLedgerHash(ledgerHeader: Ledger): string {
  const prefix = HashPrefix.LEDGER.toString(16).toUpperCase()
  return sha512Half(
    prefix +
      intToHex(Number(ledgerHeader.ledger_index), 4)
        .concat(bigintToHex(ledgerHeader.total_coins, 8))
        .concat(ledgerHeader.parent_hash)
        .concat(ledgerHeader.transaction_hash)
        .concat(ledgerHeader.account_hash)
        .concat(intToHex(ledgerHeader.parent_close_time, 4))
        .concat(intToHex(ledgerHeader.close_time, 4))
        .concat(intToHex(ledgerHeader.close_time_resolution, 1))
        .concat(intToHex(ledgerHeader.close_flags, 1)),
  )
}

/**
 * Create an Escrow ID - https://xrpl.org/escrow-object.html#escrow-id-format.
 *
 * @param address - The AccountID of the sender of the EscrowCreate transaction that created the Escrow object.
 * @param sequence - The Sequence number of the EscrowCreate transaction that created the Escrow object.
 * If the EscrowCreate transaction used a Ticket, use the TicketSequence value instead.
 * @returns An ID for an Escrow object.
 */
export function computeEscrowHash(address: string, sequence: number): string {
  return sha512Half(
    ledgerSpaceHex('escrow') +
      addressToHex(address) +
      intToHex(sequence, BYTE_LENGTH),
  )
}

/**
 * Creates a PayChannel ID - https://xrpl.org/paychannel.html#paychannel-id-format.
 *
 * @param address - The AccountID of the source account.
 * @param dstAddress - The AccountID of the destination account.
 * @param sequence - The Sequence number of the PaymentChannelCreate transaction that created the channel.
 * If the PaymentChannelCreate transaction used a Ticket, use the TicketSequence value instead.
 * @returns A PayChannel ID.
 */
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
