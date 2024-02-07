import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'
import type { TransactionMetadataBase } from './metadata'

/**
 * The NFTokenCancelOffer transaction deletes existing NFTokenOffer objects.
 * It is useful if you want to free up space on your account to lower your
 * reserve requirement.
 *
 * The transaction can be executed by the account that originally created
 * the NFTokenOffer, the account in the `Recipient` field of the NFTokenOffer
 * (if present), or any account if the NFTokenOffer has an `Expiration` and
 * the NFTokenOffer has already expired.
 */
export interface NFTokenCancelOffer extends BaseTransaction {
  TransactionType: 'NFTokenCancelOffer'
  /**
   * An array of identifiers of NFTokenOffer objects that should be cancelled
   * by this transaction.
   *
   * It is an error if an entry in this list points to an
   * object that is not an NFTokenOffer object. It is not an
   * error if an entry in this list points to an object that
   * does not exist. This field is required.
   */
  NFTokenOffers: string[]
}

export interface NFTokenCancelOfferMetadata extends TransactionMetadataBase {
  // rippled 1.11.0  or  later
  nftoken_ids?: string[]
}

/**
 * Verify the form and type of an NFTokenCancelOffer at runtime.
 *
 * @param tx - An NFTokenCancelOffer Transaction.
 * @throws When the NFTokenCancelOffer is Malformed.
 */
export function validateNFTokenCancelOffer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (!Array.isArray(tx.NFTokenOffers)) {
    throw new ValidationError('NFTokenCancelOffer: missing field NFTokenOffers')
  }

  if (tx.NFTokenOffers.length < 1) {
    throw new ValidationError('NFTokenCancelOffer: empty field NFTokenOffers')
  }
}
