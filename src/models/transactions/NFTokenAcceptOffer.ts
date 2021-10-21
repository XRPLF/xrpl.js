import { ValidationError } from '../../errors'
import { Amount } from '../common'

import { BaseTransaction, validateBaseTransaction, isAmount } from './common'

/**
 * The NFTokenAcceptOffer transaction creates an NFToken object and adds it to the
 * relevant NFTokenPage object of the minter. If the transaction is
 * successful, the newly minted token will be owned by the minter account
 * specified by the transaction.
 */
export interface NFTokenAcceptOffer extends BaseTransaction {
  TransactionType: 'NFTokenAcceptOffer'
  /**
   * Identifies the NFTokenOffer that offers to sell the NFToken.
   *
   * In direct mode this field is optional, but either SellOffer or
   * BuyOffer must be specified. In brokered mode, both SellOffer
   * and BuyOffer MUST be specified.
   */
  SellOffer?: string
  /**
   * Identifies the NFTokenOffer that offers to buy the NFToken.
   *
   * In direct mode this field is optional, but either SellOffer or
   * BuyOffer must be specified. In brokered mode, both SellOffer
   * and BuyOffer MUST be specified.
   */
  BuyOffer?: string
  /**
   * This field is only valid in brokered mode and specifies the
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
   * If both offers are for the same asset, it is possible that
   * the order in which funds are transferred might cause a
   * transaction that would succeed to fail due to an apparent
   * lack of funds. To ensure deterministic transaction execution
   * and maximimize the chances of successful execution, this
   * proposal requires that the account attempting to buy the
   * NFToken is debited first and that funds due to the broker
   * are credited before crediting the seller.
   *
   * Note: in brokered mode, The offers referenced by BuyOffer
   * and SellOffer must both specify the same TokenID; that is,
   * both must be for the same NFToken.
   */
  BrokerFee?: Amount
}

/**
 * Verify the form and type of an NFTokenAcceptOffer at runtime.
 *
 * @param tx - An NFTokenAcceptOffer Transaction.
 * @throws When the NFTokenAcceptOffer is Malformed.
 */
export function validateNFTokenAcceptOffer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (
    tx.BrokerFee != null &&
    typeof tx.BrokerFee !== 'string' &&
    !isAmount(tx.BrokerFee)
  ) {
    throw new ValidationError('NFTokenAcceptOffer: invalid BrokerFee')
  }

  // TODO more validations
}
