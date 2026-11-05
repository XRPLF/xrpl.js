import { ValidationError } from '../../errors'
import { INTEGER_SANITY_CHECK } from '../utils'

import {
  Account,
  BaseTransaction,
  areAddressesEqual,
  isAccount,
  isCounterpartySignature,
  isLedgerEntryId,
  isNumber,
  isString,
  MAX_XRP_DROPS,
  validateBaseTransaction,
  validateCounterpartySigningKey,
  validateFlagsMask,
  validateOptionalField,
} from './common'
import type { CounterpartySignature } from './loanSet'

/**
 * The FirewallSet transaction creates an account's Firewall, or updates the
 * Counterparty or MaxFee of an existing one with the Counterparty's signature.
 *
 * @category Transaction Models
 */
export interface FirewallSet extends BaseTransaction {
  TransactionType: 'FirewallSet'

  /**
   * The account that must co-sign the firewalled account's outgoing value and
   * any change to the Firewall. Required to create a Firewall; on an update,
   * the new counterparty.
   */
  Counterparty?: Account

  /**
   * The destination preauthorized when the Firewall is created, so the account
   * can always reach one destination. Required to create a Firewall; not
   * allowed on an update.
   */
  Backup?: Account

  /**
   * The highest fee, in drops of XRP, a firewalled transaction may pay without
   * the Counterparty's signature. On an update, 0 removes the cap.
   */
  MaxFee?: string

  /**
   * The destination tag of the Backup preauthorization made when the Firewall
   * is created.
   */
  DestinationTag?: number

  /**
   * The signature of the Firewall's recorded Counterparty. Required on an
   * update; not allowed on a create.
   */
  CounterpartySignature?: CounterpartySignature

  /**
   * The ID of the Firewall to update. Absent on a create.
   */
  FirewallID?: string
}

/**
 * Check whether a value is a non-negative legal XRP amount in drops.
 *
 * @param value - The value to check.
 * @returns Whether the value is an integer drops string of at most the XRP supply.
 */
function isLegalXRPDrops(value: string): boolean {
  return INTEGER_SANITY_CHECK.test(value) && BigInt(value) <= MAX_XRP_DROPS
}

/**
 * Verify that an account field is present and is not the transaction's Account.
 *
 * @param tx - A FirewallSet Transaction.
 * @param field - The account field to check.
 * @throws When the field is absent or names the Account.
 */
function validateCreateAccountField(
  tx: Record<string, unknown>,
  field: 'Counterparty' | 'Backup',
): void {
  const value = tx[field]
  if (value === undefined) {
    throw new ValidationError(
      `FirewallSet: ${field} is required to create a firewall`,
    )
  }
  validateNotAccount(tx, field)
}

/**
 * Verify that an account field, when present, is not the transaction's Account.
 *
 * @param tx - A FirewallSet Transaction.
 * @param field - The account field to check.
 * @throws When the field names the Account.
 */
function validateNotAccount(
  tx: Record<string, unknown>,
  field: 'Counterparty' | 'Backup',
): void {
  const value = tx[field]
  if (
    isString(value) &&
    isString(tx.Account) &&
    areAddressesEqual(value, tx.Account)
  ) {
    throw new ValidationError(`FirewallSet: ${field} must not be the Account`)
  }
}

/**
 * Verify the fields of a FirewallSet that creates a Firewall.
 *
 * @param tx - A FirewallSet Transaction without a FirewallID.
 * @throws When the create is malformed.
 */
function validateCreate(tx: Record<string, unknown>): void {
  validateCreateAccountField(tx, 'Counterparty')
  validateCreateAccountField(tx, 'Backup')
  if (tx.CounterpartySignature !== undefined) {
    throw new ValidationError(
      'FirewallSet: CounterpartySignature is not allowed to create a firewall',
    )
  }
}

/**
 * Verify the fields of a FirewallSet that updates a Firewall.
 *
 * @param tx - A FirewallSet Transaction with a FirewallID.
 * @throws When the update is malformed.
 */
function validateUpdate(tx: Record<string, unknown>): void {
  if (tx.Backup !== undefined) {
    throw new ValidationError(
      'FirewallSet: Backup is not allowed to update a firewall',
    )
  }
  validateNotAccount(tx, 'Counterparty')
  if (tx.CounterpartySignature === undefined) {
    throw new ValidationError(
      'FirewallSet: CounterpartySignature is required to update a firewall',
    )
  }
  validateCounterpartySigningKey(tx)
}

/**
 * Verify the form and type of a {@link FirewallSet} at runtime.
 *
 * @param tx - A {@link FirewallSet} Transaction.
 * @throws When the {@link FirewallSet} is malformed.
 */
export function validateFirewallSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)

  validateOptionalField(tx, 'Counterparty', isAccount)
  validateOptionalField(tx, 'Backup', isAccount)
  validateOptionalField(tx, 'MaxFee', isString)
  validateOptionalField(tx, 'DestinationTag', isNumber)
  validateOptionalField(tx, 'CounterpartySignature', isCounterpartySignature)
  validateOptionalField(tx, 'FirewallID', isLedgerEntryId)

  if (tx.FirewallID === undefined) {
    validateCreate(tx)
  } else {
    validateUpdate(tx)
  }

  if (tx.MaxFee !== undefined && !isLegalXRPDrops(tx.MaxFee)) {
    throw new ValidationError(
      `FirewallSet: MaxFee must be a non-negative XRP amount in drops of at most ${MAX_XRP_DROPS.toString()}`,
    )
  }
}
