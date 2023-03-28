/* eslint-disable complexity -- required for validateAMMBid */
import { ValidationError } from '../../errors'
import { Amount, Currency } from '../common'

import {
  BaseTransaction,
  isAmount,
  isCurrency,
  validateBaseTransaction,
} from './common'

const MAX_AUTH_ACCOUNTS = 4

interface AuthAccount {
  AuthAccount: {
    Account: string
  }
}

/**
 * AMMBid is used for submitting a vote for the trading fee of an AMM Instance.
 *
 * Any XRPL account that holds LPToken for an AMM instance may submit this
 * transaction to vote for the trading fee for that instance.
 */
export interface AMMBid extends BaseTransaction {
  TransactionType: 'AMMBid'

  /**
   * Specifies one of the pool assets (XRP or token) of the AMM instance.
   */
  Asset: Currency

  /**
   * Specifies the other pool asset of the AMM instance.
   */
  Asset2: Currency

  /**
   * This field represents the minimum price that the bidder wants to pay for the slot.
   * It is specified in units of LPToken. If specified let BidMin be X and let
   * the slot-price computed by price scheduling algorithm be Y, then bidder always pays
   * the max(X, Y).
   */
  BidMin?: Amount

  /**
   * This field represents the maximum price that the bidder wants to pay for the slot.
   * It is specified in units of LPToken.
   */
  BidMax?: Amount

  /**
   * This field represents an array of XRPL account IDs that are authorized to trade
   * at the discounted fee against the AMM instance.
   * A maximum of four accounts can be provided.
   */
  AuthAccounts?: AuthAccount[]
}

/**
 * Verify the form and type of an AMMBid at runtime.
 *
 * @param tx - An AMMBid Transaction.
 * @throws When the AMMBid is Malformed.
 */
export function validateAMMBid(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Asset == null) {
    throw new ValidationError('AMMBid: missing field Asset')
  }

  if (!isCurrency(tx.Asset)) {
    throw new ValidationError('AMMBid: Asset must be an Issue')
  }

  if (tx.Asset2 == null) {
    throw new ValidationError('AMMBid: missing field Asset2')
  }

  if (!isCurrency(tx.Asset2)) {
    throw new ValidationError('AMMBid: Asset2 must be an Issue')
  }

  if (tx.BidMin != null && !isAmount(tx.BidMin)) {
    throw new ValidationError('AMMBid: BidMin must be an Amount')
  }

  if (tx.BidMax != null && !isAmount(tx.BidMax)) {
    throw new ValidationError('AMMBid: BidMax must be an Amount')
  }

  if (tx.AuthAccounts != null) {
    if (!Array.isArray(tx.AuthAccounts)) {
      throw new ValidationError(
        `AMMBid: AuthAccounts must be an AuthAccount array`,
      )
    }
    if (tx.AuthAccounts.length > MAX_AUTH_ACCOUNTS) {
      throw new ValidationError(
        `AMMBid: AuthAccounts length must not be greater than ${MAX_AUTH_ACCOUNTS}`,
      )
    }
  }
}
