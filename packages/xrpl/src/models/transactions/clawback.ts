import { ValidationError } from '../../errors'
import { IssuedCurrencyAmount } from '../common'

import {
  BaseTransaction,
  validateBaseTransaction,
  isIssuedCurrency,
} from './common'

/**
 * The Clawback transaction is used by the token issuer to claw back
 * issued tokens from a holder.
 */
export interface Clawback extends BaseTransaction {
  TransactionType: 'Clawback'
  /**
   * Indicates the AccountID that submitted this transaction. The account MUST
   * be the issuer of the currency.
   */
  Account: string
  /**
   * The amount of currency to deliver, and it must be non-XRP. The nested field
   * names MUST be lower-case. The `issuer` field MUST be the holder's address,
   * whom to be clawed back.
   */
  Amount: IssuedCurrencyAmount
}

/**
 * Verify the form and type of an Clawback at runtime.
 *
 * @param tx - An Clawback Transaction.
 * @throws When the Clawback is Malformed.
 */
export function validateClawback(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Amount == null) {
    throw new ValidationError('Clawback: missing field Amount')
  }

  if (!isIssuedCurrency(tx.Amount)) {
    throw new ValidationError('Clawback: invalid Amount')
  }

  if (isIssuedCurrency(tx.Amount) && tx.Account === tx.Amount.issuer) {
    throw new ValidationError('Clawback: invalid holder Account')
  }
}
