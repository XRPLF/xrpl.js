import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * The NFTokenCancelOffer transaction creates an NFToken object and adds it to the
 * relevant NFTokenPage object of the minter. If the transaction is
 * successful, the newly minted token will be owned by the minter account
 * specified by the transaction.
 */
export interface NFTokenCancelOffer extends BaseTransaction {
  TransactionType: 'NFTokenCancelOffer'
  /**
   * An array of TokenID objects, each identifying an
   * NFTokenOffer object, which should be cancelled by this
   * transaction.
   *
   * It is an error if an entry in this list points to an
   * object that is not an NFTokenOffer object. It is not an
   * error if an entry in this list points to an object that
   * does not exist.
   */
  TokenIDs: string[]
}

/**
 * Verify the form and type of an NFTokenCancelOffer at runtime.
 *
 * @param tx - An NFTokenCancelOffer Transaction.
 * @throws When the NFTokenCancelOffer is Malformed.
 */
export function validateNFTokenCancelOffer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (!Array.isArray(tx.TokenIDs) || tx.TokenIDs.length < 1) {
    throw new ValidationError('NFTokenCancelOffer: missing field TokenIDs')
  }
}
