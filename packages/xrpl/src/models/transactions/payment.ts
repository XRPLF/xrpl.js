import { ValidationError } from '../../errors'
import { Amount, Path, MPTAmount } from '../common'
import { isFlagEnabled } from '../utils'

import {
  BaseTransaction,
  isAmount,
  GlobalFlags,
  validateBaseTransaction,
  isAccount,
  validateRequiredField,
  validateOptionalField,
  isNumber,
  Account,
  validateCredentialsList,
} from './common'
import type { TransactionMetadataBase } from './metadata'

/**
 * Enum representing values for Payment Transaction Flags.
 *
 * @category Transaction Flags
 */
export enum PaymentFlags {
  /**
   * Do not use the default path; only use paths included in the Paths field.
   * This is intended to force the transaction to take arbitrage opportunities.
   * Most clients do not need this.
   */
  tfNoRippleDirect = 0x00010000,
  /**
   * If the specified Amount cannot be sent without spending more than SendMax,
   * reduce the received amount instead of failing outright. See Partial.
   * Payments for more details.
   */
  tfPartialPayment = 0x00020000,
  /**
   * Only take paths where all the conversions have an input:output ratio that
   * is equal or better than the ratio of Amount:SendMax. See Limit Quality for
   * details.
   */
  tfLimitQuality = 0x00040000,
}

/**
 * Map of flags to boolean values representing {@link Payment} transaction
 * flags.
 *
 * @category Transaction Flags
 *
 * @example
 * ```typescript
 * const partialPayment: Payment = {
 *  TransactionType: 'Payment',
 *  Account: 'rM9WCfJU6udpFkvKThRaFHDMsp7L8rpgN',
 *  Amount: {
 *    currency: 'FOO',
 *    value: '4000',
 *    issuer: 'rPzwM2JfCSDjhbesdTCqFjWWdK7eFtTwZz',
 *  },
 *  Destination: 'rPzwM2JfCSDjhbesdTCqFjWWdK7eFtTwZz',
 *  Flags: {
 *    tfPartialPayment: true
 *  }
 * }
 *
 * // Autofill the tx to see how flags actually look compared to the interface usage.
 * const autofilledTx = await client.autofill(partialPayment)
 * console.log(autofilledTx)
 * // {
 * //  TransactionType: 'Payment',
 * //  Account: 'rM9WCfJU6udpFkvKThRaFHDMsp7L8rpgN',
 * //  Amount: {
 * //   currency: 'FOO',
 * //   value: '4000',
 * //   issuer: 'rPzwM2JfCSDjhbesdTCqFjWWdK7eFtTwZz'
 * //  },
 * //  Destination: 'rPzwM2JfCSDjhbesdTCqFjWWdK7eFtTwZz',
 * //  Flags: 131072,
 * //  Sequence: 21970996,
 * //  Fee: '12',
 * //  LastLedgerSequence: 21971016
 * // }
 * ```
 */
export interface PaymentFlagsInterface extends GlobalFlags {
  /**
   * Do not use the default path; only use paths included in the Paths field.
   * This is intended to force the transaction to take arbitrage opportunities.
   * Most clients do not need this.
   */
  tfNoRippleDirect?: boolean
  /**
   * If the specified Amount cannot be sent without spending more than SendMax,
   * reduce the received amount instead of failing outright. See Partial.
   * Payments for more details.
   */
  tfPartialPayment?: boolean
  /**
   * Only take paths where all the conversions have an input:output ratio that
   * is equal or better than the ratio of Amount:SendMax. See Limit Quality for
   * details.
   */
  tfLimitQuality?: boolean
}

/**
 * A Payment transaction represents a transfer of value from one account to
 * another.
 *
 * @category Transaction Models
 */
