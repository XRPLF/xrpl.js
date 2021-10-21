import { ValidationError } from '../../errors'
import { Amount } from '../common'

import {
  BaseTransaction,
  GlobalFlags,
  validateBaseTransaction,
  isAmount,
} from './common'

/**
 * Transaction Flags for an NFTokenCreateOffer Transaction.
 *
 * @category Transaction Flags
 */
export enum NFTokenCreateOfferFlags {
  /**
   * If set, indicates that the offer is a sell offer.
   * Otherwise, it is a buy offer.
   */
  tfSellToken = 0x00000001,
}

/**
 * Map of flags to boolean values representing {@link NFTokenCreateOffer} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface NFTokenCreateOfferFlagsInterface extends GlobalFlags {
  tfSellToken?: boolean
}

/**
 * The NFTokenCreateOffer transaction creates an NFToken object and adds it to the
 * relevant NFTokenPage object of the minter. If the transaction is
 * successful, the newly minted token will be owned by the minter account
 * specified by the transaction.
 */
export interface NFTokenCreateOffer extends BaseTransaction {
  TransactionType: 'NFTokenCreateOffer'
  /**
   * Indicates the AccountID of the account that initiated the
   * transaction.
   */
  Account: string
  /**
   * Identifies the TokenID of the NFToken object that the
   * offer references.
   */
  TokenID: string
  /**
   * Indicates the amount expected or offered for the Token.
   *
   * The amount must be non-zero, except where this is an
   * offer is an offer to sell and the asset is XRP; then it
   * is legal to specify an amount of zero, which means that
   * the current owner of the token is giving it away, gratis,
   * either to anyone at all, or to the account identified by
   * the Destination field.
   */
  Amount: Amount
  /**
   * Indicates the AccountID of the account that owns the
   * corresponding NFToken.
   *
   * If the offer is to buy a token, this field must be present
   * and it must be different than Account (since an offer to
   * buy a token one already holds is meaningless).
   *
   * If the offer is to sell a token, this field must not be
   * present, as the owner is, implicitly, the same as Account
   * (since an offer to sell a token one doesn't already hold
   * is meaningless).
   */
  Owner?: string
  /**
   * Indicates the time after which the offer will no longer
   * be valid. The value is the number of seconds since the
   * Ripple Epoch.
   */
  Expiration?: number
  /**
   * If present, indicates that this offer may only be
   * accepted by the specified account. Attempts by other
   * accounts to accept this offer MUST fail.
   */
  Destination?: string
  Flags?: number | NFTokenCreateOfferFlagsInterface
}

/**
 * Verify the form and type of an NFTokenCreateOffer at runtime.
 *
 * @param tx - An NFTokenCreateOffer Transaction.
 * @throws When the NFTokenCreateOffer is Malformed.
 */
export function validateNFTokenCreateOffer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Account == null) {
    throw new ValidationError('NFTokenCreateOffer: missing field Account')
  }

  if (tx.TokenID == null) {
    throw new ValidationError('NFTokenCreateOffer: missing field TokenID')
  }

  if (tx.Amount == null) {
    throw new ValidationError('NFTokenCreateOffer: missing field Amount')
  }

  if (typeof tx.Amount !== 'string' && !isAmount(tx.Amount)) {
    throw new ValidationError('NFTokenCreateOffer: invalid Amount')
  }
}
