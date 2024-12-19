import {
  Account,
  BaseTransaction,
  isAccount,
  isNumber,
  validateBaseTransaction,
  validateCredentialsList,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * An AccountDelete transaction deletes an account and any objects it owns in
 * the XRP Ledger, if possible, sending the account's remaining XRP to a
 * specified destination account.
 *
 * @category Transaction Models
 */
export interface AccountDelete extends BaseTransaction {
  TransactionType: 'AccountDelete'
  /**
   * The address of an account to receive any leftover XRP after deleting the
   * sending account. Must be a funded account in the ledger, and must not be.
   * the sending account.
   */
  Destination: Account
  /**
   * Arbitrary destination tag that identifies a hosted recipient or other.
   * information for the recipient of the deleted account's leftover XRP.
   */
  DestinationTag?: number
  /**
   * Credentials associated with sender of this transaction. The credentials included
   * must not be expired. The list must not be empty when specified and cannot contain
   * more than 8 credentials.
   */
  CredentialIDs?: string[]
}

/**
 * Verify the form and type of an AccountDelete at runtime.
 *
 * @param tx - An AccountDelete Transaction.
 * @throws When the AccountDelete is Malformed.
 */
export function validateAccountDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Destination', isAccount)
  validateOptionalField(tx, 'DestinationTag', isNumber)

  validateCredentialsList(
    tx.CredentialIDs,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- known from base check
    tx.TransactionType as string,
    true,
  )
}
