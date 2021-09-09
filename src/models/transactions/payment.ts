/* eslint-disable max-statements -- Necessary for verifyPayment */
/* eslint-disable complexity -- Necessary for verifyPayment */
import { ValidationError } from '../../common/errors'
import { Amount, Path } from '../common'
import { isFlagEnabled } from '../utils'

import {
  BaseTransaction,
  isAmount,
  GlobalFlags,
  verifyBaseTransaction,
} from './common'

export enum PaymentTransactionFlagsEnum {
  tfNoDirectRipple = 0x00010000,
  tfPartialPayment = 0x00020000,
  tfLimitQuality = 0x00040000,
}

export interface PaymentTransactionFlags extends GlobalFlags {
  tfNoDirectRipple?: boolean
  tfPartialPayment?: boolean
  tfLimitQuality?: boolean
}
export interface Payment extends BaseTransaction {
  TransactionType: 'Payment'
  Amount: Amount
  Destination: string
  DestinationTag?: number
  InvoiceID?: string
  Paths?: Path[]
  SendMax?: Amount
  DeliverMin?: Amount
  Flags?: number | PaymentTransactionFlags
}

/**
 * Verify the form and type of a Payment at runtime.
 *
 * @param tx - A Payment Transaction.
 * @throws When the Payment is malformed.
 */
export function verifyPayment(tx: Record<string, unknown>): void {
  verifyBaseTransaction(tx)

  if (tx.Amount === undefined) {
    throw new ValidationError('PaymentTransaction: missing field Amount')
  }

  if (!isAmount(tx.Amount)) {
    throw new ValidationError('PaymentTransaction: invalid Amount')
  }

  if (tx.Destination === undefined) {
    throw new ValidationError('PaymentTransaction: missing field Destination')
  }

  if (!isAmount(tx.Destination)) {
    throw new ValidationError('PaymentTransaction: invalid Destination')
  }

  if (tx.DestinationTag != null && typeof tx.DestinationTag !== 'number') {
    console.log(tx.DestinationTag)
    throw new ValidationError(
      'PaymentTransaction: DestinationTag must be a number',
    )
  }

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
    const flags = tx.Flags as number | PaymentTransactionFlags
    const isTfPartialPayment =
      typeof flags === 'number'
        ? isFlagEnabled(flags, PaymentTransactionFlagsEnum.tfPartialPayment)
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
