/* eslint-disable @typescript-eslint/no-magic-numbers -- this file mimics
   behavior in rippled. Magic numbers are used for lengths and conditions */
/* eslint-disable no-bitwise  -- this file mimics behavior in rippled. It uses
   bitwise operators for and-ing numbers with a mask and bit shifting. */

import { bytesToHex } from '@xrplf/isomorphic/utils'
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
  return bytesToHex(decodeAccountID(address))
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
  return bytesToHex(Uint8Array.from(bytes))
}

/**
 * Convert currency code to hex for Issue serialization.
 * XRP uses 160-bit zero currency code, others use standard encoding.
 *
 * @param code - The currency code to convert.
 * @returns The hex representation for use in Issue serialization.
 */
function toIssueCurrencyHex(code: string): string {
  const upper = code.toUpperCase()
  // Native XRP uses 160-bit zero currency code
  if (upper === 'XRP') {
    return '00'.repeat(20)
  }
  // If already a 160-bit hex code, normalize case
  if (/^[0-9a-f]{40}$/iu.test(code)) {
    return code.toUpperCase()
  }
  // Otherwise treat as 3-letter ISO-like code
  return currencyToHex(upper)
}

/**
 * Convert a number, bigint, or string to a 64-bit hex string.
 *
 * @param id - The ID to convert (number, bigint, or string).
 * @returns 64-bit hex string representation.
 * @throws Error if the ID is out of range or invalid format.
 */
function toU64Hex(id: bigint | number | string): string {
  let bi: bigint
  if (typeof id === 'bigint') {
    bi = id
  } else if (typeof id === 'number') {
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new Error(
        'claimID must be a non-negative safe integer, bigint, or decimal string',
      )
    }
    bi = BigInt(id)
  } else {
    const str = id.trim()
    bi =
      str.startsWith('0x') || str.startsWith('0X') ? BigInt(str) : BigInt(str)
  }
  const maxUint64 = BigInt('0xffffffffffffffff')
  if (bi < BigInt(0) || bi > maxUint64) {
    throw new Error('claimID out of range for uint64')
  }
  return bi.toString(16).toUpperCase().padStart(16, '0')
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

/**
 * Compute the hash of a Ticket.
 *
 * @param address - Account that created the Ticket.
 * @param ticketSequence - The Ticket Sequence number.
 * @returns Hash of the Ticket.
 * @category Utilities
 */
export function hashTicket(address: string, ticketSequence: number): string {
  return sha512Half(
    ledgerSpaceHex('ticket') +
      addressToHex(address) +
      ticketSequence.toString(HEX).padStart(BYTE_LENGTH * 2, '0'),
  )
}

/**
 * Compute the hash of a Check.
 *
 * @param address - Account that created the Check.
 * @param sequence - Sequence number of the CheckCreate transaction.
 * @returns Hash of the Check.
 * @category Utilities
 */
export function hashCheck(address: string, sequence: number): string {
  return sha512Half(
    ledgerSpaceHex('check') +
      addressToHex(address) +
      sequence.toString(HEX).padStart(BYTE_LENGTH * 2, '0'),
  )
}

/**
 * Compute the hash of a DepositPreauth entry.
 *
 * @param address - Account that granted the authorization.
 * @param authorizedAddress - Account that was authorized.
 * @returns Hash of the DepositPreauth entry.
 * @category Utilities
 */
export function hashDepositPreauth(
  address: string,
  authorizedAddress: string,
): string {
  return sha512Half(
    ledgerSpaceHex('depositPreauth') +
      addressToHex(address) +
      addressToHex(authorizedAddress),
  )
}

/**
 * Compute the hash of an NFTokenPage.
 *
 * @param address - Account that owns the NFTokenPage.
 * @param nfTokenIDLow96 - The low 96 bits of a representative NFTokenID.
 * @returns Hash of the NFTokenPage.
 * @throws Error if nfTokenIDLow96 is not a 24-character hex string.
 * @category Utilities
 */
export function hashNFTokenPage(
  address: string,
  nfTokenIDLow96: string,
): string {
  // Normalize and validate a 24-char hex (96 bits)
  const normalized = nfTokenIDLow96.replace(/^0x/iu, '').toUpperCase()
  if (!/^[0-9A-F]{24}$/u.test(normalized)) {
    throw new Error('nfTokenIDLow96 must be a 24-character hex string')
  }
  return sha512Half(
    ledgerSpaceHex('nfTokenPage') + addressToHex(address) + normalized,
  )
}

/**
 * Compute the hash of an NFTokenOffer.
 *
 * @param address - Account that created the NFTokenOffer.
 * @param sequence - Sequence number of the NFTokenCreateOffer transaction.
 * @returns Hash of the NFTokenOffer.
 * @category Utilities
 */