export interface Payment extends BaseTransaction {
  TransactionType: 'Payment'
  /**
   * The amount of currency to deliver. For non-XRP amounts, the nested field
   * names MUST be lower-case. If the tfPartialPayment flag is set, deliver up
   * to this amount instead.
   */
  Amount: Amount | MPTAmount
  /** The unique address of the account receiving the payment. */
  Destination: Account
  /**
   * Arbitrary tag that identifies the reason for the payment to the
   * destination, or a hosted recipient to pay.
   */
  DestinationTag?: number
  /**
   * Arbitrary 256-bit hash representing a specific reason or identifier for
   * this payment.
   */
  InvoiceID?: string
  /**
   * Array of payment paths to be used for this transaction. Must be omitted
   * for XRP-to-XRP transactions.
   */
  Paths?: Path[]
  /**
   * Highest amount of source currency this transaction is allowed to cost,
   * including transfer fees, exchange rates, and slippage . Does not include
   * the XRP destroyed as a cost for submitting the transaction. For non-XRP
   * amounts, the nested field names MUST be lower-case. Must be supplied for
   * cross-currency/cross-issue payments. Must be omitted for XRP-to-XRP
   * Payments.
   */
  SendMax?: Amount | MPTAmount
  /**
   * Minimum amount of destination currency this transaction should deliver.
   * Only valid if this is a partial payment. For non-XRP amounts, the nested
   * field names are lower-case.
   */
  DeliverMin?: Amount | MPTAmount
  /**
   * Credentials associated with the sender of this transaction.
   * The credentials included must not be expired.
   */
  CredentialIDs?: string[]
  Flags?: number | PaymentFlagsInterface
}

export interface PaymentMetadata extends TransactionMetadataBase {
  DeliveredAmount?: Amount | MPTAmount
  delivered_amount?: Amount | MPTAmount | 'unavailable'
}

/**
 * Verify the form and type of a Payment at runtime.
 *
 * @param tx - A Payment Transaction.
 * @throws When the Payment is malformed.
 */
export function validatePayment(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Amount === undefined) {
    throw new ValidationError('PaymentTransaction: missing field Amount')
  }

  if (!isAmount(tx.Amount)) {
    throw new ValidationError('PaymentTransaction: invalid Amount')
  }

  validateRequiredField(tx, 'Destination', isAccount)
  validateOptionalField(tx, 'DestinationTag', isNumber)

  validateCredentialsList(
    tx.CredentialIDs,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- known from base check
    tx.TransactionType as string,
    true,
  )

  if (tx.InvoiceID !== undefined && typeof tx.InvoiceID !== 'string') {
    throw new ValidationError('PaymentTransaction: InvoiceID must be a string')
  }

  if (
    tx.Paths !== undefined &&
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Only used by JS
    !isPaths(tx.Paths as Array<Array<Record<string, unknown>>>)
  ) {
    throw new ValidationError('PaymentTransaction: invalid Paths')
  }

  if (tx.SendMax !== undefined && !isAmount(tx.SendMax)) {
    throw new ValidationError('PaymentTransaction: invalid SendMax')
  }

  checkPartialPayment(tx)
}

function checkPartialPayment(tx: Record<string, unknown>): void {
  if (tx.DeliverMin != null) {
    if (tx.Flags == null) {
      throw new ValidationError(
        'PaymentTransaction: tfPartialPayment flag required with DeliverMin',
      )
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Only used by JS
    const flags = tx.Flags as number | PaymentFlagsInterface
    const isTfPartialPayment =
      typeof flags === 'number'
        ? isFlagEnabled(flags, PaymentFlags.tfPartialPayment)
        : flags.tfPartialPayment ?? false

    if (!isTfPartialPayment) {
      throw new ValidationError(
        'PaymentTransaction: tfPartialPayment flag required with DeliverMin',
      )
    }

    if (!isAmount(tx.DeliverMin)) {
      throw new ValidationError('PaymentTransaction: invalid DeliverMin')
    }
  }
}

function isPathStep(pathStep: Record<string, unknown>): boolean {
  if (pathStep.account !== undefined && typeof pathStep.account !== 'string') {
    return false
  }
  if (
    pathStep.currency !== undefined &&
    typeof pathStep.currency !== 'string'
  ) {
    return false
  }
  if (pathStep.issuer !== undefined && typeof pathStep.issuer !== 'string') {
    return false
  }
  if (
    pathStep.account !== undefined &&
    pathStep.currency === undefined &&
    pathStep.issuer === undefined
  ) {
    return true
  }
  if (pathStep.currency !== undefined || pathStep.issuer !== undefined) {
    return true
  }
  return false
}

function isPath(path: Array<Record<string, unknown>>): boolean {
  for (const pathStep of path) {
    if (!isPathStep(pathStep)) {
      return false
    }
  }
  return true
}

function isPaths(paths: Array<Array<Record<string, unknown>>>): boolean {
  if (!Array.isArray(paths) || paths.length === 0) {
    return false
  }

  for (const path of paths) {
    if (!Array.isArray(path) || path.length === 0) {
      return false
    }

    if (!isPath(path)) {
      return false
    }
  }

  return true
}
