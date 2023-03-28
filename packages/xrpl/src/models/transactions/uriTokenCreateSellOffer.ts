import { ValidationError } from '../../errors'
import { Amount } from '../common'

import { BaseTransaction, isAmount, validateBaseTransaction } from './common'

/**
 * Map of flags to boolean values representing {@link URITokenCreateSellOffer} transaction
 * flags.
 *
 * @category Transaction Flags
 *
 * @example
 * ```typescript
 * const tx: URITokenCreateSellOffer = {
 * Account: 'rhFcpWDHLqpBmX4ezWiA5VLSS4e1BHqhHd',
 * URITokenID: '7AFCE32EBA8BD310CC2D00BE10B76E2183337EA20444D4580E4DBDB396C101FB',
 * Amount: '1000000',
 * TransactionType: 'URITokenCreateSellOffer',
 * }
 *
 * // Autofill the tx to see how flags actually look compared to the interface usage.
 * const autofilledTx = await client.autofill(tx)
 * console.log(autofilledTx)
 * // {
 * // Account: 'rhFcpWDHLqpBmX4ezWiA5VLSS4e1BHqhHd',
 * // URITokenID: '7AFCE32EBA8BD310CC2D00BE10B76E2183337EA20444D4580E4DBDB396C101FB',
 * // Amount: '1000000',
 * // TransactionType: 'URITokenCreateSellOffer',
 * // Sequence: 21970384,
 * // Fee: '12',
 * // LastLedgerSequence: 21970404
 * // }
 * ```
 */

/**
 * An URITokenCreateSellOffer transaction is effectively a limit order . It defines an
 * intent to exchange currencies, and creates an Offer object if not completely.
 * Fulfilled when placed. Offers can be partially fulfilled.
 *
 * @category Transaction Models
 */
export interface URITokenCreateSellOffer extends BaseTransaction {
  TransactionType: 'URITokenCreateSellOffer'
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
  /**
   * If present, indicates that this offer may only be
   * accepted by the specified account. Attempts by other
   * accounts to accept this offer MUST fail.
   */
  Destination?: string
}

/**
 * Verify the form and type of an URITokenCreateSellOffer at runtime.
 *
 * @param tx - An URITokenCreateSellOffer Transaction.
 * @throws When the URITokenCreateSellOffer is Malformed.
 */
export function validateURITokenCreateSellOffer(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  if (tx.Account === tx.Destination) {
    throw new ValidationError(
      'URITokenCreateSellOffer: Destination and Account must not be equal',
    )
  }

  if (tx.URITokenID == null) {
    throw new ValidationError(
      'URITokenCreateSellOffer: missing field URITokenID',
    )
  }

  if (!isAmount(tx.Amount)) {
    throw new ValidationError('URITokenCreateSellOffer: invalid Amount')
  }
}
