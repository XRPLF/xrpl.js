import { ValidationError } from '../../errors'
import { Amount } from '../common'
import { isFlagEnabled } from '../utils'

import {
  BaseTransaction,
  GlobalFlags,
  validateBaseTransaction,
  isAmount,
  parseAmountValue,
  isAccount,
  validateOptionalField,
  Account,
} from './common'
import type { TransactionMetadataBase } from './metadata'

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
  tfSellNFToken = 0x00000001,
}

/**
 * Map of flags to boolean values representing {@link NFTokenCreateOffer} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface NFTokenCreateOfferFlagsInterface extends GlobalFlags {
  tfSellNFToken?: boolean
}

/**
 * The NFTokenCreateOffer transaction creates either an offer to buy an
 * NFT the submitting account does not own, or an offer to sell an NFT
 * the submitting account does own.
 */
export interface NFTokenCreateOffer extends BaseTransaction {
  TransactionType: 'NFTokenCreateOffer'
  /**
   * Identifies the NFTokenID of the NFToken object that the
   * offer references.
   */
  NFTokenID: string
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
  Owner?: Account
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
  Destination?: Account
  Flags?: number | NFTokenCreateOfferFlagsInterface
}

export interface NFTokenCreateOfferMetadata extends TransactionMetadataBase {
  // rippled 1.11.0 or later
  offer_id?: string
}

function validateNFTokenSellOfferCases(tx: Record<string, unknown>): void {
  if (tx.Owner != null) {
    throw new ValidationError(
      'NFTokenCreateOffer: Owner must not be present for sell offers',
    )
  }
}

function validateNFTokenBuyOfferCases(tx: Record<string, unknown>): void {
  if (tx.Owner == null) {
    throw new ValidationError(
      'NFTokenCreateOffer: Owner must be present for buy offers',
    )
  }

  if (parseAmountValue(tx.Amount) <= 0) {
    throw new ValidationError(
      'NFTokenCreateOffer: Amount must be greater than 0 for buy offers',
    )
  }
}

/**
 * Verify the form and type of an NFTokenCreateOffer at runtime.
 *
 * @param tx - An NFTokenCreateOffer Transaction.
 * @throws When the NFTokenCreateOffer is Malformed.
 */
export function validateNFTokenCreateOffer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Account === tx.Owner) {
    throw new ValidationError(
      'NFTokenCreateOffer: Owner and Account must not be equal',
    )
  }

  if (tx.Account === tx.Destination) {
    throw new ValidationError(
      'NFTokenCreateOffer: Destination and Account must not be equal',
    )
  }

  validateOptionalField(tx, 'Destination', isAccount)
  validateOptionalField(tx, 'Owner', isAccount)

  if (tx.NFTokenID == null) {
    throw new ValidationError('NFTokenCreateOffer: missing field NFTokenID')
  }

  if (!isAmount(tx.Amount)) {
    throw new ValidationError('NFTokenCreateOffer: invalid Amount')
  }

  if (
    typeof tx.Flags === 'number' &&
    isFlagEnabled(tx.Flags, NFTokenCreateOfferFlags.tfSellNFToken)
  ) {
    validateNFTokenSellOfferCases(tx)
  } else {
    validateNFTokenBuyOfferCases(tx)
  }
}
