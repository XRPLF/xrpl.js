import { ValidationError } from '../../errors'
import { Amount } from '../common'

import {
  BaseTransaction,
  parseAmountValue,
  validateBaseTransaction,
} from './common'
import type { TransactionMetadataBase } from './metadata'

/**
 *  The NFTokenOfferAccept transaction is used to accept offers
 *  to buy or sell an NFToken. It can either:
 *
 *  1. Allow one offer to be accepted. This is called direct
 *     mode.
 *  2. Allow two distinct offers, one offering to buy a
 *     given NFToken and the other offering to sell the same
 *     NFToken, to be accepted in an atomic fashion. This is
 *     called brokered mode.
 *
 *  To indicate direct mode, use either the `sell_offer` or
 *  `buy_offer` fields, but not both. To indicate brokered mode,
 *  use both the `sell_offer` and `buy_offer` fields. If you use
 *  neither `sell_offer` nor `buy_offer`, the transaction is invalid.
 */
export interface NFTokenAcceptOffer extends BaseTransaction {
  TransactionType: 'NFTokenAcceptOffer'
  /**
   *  Identifies the NFTokenOffer that offers to sell the NFToken.
   *
   *  In direct mode this field is optional, but either NFTokenSellOffer or
   *  NFTokenBuyOffer must be specified. In brokered mode, both NFTokenSellOffer
   *  and NFTokenBuyOffer must be specified.
   */
  NFTokenSellOffer?: string
  /**
   * Identifies the NFTokenOffer that offers to buy the NFToken.
   *
   * In direct mode this field is optional, but either NFTokenSellOffer or
   * NFTokenBuyOffer must be specified. In brokered mode, both NFTokenSellOffer
   * and NFTokenBuyOffer must be specified.
   */
  NFTokenBuyOffer?: string
  /**
   * This field is only valid in brokered mode. It specifies the
   * amount that the broker will keep as part of their fee for
   * bringing the two offers together; the remaining amount will
   * be sent to the seller of the NFToken being bought. If
   * specified, the fee must be such that, prior to accounting
   * for the transfer fee charged by the issuer, the amount that
   * the seller would receive is at least as much as the amount
   * indicated in the sell offer.
   *
   * This functionality is intended to allow the owner of an
   * NFToken to offer their token for sale to a third party
   * broker, who may then attempt to sell the NFToken on for a
   * larger amount, without the broker having to own the NFToken
   * or custody funds.
   *
   * Note: in brokered mode, the offers referenced by NFTokenBuyOffer
   * and NFTokenSellOffer must both specify the same NFTokenID; that is,
   * both must be for the same NFToken.
   */
  NFTokenBrokerFee?: Amount
}

export interface NFTokenAcceptOfferMetadata extends TransactionMetadataBase {
  // rippled 1.11.0 or later
  nftoken_id?: string
}

function validateNFTokenBrokerFee(tx: Record<string, unknown>): void {
  const value = parseAmountValue(tx.NFTokenBrokerFee)
  if (Number.isNaN(value)) {
    throw new ValidationError('NFTokenAcceptOffer: invalid NFTokenBrokerFee')
  }

  if (value <= 0) {
    throw new ValidationError(
      'NFTokenAcceptOffer: NFTokenBrokerFee must be greater than 0; omit if there is no fee',
    )
  }

  if (tx.NFTokenSellOffer == null || tx.NFTokenBuyOffer == null) {
    throw new ValidationError(
      'NFTokenAcceptOffer: both NFTokenSellOffer and NFTokenBuyOffer must be set if using brokered mode',
    )
  }
}

/**
 * Verify the form and type of an NFTokenAcceptOffer at runtime.
 *
 * @param tx - An NFTokenAcceptOffer Transaction.
 * @throws When the NFTokenAcceptOffer is Malformed.
 */
export function validateNFTokenAcceptOffer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.NFTokenBrokerFee != null) {
    validateNFTokenBrokerFee(tx)
  }

  if (tx.NFTokenSellOffer == null && tx.NFTokenBuyOffer == null) {
    throw new ValidationError(
      'NFTokenAcceptOffer: must set either NFTokenSellOffer or NFTokenBuyOffer',
    )
  }
}
