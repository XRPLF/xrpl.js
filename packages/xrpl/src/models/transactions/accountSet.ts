/* eslint-disable complexity -- Necessary for validateAccountSet */

import { isValidClassicAddress } from 'ripple-address-codec'

import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * Enum for AccountSet Flags.
 *
 * @category Transaction Flags
 */
export enum AccountSetAsfFlags {
  /** Require a destination tag to send transactions to this account. */
  asfRequireDest = 1,
  /**
   * Require authorization for users to hold balances issued by this address
   * can only be enabled if the address has no trust lines connected to it.
   */
  asfRequireAuth = 2,
  /** XRP should not be sent to this account. */
  asfDisallowXRP = 3,
  /**
   * Disallow use of the master key pair. Can only be enabled if the account
   * has configured another way to sign transactions, such as a Regular Key or a
   * Signer List.
   */
  asfDisableMaster = 4,
  /**
   * Track the ID of this account's most recent transaction. Required for
   * AccountTxnID.
   */
  asfAccountTxnID = 5,
  /**
   * Permanently give up the ability to freeze individual trust lines or
   * disable Global Freeze. This flag can never be disabled after being enabled.
   */
  asfNoFreeze = 6,
  /** Freeze all assets issued by this account. */
  asfGlobalFreeze = 7,
  /** Enable rippling on this account's trust lines by default. */
  asfDefaultRipple = 8,
  /** Enable Deposit Authorization on this account. */
  asfDepositAuth = 9,
  /**
   * Allow another account to mint and burn tokens on behalf of this account.
   */
  asfAuthorizedNFTokenMinter = 10,
  /** asf 11 is reserved for Hooks amendment */
  /** Disallow other accounts from creating incoming NFTOffers */
  asfDisallowIncomingNFTokenOffer = 12,
  /** Disallow other accounts from creating incoming Checks */
  asfDisallowIncomingCheck = 13,
  /** Disallow other accounts from creating incoming PayChannels */
  asfDisallowIncomingPayChan = 14,
  /** Disallow other accounts from creating incoming Trustlines */
  asfDisallowIncomingTrustline = 15,
  /** Permanently gain the ability to claw back issued IOUs */
  asfAllowTrustLineClawback = 16,
}

/**
 * Enum for AccountSet Transaction Flags.
 *
 * @category Transaction Flags
 */
export enum AccountSetTfFlags {
  /** The same as SetFlag: asfRequireDest. */
  tfRequireDestTag = 0x00010000,
  /** The same as ClearFlag: asfRequireDest. */
  tfOptionalDestTag = 0x00020000,
  /** The same as SetFlag: asfRequireAuth. */
  tfRequireAuth = 0x00040000,
  /** The same as ClearFlag: asfRequireAuth. */
  tfOptionalAuth = 0x00080000,
  /** The same as SetFlag: asfDisallowXRP. */
  tfDisallowXRP = 0x00100000,
  /** The same as ClearFlag: asfDisallowXRP. */
  tfAllowXRP = 0x00200000,
}

/**
 * Map of flags to boolean values representing {@link AccountSet} transaction
 * flags.
 *
 * @category Transaction Flags
 *
 * @example
 * ```typescript
 *  const accountSetTx: AccountSet = {
 *    TransactionType: 'AccountSet',
 *    Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
 *    Flags: {
 *      tfOptionalDestTag: true,
 *      tfRequireAuth: true
 *    },
 *  }
 *
 * // Autofill the tx to see how flags actually look compared to the interface usage.
 * const autofilledTx = await client.autofill(accountSetTx)
 * console.log(autofilledTx)
 * // {
 * //  TransactionType: 'AccountSet',
 * //  Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
 * //  Flags: 393216,
 * //  Sequence: 1,
 * //  Fee: '12',
 * //  LastLedgerSequence: 21971793
 * // }
 * ```
 */
