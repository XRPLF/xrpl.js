import { ValidationError } from '../../errors'

import {
  Account,
  BaseTransaction,
  areAddressesEqual,
  isAccount,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
} from './common'

/**
 * The longest inactivity period, in seconds, a beneficiary designation may
 * require: ten years (rippled `kMaxBeneficiaryTimeLock`).
 */
export const MAX_BENEFICIARY_TIME_LOCK = 315360000

/** The classic address of the all-zero AccountID. */
const ZERO_ACCOUNT = 'rrrrrrrrrrrrrrrrrrrrrhoLvTp'

/**
 * The BeneficiarySet transaction designates, updates or clears the account
 * that may sign for this account once it has been silent for `TimeLock`
 * seconds. Sending it with neither `Beneficiary` nor `TimeLock` clears the
 * designation.
 *
 * @category Transaction Models
 */
export interface BeneficiarySet extends BaseTransaction {
  TransactionType: 'BeneficiarySet'

  /**
   * The account that may sign for this account after `TimeLock` seconds of
   * inactivity. Must be set together with `TimeLock`, must not be the sending
   * account, and must not be the zero account.
   */
  Beneficiary?: Account

  /**
   * The inactivity period, in seconds, after which the beneficiary may act.
   * Must be set together with `Beneficiary`, from 1 to
   * {@link MAX_BENEFICIARY_TIME_LOCK}.
   */
  TimeLock?: number
}

/**
 * Verify the designation fields of a {@link BeneficiarySet} once both are present.
 *
 * @param tx - A BeneficiarySet Transaction with Beneficiary and TimeLock set.
 * @param beneficiary - The Beneficiary field.
 * @param timeLock - The TimeLock field.
 * @throws When the designation is malformed.
 */
function validateDesignation(
  tx: Record<string, unknown>,
  beneficiary: string,
  timeLock: number,
): void {
  if (isAccount(tx.Account) && areAddressesEqual(beneficiary, tx.Account)) {
    throw new ValidationError(
      'BeneficiarySet: Beneficiary must not be the Account',
    )
  }

  if (areAddressesEqual(beneficiary, ZERO_ACCOUNT)) {
    throw new ValidationError(
      'BeneficiarySet: Beneficiary must not be the zero account',
    )
  }

  if (
    !Number.isInteger(timeLock) ||
    timeLock < 1 ||
    timeLock > MAX_BENEFICIARY_TIME_LOCK
  ) {
    throw new ValidationError(
      `BeneficiarySet: TimeLock must be an integer from 1 to ${MAX_BENEFICIARY_TIME_LOCK}`,
    )
  }
}

/**
 * Verify the form and type of a {@link BeneficiarySet} at runtime.
 *
 * @param tx - A {@link BeneficiarySet} Transaction.
 * @throws When the {@link BeneficiarySet} is malformed.
 */
export function validateBeneficiarySet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateOptionalField(tx, 'Beneficiary', isAccount)
  validateOptionalField(tx, 'TimeLock', isNumber)

  if ((tx.Beneficiary === undefined) !== (tx.TimeLock === undefined)) {
    throw new ValidationError(
      'BeneficiarySet: Beneficiary and TimeLock must both be present or both be absent',
    )
  }

  if (tx.Beneficiary !== undefined && tx.TimeLock !== undefined) {
    validateDesignation(tx, tx.Beneficiary, tx.TimeLock)
  }
}