export function hashNFTokenOffer(address: string, sequence: number): string {
  return sha512Half(
    ledgerSpaceHex('nfTokenOffer') +
      addressToHex(address) +
      sequence.toString(HEX).padStart(BYTE_LENGTH * 2, '0'),
  )
}

/**
 * Compute the hash of an AMM root.
 *
 * @param currency1 - First currency in the AMM pool.
 * @param currency2 - Second currency in the AMM pool.
 * @param issuer1 - Issuer of the first currency (omit for XRP).
 * @param issuer2 - Issuer of the second currency (omit for XRP).
 * @returns Hash of the AMM root.
 * @category Utilities
 */
export function hashAMMRoot(
  currency1: string,
  currency2: string,
  issuer1?: string,
  issuer2?: string,
): string {
  const cur1Hex = toIssueCurrencyHex(currency1)
  const cur2Hex = toIssueCurrencyHex(currency2)
  const iss1Hex = issuer1 ? addressToHex(issuer1) : '00'.repeat(20)
  const iss2Hex = issuer2 ? addressToHex(issuer2) : '00'.repeat(20)

  // Ensure deterministic ordering
  const asset1 = cur1Hex + iss1Hex
  const asset2 = cur2Hex + iss2Hex
  const swap = new BigNumber(asset1, HEX).isGreaterThan(
    new BigNumber(asset2, HEX),
  )

  const lowAsset = swap ? asset2 : asset1
  const highAsset = swap ? asset1 : asset2

  return sha512Half(ledgerSpaceHex('ammRoot') + lowAsset + highAsset)
}

/**
 * Compute the hash of an Oracle entry.
 *
 * @param address - Account that created the Oracle.
 * @param oracleID - The unique identifier for this Oracle.
 * @returns Hash of the Oracle.
 * @throws Error if oracleID is not a 64-character uppercase hex string.
 * @category Utilities
 */
export function hashOracle(address: string, oracleID: string): string {
  const normalized = oracleID.replace(/^0x/iu, '').toUpperCase()
  // eslint-disable-next-line require-unicode-regexp -- Targeting older ES version
  if (!/^[0-9A-F]{64}$/.test(normalized)) {
    throw new Error(
      'oracleID must be a 64-character uppercase hexadecimal string',
    )
  }
  return sha512Half(
    ledgerSpaceHex('oracle') + addressToHex(address) + normalized,
  )
}

/**
 * Compute the hash of a Hook entry.
 *
 * @param address - Account that installed the Hook.
 * @param hookHash - Hash of the Hook code.
 * @returns Hash of the Hook entry.
 * @throws Error if hookHash is not a 64-character hex string.
 * @category Utilities
 */
export function hashHook(address: string, hookHash: string): string {
  const normalized = hookHash.replace(/^0x/iu, '').toUpperCase()
  // eslint-disable-next-line require-unicode-regexp -- Targeting older ES version
  if (!/^[0-9A-F]{64}$/.test(normalized)) {
    throw new Error('hookHash must be a 64-character hexadecimal string')
  }
  return sha512Half(ledgerSpaceHex('hook') + addressToHex(address) + normalized)
}

/**
 * Compute the hash of a Hook State entry.
 *
 * @param address - Account that owns the Hook State.
 * @param hookHash - Hash of the Hook code.
 * @param hookStateKey - Key for the Hook State entry.
 * @returns Hash of the Hook State entry.
 * @throws Error if hookHash or hookStateKey are not 64-character hex strings.
 * @category Utilities
 */
export function hashHookState(
  address: string,
  hookHash: string,
  hookStateKey: string,
): string {
  const hookHashNorm = hookHash.replace(/^0x/iu, '').toUpperCase()
  const stateKeyNorm = hookStateKey.replace(/^0x/iu, '').toUpperCase()
  // eslint-disable-next-line require-unicode-regexp -- Targeting older ES version
  if (!/^[0-9A-F]{64}$/.test(hookHashNorm)) {
    throw new Error('hookHash must be a 64-character hexadecimal string')
  }
  // eslint-disable-next-line require-unicode-regexp -- Targeting older ES version
  if (!/^[0-9A-F]{64}$/.test(stateKeyNorm)) {
    throw new Error('hookStateKey must be a 64-character hexadecimal string')
  }
  return sha512Half(
    ledgerSpaceHex('hookState') +
      addressToHex(address) +
      hookHashNorm +
      stateKeyNorm,
  )
}

/**
 * Compute the hash of a Hook Definition entry.
 *
 * @param hookHash - Hash of the Hook code.
 * @returns Hash of the Hook Definition entry.
 * @throws Error if hookHash is not a 64-character hex string.
 * @category Utilities
 */
