import { ValidationError } from '../../errors'
import { Amount } from '../common'

import { BaseTransaction, isAmount, validateBaseTransaction } from './common'

/**
 * Map of flags to boolean values representing {@link URITokenBuy} transaction
 * flags.
 *
 * @category Transaction Flags
 *
 * @example
 * ```typescript
 * const tx: URITokenBuy = {
 * Account: 'rhFcpWDHLqpBmX4ezWiA5VLSS4e1BHqhHd',
 * URITokenID: '7AFCE32EBA8BD310CC2D00BE10B76E2183337EA20444D4580E4DBDB396C101FB',
 * Amount: '1000000',
 * TransactionType: 'URITokenBuy',
 * }
 *
 * // Autofill the tx to see how flags actually look compared to the interface usage.
 * const autofilledTx = await client.autofill(tx)
 * console.log(autofilledTx)
 * // {
 * // Account: 'rhFcpWDHLqpBmX4ezWiA5VLSS4e1BHqhHd',
 * // URITokenID: '7AFCE32EBA8BD310CC2D00BE10B76E2183337EA20444D4580E4DBDB396C101FB',
 * // Amount: '1000000',
 * // TransactionType: 'URITokenBuy',
 * // Sequence: 21970384,
 * // Fee: '12',
 * // LastLedgerSequence: 21970404
 * // }
 * ```
 */

/**
 * An URITokenBuy transaction is effectively a limit order . It defines an
 * intent to exchange currencies, and creates an Offer object if not completely.
 * Fulfilled when placed. Offers can be partially fulfilled.
 *
 * @category Transaction Models
 */
export interface URITokenBuy extends BaseTransaction {
  TransactionType: 'URITokenBuy'
  /**
   * Identifies the URITokenID of the NFToken object that the
   * offer references.
   */
  URITokenID: string
  /**
   * Indicates the amount expected or offered for the Token.
   *
   * The amount must be non-zero, except when this is a sell
   * offer and the asset is XRP. This would indicate that the current
   * owner of the token is giving it away free, either to anyone at all,
   * or to the account identified by the Destination field.
   */
  Amount: Amount
}

/**
 * Verify the form and type of an URITokenBuy at runtime.
 *
 * @param tx - An URITokenBuy Transaction.
 * @throws When the URITokenBuy is Malformed.
 */
export function validateURITokenBuy(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Account === tx.Destination) {
    throw new ValidationError(
      'URITokenBuy: Destination and Account must not be equal',
    )
  }

  if (tx.URITokenID == null) {
    throw new ValidationError('URITokenBuy: missing field URITokenID')
  }

  if (!isAmount(tx.Amount)) {
    throw new ValidationError('URITokenBuy: invalid Amount')
  }
}
