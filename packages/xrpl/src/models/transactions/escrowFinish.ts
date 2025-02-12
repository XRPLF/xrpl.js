import {
  Account,
  BaseTransaction,
  isAccount,
  isNumber,
  isString,
  validateBaseTransaction,
  validateCredentialsList,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Deliver XRP from a held payment to the recipient.
 *
 * @category Transaction Models
 */
export interface EscrowFinish extends BaseTransaction {
  TransactionType: 'EscrowFinish'
  /** Address of the source account that funded the held payment. */
  Owner: Account
  /**
   * Transaction sequence of EscrowCreate transaction that created the held.
   * payment to finish.
   */
  OfferSequence: number | string
  /**
   * Hex value matching the previously-supplied PREIMAGE-SHA-256.
   * crypto-condition of the held payment.
   */
  Condition?: string
  /**
   * Hex value of the PREIMAGE-SHA-256 crypto-condition fulfillment matching.
   * the held payment's Condition.
   */
  Fulfillment?: string
  /** Credentials associated with the sender of this transaction.
   * The credentials included must not be expired.
   */
  CredentialIDs?: string[]
}

/**
 * Verify the form and type of an EscrowFinish at runtime.
 *
 * @param tx - An EscrowFinish Transaction.
 * @throws When the EscrowFinish is Malformed.
 */
export function validateEscrowFinish(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Owner', isAccount)

  validateCredentialsList(
    tx.CredentialIDs,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- known from base check
    tx.TransactionType as string,
    true,
  )

  validateRequiredField(
    tx,
    'OfferSequence',
    (inp) => isNumber(inp) || isString(inp),
  )
  validateOptionalField(tx, 'Condition', isString)
  validateOptionalField(tx, 'Fulfillment', isString)
}
