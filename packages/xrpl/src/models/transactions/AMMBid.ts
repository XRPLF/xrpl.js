import { ValidationError } from '../../errors'
import { Amount } from '../common'

import { BaseTransaction, isAmount, validateBaseTransaction } from './common'

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
   * A hash that uniquely identifies the AMM instance. This field is required.
   */
  AMMID: string

  /**
   * This field represents the minimum price that the bidder wants to pay for the slot.
   * It is specified in units of LPToken. If specified let MinBidPrice be X and let
   * the slot-price computed by price scheduling algorithm be Y, then bidder always pays
   * the max(X, Y).
   */
  MinBidPrice?: Amount

  /**
   * This field represents the maximum price that the bidder wants to pay for the slot.
   * It is specified in units of LPToken.
   */
  MaxBidPrice?: Amount

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

  if (tx.AMMID == null) {
    throw new ValidationError('AMMBid: missing field AMMID')
  }

  if (typeof tx.AMMID !== 'string') {
    throw new ValidationError('AMMBid: AMMID must be a string')
  }

  if (tx.MinBidPrice != null && !isAmount(tx.MinBidPrice)) {
    throw new ValidationError('AMMBid: MinBidPrice must be an Amount')
  }

  if (tx.MaxBidPrice != null && !isAmount(tx.MaxBidPrice)) {
    throw new ValidationError('AMMBid: MaxBidPrice must be an Amount')
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
