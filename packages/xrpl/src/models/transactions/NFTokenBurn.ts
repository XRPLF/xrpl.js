import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * The NFTokenBurn transaction is used to remove an NFToken object from the
 * NFTokenPage in which it is being held, effectively removing the token from
 * the ledger ("burning" it).
 *
 * If this operation succeeds, the corresponding NFToken is removed. If this
 * operation empties the NFTokenPage holding the NFToken or results in the
 * consolidation, thus removing an NFTokenPage, the owner’s reserve requirement
 * is reduced by one.
 */
export interface NFTokenBurn extends BaseTransaction {
  TransactionType: 'NFTokenBurn'
  /**
   * Indicates the AccountID that submitted this transaction. The account MUST
   * be either the present owner of the token or, if the lsfBurnable flag is set
   * in the NFToken, either the issuer account or an account authorized by the
   * issuer, i.e. MintAccount.
   */
  Account: string
  /**
   * Identifies the NFToken object to be removed by the transaction.
   */
  NFTokenID: string
  /**
   * Indicates which account currently owns the token if it is different than
   * Account. Only used to burn tokens which have the lsfBurnable flag enabled
   * and are not owned by the signing account.
   */
  Owner?: string
}

/**
 * Verify the form and type of an NFTokenBurn at runtime.
 *
 * @param tx - An NFTokenBurn Transaction.
 * @throws When the NFTokenBurn is Malformed.
 */
export function validateNFTokenBurn(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.NFTokenID == null) {
    throw new ValidationError('NFTokenBurn: missing field NFTokenID')
  }
}
