/* eslint-disable @typescript-eslint/no-magic-numbers -- this file mimics
   behavior in rippled. Magic numbers are used for lengths and conditions */
/* eslint-disable no-bitwise  -- this file mimics behavior in rippled. It uses
   bitwise operators for and-ing numbers with a mask and bit shifting. */

import BigNumber from 'bignumber.js'
import { decodeAccountID } from 'ripple-address-codec'

import hashLedger, {
  hashLedgerHeader,
  hashSignedTx,
  hashTxTree,
  hashStateTree,
} from './hashLedger'
import HashPrefix from './HashPrefix'
import ledgerSpaces from './ledgerSpaces'
import sha512Half from './sha512Half'

const HEX = 16
const BYTE_LENGTH = 4

function addressToHex(address: string): string {
  return Buffer.from(decodeAccountID(address)).toString('hex')
}

function ledgerSpaceHex(name: keyof typeof ledgerSpaces): string {
  return ledgerSpaces[name].charCodeAt(0).toString(HEX).padStart(4, '0')
}

const MASK = 0xff
function currencyToHex(currency: string): string {
  if (currency.length !== 3) {
    return currency
  }

  const bytes = Array(20).fill(0)
  bytes[12] = currency.charCodeAt(0) & MASK
  bytes[13] = currency.charCodeAt(1) & MASK
  bytes[14] = currency.charCodeAt(2) & MASK
  return Buffer.from(bytes).toString('hex')
}

/**
 * Hash the given binary transaction data with the single-signing prefix.
 *
 * See [Serialization Format](https://xrpl.org/serialization.html).
 *
 * @param txBlobHex - The binary transaction blob as a hexadecimal string.
 * @returns The hash to sign.
 * @category Utilities
 */
export function hashTx(txBlobHex: string): string {
  const prefix = HashPrefix.TRANSACTION_SIGN.toString(HEX).toUpperCase()
  return sha512Half(prefix + txBlobHex)
}

/**
 * Compute AccountRoot Ledger Object Index.
 *
 * All objects in a ledger's state tree have a unique Index.
 * The AccountRoot Ledger Object Index is derived by hashing the
 * address with a namespace identifier. This ensures every
 * Index is unique.
 *
 * See [Ledger Object Indexes](https://xrpl.org/ledger-object-ids.html).
 *
 * @param address - The classic account address.
 * @returns The Ledger Object Index for the account.
 * @category Utilities
 */
export function hashAccountRoot(address: string): string {
  return sha512Half(ledgerSpaceHex('account') + addressToHex(address))
}

/**
 * [SignerList Index Format](https://xrpl.org/signerlist.html#signerlist-id-format).
 *
 * The Index of a SignerList object is the SHA-512Half of the following values, concatenated in order:
 *   * The RippleState space key (0x0053)
 *   * The AccountID of the owner of the SignerList
 *   * The SignerListID (currently always 0).
 *
 * This method computes a SignerList Ledger Object Index.
 *
 * @param address - The classic account address of the SignerList owner (starting with r).
 * @returns The Index of the account's SignerList object.
 * @category Utilities
 */
export function hashSignerListId(address: string): string {
  return sha512Half(
    `${ledgerSpaceHex('signerList') + addressToHex(address)}00000000`,
  )
}

/**
 * [Offer Index Format](https://xrpl.org/offer.html#offer-id-format).
 *
 * The Index of a Offer object is the SHA-512Half of the following values, concatenated in order:
 * * The Offer space key (0x006F)
 * * The AccountID of the account placing the offer
 * * The Sequence number of the OfferCreate transaction that created the offer.
 *
 * This method computes an Offer Index.
 *
 * @param address - The classic account address of the SignerList owner (starting with r).
 * @param sequence - Sequence of the Offer.
 * @returns The Index of the account's Offer object.
 * @category Utilities
 */
export function hashOfferId(address: string, sequence: number): string {
  const hexPrefix = ledgerSpaces.offer
    .charCodeAt(0)
    .toString(HEX)
    .padStart(2, '0')
  const hexSequence = sequence.toString(HEX).padStart(8, '0')
  const prefix = `00${hexPrefix}`
  return sha512Half(prefix + addressToHex(address) + hexSequence)
}

/**
 * Compute the hash of a Trustline.
 *
 * @param address1 - One of the addresses in the Trustline.
 * @param address2 - The other address in the Trustline.
 * @param currency - Currency in the Trustline.
 * @returns The hash of the Trustline.
 * @category Utilities
 */
export function hashTrustline(
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
 * Compute the Hash of an Escrow LedgerEntry.
 *
 * @param address - Address of the Escrow.
 * @param sequence - OfferSequence of the Escrow.
 * @returns The hash of the Escrow LedgerEntry.
 * @category Utilities
 */
export function hashEscrow(address: string, sequence: number): string {
  return sha512Half(
    ledgerSpaceHex('escrow') +
      addressToHex(address) +
      sequence.toString(HEX).padStart(BYTE_LENGTH * 2, '0'),
  )
}

/**
 * Compute the hash of a Payment Channel.
 *
 * @param address - Account of the Payment Channel.
 * @param dstAddress - Destination Account of the Payment Channel.
 * @param sequence - Sequence number of the Transaction that created the Payment Channel.
 * @returns Hash of the Payment Channel.
 * @category Utilities
 */
export function hashPaymentChannel(
  address: string,
  dstAddress: string,
  sequence: number,
): string {
  return sha512Half(
    ledgerSpaceHex('paychan') +
      addressToHex(address) +
      addressToHex(dstAddress) +
      sequence.toString(HEX).padStart(BYTE_LENGTH * 2, '0'),
  )
}

export { hashLedgerHeader, hashSignedTx, hashLedger, hashStateTree, hashTxTree }
