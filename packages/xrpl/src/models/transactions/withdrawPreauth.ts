import { ValidationError } from '../../errors'

import {
  Account,
  BaseTransaction,
  areAddressesEqual,
  isAccount,
  isCounterpartySignature,
  isLedgerEntryId,
  isNumber,
  validateBaseTransaction,
  validateCounterpartySigningKey,
  validateFlagsMask,
  validateOptionalField,
  validateRequiredField,
} from './common'
import type { CounterpartySignature } from './loanSet'

/** The classic address of the all-zero AccountID. */
const ZERO_ACCOUNT = 'rrrrrrrrrrrrrrrrrrrrrhoLvTp'

/**
 * The WithdrawPreauth transaction preauthorizes a destination that a
 * firewalled account may send value to without the Counterparty co-signing,
 * or removes such a preauthorization, with the Counterparty's signature.
 *
 * @category Transaction Models
 */
export interface WithdrawPreauth extends BaseTransaction {
  TransactionType: 'WithdrawPreauth'

  /**
   * The destination to preauthorize. Exactly one of Authorize and Unauthorize
   * is required.
   */
  Authorize?: Account

  /**
   * The destination whose preauthorization is removed. Exactly one of
   * Authorize and Unauthorize is required.
   */
  Unauthorize?: Account

  /**
   * The destination tag the preauthorization applies to; absent means tag 0.
   */
  DestinationTag?: number

  /**
   * The signature of the Firewall's recorded Counterparty.
   */
  CounterpartySignature: CounterpartySignature

  /**
   * The ID of the account's Firewall.
   */
  FirewallID: string
}

/**
 * Verify the Authorize and Unauthorize fields of a WithdrawPreauth.
 *
 * @param tx - A WithdrawPreauth Transaction.
 * @param tx.Account - The account sending the transaction.
 * @param tx.Authorize - The destination to preauthorize.
 * @param tx.Unauthorize - The destination whose preauthorization is removed.
 * @throws When not exactly one is present, the target is the zero account, or
 * Authorize names the Account.
 */
function validateTarget(tx: {
  Account: string
  Authorize?: string
  Unauthorize?: string
}): void {
  const target = tx.Authorize ?? tx.Unauthorize
  if (
    target === undefined ||
    (tx.Authorize !== undefined && tx.Unauthorize !== undefined)
  ) {
    throw new ValidationError(
      'WithdrawPreauth: exactly one of Authorize and Unauthorize is required',
    )
  }
  if (areAddressesEqual(target, ZERO_ACCOUNT)) {
    throw new ValidationError(
      'WithdrawPreauth: the authorized account must not be the zero account',
    )
  }
  if (tx.Authorize !== undefined && areAddressesEqual(target, tx.Account)) {
    throw new ValidationError(
      'WithdrawPreauth: Account cannot preauthorize itself',
    )
  }
}

/**
 * Verify the form and type of a {@link WithdrawPreauth} at runtime.
 *
 * @param tx - A {@link WithdrawPreauth} Transaction.
 * @throws When the {@link WithdrawPreauth} is malformed.
 */
export function validateWithdrawPreauth(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)

  validateOptionalField(tx, 'Authorize', isAccount)
  validateOptionalField(tx, 'Unauthorize', isAccount)
  validateOptionalField(tx, 'DestinationTag', isNumber)
  validateRequiredField(tx, 'CounterpartySignature', isCounterpartySignature)
  validateRequiredField(tx, 'FirewallID', isLedgerEntryId)

  validateTarget(tx)
  validateCounterpartySigningKey(tx)
}
