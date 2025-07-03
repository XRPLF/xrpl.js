import { ValidationError } from '../../errors'
import { IssuedCurrencyAmount, MPTAmount } from '../common'

import {
  BaseTransaction,
  validateBaseTransaction,
  isIssuedCurrencyAmount,
  isMPTAmount,
  isAccount,
  validateOptionalField,
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
  Amount: IssuedCurrencyAmount | MPTAmount
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
  validateOptionalField(tx, 'Holder', isAccount)
  validateRequiredField(
    tx,
    'Amount',
    (inp): inp is IssuedCurrencyAmount | MPTAmount =>
      isIssuedCurrencyAmount(inp) || isMPTAmount(inp),
    { invalidMessage: 'expected a valid non-XRP Amount' },
  )

  if (isIssuedCurrencyAmount(tx.Amount)) {
    if (tx.Account === tx.Amount.issuer) {
      throw new ValidationError(
        'Clawback: Amount.issuer and Account cannot be the same',
      )
    }

    if (tx.Holder) {
      throw new ValidationError('Clawback: cannot have Holder for currency')
    }
  } else if (isMPTAmount(tx.Amount)) {
    if (tx.Account === tx.Holder) {
      throw new ValidationError(
        'Clawback: Account and Holder cannot be the same',
      )
    }

    if (!tx.Holder) {
      throw new ValidationError('Clawback: missing field Holder')
    }
  }
}
