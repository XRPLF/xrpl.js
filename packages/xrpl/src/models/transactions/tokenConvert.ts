import { ValidationError } from '../../errors'
import { IssuedCurrencyAmount, MPTAmount } from '../common'

import {
  areAddressesEqual,
  BaseTransaction,
  isAmount,
  isMPTIssuer,
  isTokenAmount,
  validateBaseTransaction,
  validateFlagsMask,
  validateRequiredField,
} from './common'

/**
 * The TokenConvert transaction converts an amount between an IOU and the MPT
 * bound to it by a TokenIssuance, in either direction: an IOU Amount is
 * converted to the bound MPT, an MPT Amount to the IOU.
 *
 * @category Transaction Models
 */
export interface TokenConvert extends BaseTransaction {
  TransactionType: 'TokenConvert'

  /** The IOU or MPT amount to convert. Must be positive. */
  Amount: IssuedCurrencyAmount | MPTAmount
}

/**
 * Verify the form and type of a {@link TokenConvert} at runtime.
 *
 * @param tx - A {@link TokenConvert} Transaction.
 * @throws When the {@link TokenConvert} is malformed.
 */
export function validateTokenConvert(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)
  validateRequiredField(tx, 'Amount', isAmount)

  const amount = tx.Amount
  if (!isTokenAmount(amount)) {
    throw new ValidationError(
      'TokenConvert: Amount must be an IOU or MPT amount',
    )
  }

  if (!(Number(amount.value) > 0)) {
    throw new ValidationError('TokenConvert: Amount must be positive')
  }

  const isOwnToken =
    'mpt_issuance_id' in amount
      ? isMPTIssuer(tx.Account, amount.mpt_issuance_id)
      : areAddressesEqual(amount.issuer, String(tx.Account))
  if (isOwnToken) {
    throw new ValidationError(
      'TokenConvert: the issuer cannot convert its own token',
    )
  }
}
