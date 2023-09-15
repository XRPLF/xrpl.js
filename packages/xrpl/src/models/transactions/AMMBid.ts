import { ValidationError } from '../../errors'
import { AuthAccount, Currency, IssuedCurrencyAmount } from '../common'

import {
  BaseTransaction,
  isAmount,
  isCurrency,
  validateBaseTransaction,
} from './common'

const MAX_AUTH_ACCOUNTS = 4

/**
 * Bid on an Automated Market Maker's (AMM's) auction slot.
 *
 * If you win, you can trade against the AMM at a discounted fee until you are outbid or 24 hours have passed.
 * If you are outbid before 24 hours have passed, you are refunded part of the cost of your bid based on how much time remains.
 * You bid using the AMM's LP Tokens; the amount of a winning bid is returned to the AMM,
 * decreasing the outstanding balance of LP Tokens.
 */
export interface AMMBid extends BaseTransaction {
  TransactionType: 'AMMBid'

  /**
   * The definition for one of the assets in the AMM's pool.
   */
  Asset: Currency

  /**
   * The definition for the other asset in the AMM's pool.
   */
  Asset2: Currency

  /**
   * Pay at least this LPToken amount for the slot.
   * Setting this value higher makes it harder for others to outbid you.
   * If omitted, pay the minimum necessary to win the bid.
   */
  BidMin?: IssuedCurrencyAmount

  /**
   * Pay at most this LPToken amount for the slot.
   * If the cost to win the bid is higher than this amount, the transaction fails.
   * If omitted, pay as much as necessary to win the bid.
   */
  BidMax?: IssuedCurrencyAmount

  /**
   * A list of up to 4 additional accounts that you allow to trade at the discounted fee.
   * This cannot include the address of the transaction sender.
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
    throw new ValidationError('AMMBid: Asset must be a Currency')
  }

  if (tx.Asset2 == null) {
    throw new ValidationError('AMMBid: missing field Asset2')
  }

  if (!isCurrency(tx.Asset2)) {
    throw new ValidationError('AMMBid: Asset2 must be a Currency')
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
    validateAuthAccounts(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Only used by JS
      tx.Account as string,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Only used by JS
      tx.AuthAccounts as Array<Record<string, unknown>>,
    )
  }
}

function validateAuthAccounts(
  senderAddress: string,
  authAccounts: Array<Record<string, unknown>>,
): boolean {
  for (const authAccount of authAccounts) {
    if (
      authAccount.AuthAccount == null ||
      typeof authAccount.AuthAccount !== 'object'
    ) {
      throw new ValidationError(`AMMBid: invalid AuthAccounts`)
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- used for null check
    // @ts-expect-error -- used for null check
    if (authAccount.AuthAccount.Account == null) {
      throw new ValidationError(`AMMBid: invalid AuthAccounts`)
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- used for null check
    // @ts-expect-error -- used for null check
    if (typeof authAccount.AuthAccount.Account !== 'string') {
      throw new ValidationError(`AMMBid: invalid AuthAccounts`)
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- used for null check
    // @ts-expect-error -- used for null check
    if (authAccount.AuthAccount.Account === senderAddress) {
      throw new ValidationError(
        `AMMBid: AuthAccounts must not include sender's address`,
      )
    }
  }

  return true
}
