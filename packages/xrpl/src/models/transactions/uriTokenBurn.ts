import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * Map of flags to boolean values representing {@link URITokenBurn} transaction
 * flags.
 *
 * @category Transaction Flags
 *
 * @example
 * ```typescript
 * const tx: URITokenBurn = {
 * Account: 'rhFcpWDHLqpBmX4ezWiA5VLSS4e1BHqhHd',
 * URITokenID: '7AFCE32EBA8BD310CC2D00BE10B76E2183337EA20444D4580E4DBDB396C101FB',
 * TransactionType: 'URITokenBurn',
 * }
 *
 * // Autofill the tx to see how flags actually look compared to the interface usage.
 * const autofilledTx = await client.autofill(tx)
 * console.log(autofilledTx)
 * // {
 * // Account: 'rhFcpWDHLqpBmX4ezWiA5VLSS4e1BHqhHd',
 * // URITokenID: '7AFCE32EBA8BD310CC2D00BE10B76E2183337EA20444D4580E4DBDB396C101FB',
 * // TransactionType: 'URITokenBurn',
 * // Sequence: 21970384,
 * // Fee: '12',
 * // LastLedgerSequence: 21970404
 * // }
 * ```
 */

/**
 * An URITokenBurn transaction is effectively a limit order . It defines an
 * intent to exchange currencies, and creates an Offer object if not completely.
 * Fulfilled when placed. Offers can be partially fulfilled.
 *
 * @category Transaction Models
 */
export interface URITokenBurn extends BaseTransaction {
  TransactionType: 'URITokenBurn'
  /**
   * Identifies the URIToken object to be removed by the transaction.
   */
  URITokenID: string
}

/**
 * Verify the form and type of an URITokenBurn at runtime.
 *
 * @param tx - An URITokenBurn Transaction.
 * @throws When the URITokenBurn is Malformed.
 */
export function validateURITokenBurn(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.URITokenID == null) {
    throw new ValidationError('NFTokenBurn: missing field URITokenID')
  }
}
