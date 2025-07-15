import { ValidationError } from '../../errors'
import { ClawbackAmount } from '../common'

import {
  BaseTransaction,
  validateBaseTransaction,
  isIssuedCurrencyAmount,
  isMPTAmount,
  isAccount,
  validateOptionalField,
  isClawbackAmount,
  validateRequiredField,
} from './common'

/**
 * The Clawback transaction is used by the token issuer to claw back
 * issued tokens from a holder.
 */
export interface Clawback extends BaseTransaction {
  TransactionType: 'Clawback'
  /**
   * Indicates the AccountID that submitted this transaction. The account MUST
   * be the issuer of the currency or MPT.
   */
  Account: string
  /**
   * The amount of currency or MPT to clawback, and it must be non-XRP. The nested field
   * names MUST be lower-case. If the amount is IOU, the `issuer` field MUST be the holder's address,
   * whom to be clawed back.
   */
  Amount: ClawbackAmount
  /**
   * Indicates the AccountID that the issuer wants to clawback. This field is only valid for clawing back
   * MPTs.
   */
  Holder?: string
}

/**
 * Verify the form and type of an Clawback at runtime.
 *
 * @param tx - An Clawback Transaction.
 * @throws When the Clawback is Malformed.
 */
export function validateClawback(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'Amount', isClawbackAmount)
  validateOptionalField(tx, 'Holder', isAccount)

  if (!isIssuedCurrencyAmount(tx.Amount) && !isMPTAmount(tx.Amount)) {
    throw new ValidationError('Clawback: invalid Amount')
  }

  if (isIssuedCurrencyAmount(tx.Amount) && tx.Account === tx.Amount.issuer) {
    throw new ValidationError('Clawback: invalid holder Account')
  }

  if (isMPTAmount(tx.Amount) && tx.Account === tx.Holder) {
    throw new ValidationError('Clawback: invalid holder Account')
  }

  if (isIssuedCurrencyAmount(tx.Amount) && tx.Holder) {
    throw new ValidationError('Clawback: cannot have Holder for currency')
  }

  if (isMPTAmount(tx.Amount) && !tx.Holder) {
    throw new ValidationError('Clawback: missing Holder')
  }
}