export function hashHookDefinition(hookHash: string): string {
  // Validate that hookHash is a 64-character hex string
  if (!/^[0-9A-F]{64}$/iu.test(hookHash)) {
    throw new Error('hookHash must be a 64-character hexadecimal string')
  }
  return sha512Half(ledgerSpaceHex('hookDefinition') + hookHash)
}

/**
 * Compute the hash of a DID entry.
 *
 * @param address - Account that owns the DID.
 * @returns Hash of the DID entry.
 * @category Utilities
 */
export function hashDID(address: string): string {
  return sha512Half(ledgerSpaceHex('did') + addressToHex(address))
}

/**
 * Compute the hash of a Bridge entry.
 *
 * @param door - The door account of the bridge.
 * @param otherChainSource - The source account on the other chain.
 * @param issuingChainDoor - The door account on the issuing chain.
 * @param issuingChainIssue - The issue specification on the issuing chain.
 * @param lockingChainDoor - The door account on the locking chain.
 * @param lockingChainIssue - The issue specification on the locking chain.
 * @returns Hash of the Bridge entry.
 * @category Utilities
 */
export function hashBridge(
  door: string,
  otherChainSource: string,
  issuingChainDoor: string,
  issuingChainIssue: string,
  lockingChainDoor: string,
  lockingChainIssue: string,
): string {
  return sha512Half(
    ledgerSpaceHex('bridge') +
      addressToHex(door) +
      addressToHex(otherChainSource) +
      addressToHex(issuingChainDoor) +
      currencyToHex(issuingChainIssue) +
      addressToHex(lockingChainDoor) +
      currencyToHex(lockingChainIssue),
  )
}

/**
 * Compute the hash of an XChain Owned Claim ID entry.
 *
 * @param address - Account that owns the claim ID.
 * @param bridgeAccount - The bridge account.
 * @param claimID - The claim ID.
 * @returns Hash of the XChain Owned Claim ID entry.
 * @category Utilities
 */
export function hashXChainOwnedClaimID(
  address: string,
  bridgeAccount: string,
  claimID: bigint | number | string,
): string {
  return sha512Half(
    ledgerSpaceHex('xchainOwnedClaimID') +
      addressToHex(address) +
      addressToHex(bridgeAccount) +
      toU64Hex(claimID),
  )
}

/**
 * Compute the hash of an XChain Owned Create Account Claim ID entry.
 *
 * @param address - Account that owns the create account claim ID.
 * @param bridgeAccount - The bridge account.
 * @param claimID - The claim ID.
 * @returns Hash of the XChain Owned Create Account Claim ID entry.
 * @category Utilities
 */
export function hashXChainOwnedCreateAccountClaimID(
  address: string,
  bridgeAccount: string,
  claimID: bigint | number | string,
): string {
  return sha512Half(
    ledgerSpaceHex('xchainOwnedCreateAccountClaimID') +
      addressToHex(address) +
      addressToHex(bridgeAccount) +
      toU64Hex(claimID),
  )
}

/**
 * Compute the hash of an MPToken entry.
 *
 * @param address - Account that holds the MPToken.
 * @param mpTokenIssuanceID - The MPToken issuance ID.
 * @returns Hash of the MPToken entry.
 * @throws Error if mpTokenIssuanceID is not a 64-character hex string.
 * @category Utilities
 */
export function hashMPToken(
  address: string,
  mpTokenIssuanceID: string,
): string {
  // Validate that mpTokenIssuanceID is a 64-character hex string
  if (!/^[0-9A-F]{64}$/iu.test(mpTokenIssuanceID)) {
    throw new Error(
      'mpTokenIssuanceID must be a 64-character hexadecimal string',
    )
  }
  return sha512Half(
    ledgerSpaceHex('mpToken') + addressToHex(address) + mpTokenIssuanceID,
  )
}

/**
 * Compute the hash of an MPToken Issuance entry.
 *
 * @param sequence - Sequence number of the transaction that created this issuance.
 * @param address - Account that created the MPToken issuance.
 * @returns Hash of the MPToken Issuance entry.
 * @category Utilities
 */
export function hashMPTokenIssuance(sequence: number, address: string): string {
  return sha512Half(
    ledgerSpaceHex('mpTokenIssuance') +
      sequence.toString(HEX).padStart(BYTE_LENGTH * 2, '0') +
      addressToHex(address),
  )
}

/**
 * Compute the hash of a NegativeUNL entry.
 *
 * @returns Hash of the NegativeUNL entry.
 * @category Utilities
 */
export function hashNegativeUNL(): string {
  return sha512Half(ledgerSpaceHex('negativeUNL'))
}

export { hashLedgerHeader, hashSignedTx, hashLedger, hashStateTree, hashTxTree }