export interface AccountSetFlagsInterface {
  tfRequireDestTag?: boolean
  tfOptionalDestTag?: boolean
  tfRequireAuth?: boolean
  tfOptionalAuth?: boolean
  tfDisallowXRP?: boolean
  tfAllowXRP?: boolean
}

/**
 * An AccountSet transaction modifies the properties of an account in the XRP
 * Ledger.
 *
 * @category Transaction Models
 */
export interface AccountSet extends BaseTransaction {
  TransactionType: 'AccountSet'
  Flags?: number | AccountSetFlagsInterface
  /** Unique identifier of a flag to disable for this account. */
  ClearFlag?: number
  /**
   * The domain that owns this account, as a string of hex representing the.
   * ASCII for the domain in lowercase.
   */
  Domain?: string
  /** Hash of an email address to be used for generating an avatar image. */
  EmailHash?: string
  /** Public key for sending encrypted messages to this account. */
  MessageKey?: string
  /** Integer flag to enable for this account. */
  SetFlag?: AccountSetAsfFlags
  /**
   * The fee to charge when users transfer this account's issued currencies,
   * represented as billionths of a unit. Cannot be more than 2000000000 or less
   * than 1000000000, except for the special case 0 meaning no fee.
   */
  TransferRate?: number
  /**
   * Tick size to use for offers involving a currency issued by this address.
   * The exchange rates of those offers is rounded to this many significant
   * digits. Valid values are 3 to 15 inclusive, or 0 to disable.
   */
  TickSize?: number
  /**
   * Sets an alternate account that is allowed to mint NFTokens on this
   * account's behalf using NFTokenMint's `Issuer` field.
   */
  NFTokenMinter?: string
}

const MIN_TICK_SIZE = 3
const MAX_TICK_SIZE = 15

/**
 * Verify the form and type of an AccountSet at runtime.
 *
 * @param tx - An AccountSet Transaction.
 * @throws When the AccountSet is Malformed.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- okay for this method, only a little over
export function validateAccountSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (
    tx.NFTokenMinter !== undefined &&
    !isValidClassicAddress(String(tx.NFTokenMinter))
  ) {
    throw new ValidationError('AccountSet: invalid NFTokenMinter')
  }

  if (tx.ClearFlag !== undefined) {
    if (typeof tx.ClearFlag !== 'number') {
      throw new ValidationError('AccountSet: invalid ClearFlag')
    }
    if (!Object.values(AccountSetAsfFlags).includes(tx.ClearFlag)) {
      throw new ValidationError('AccountSet: invalid ClearFlag')
    }
  }

  if (tx.Domain !== undefined && typeof tx.Domain !== 'string') {
    throw new ValidationError('AccountSet: invalid Domain')
  }

  if (tx.EmailHash !== undefined && typeof tx.EmailHash !== 'string') {
    throw new ValidationError('AccountSet: invalid EmailHash')
  }

  if (tx.MessageKey !== undefined && typeof tx.MessageKey !== 'string') {
    throw new ValidationError('AccountSet: invalid MessageKey')
  }

  if (tx.SetFlag !== undefined) {
    if (typeof tx.SetFlag !== 'number') {
      throw new ValidationError('AccountSet: invalid SetFlag')
    }
    if (!Object.values(AccountSetAsfFlags).includes(tx.SetFlag)) {
      throw new ValidationError('AccountSet: invalid SetFlag')
    }
  }

  if (tx.TransferRate !== undefined && typeof tx.TransferRate !== 'number') {
    throw new ValidationError('AccountSet: invalid TransferRate')
  }

  if (tx.TickSize !== undefined) {
    if (typeof tx.TickSize !== 'number') {
      throw new ValidationError('AccountSet: invalid TickSize')
    }
    if (
      tx.TickSize !== 0 &&
      (tx.TickSize < MIN_TICK_SIZE || tx.TickSize > MAX_TICK_SIZE)
    ) {
      throw new ValidationError('AccountSet: invalid TickSize')
    }
  }
}
