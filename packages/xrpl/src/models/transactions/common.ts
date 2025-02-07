/* eslint-disable max-lines -- common utility file */
import { HEX_REGEX } from '@xrplf/isomorphic/utils'
import { isValidClassicAddress, isValidXAddress } from 'ripple-address-codec'
import { TRANSACTION_TYPES } from 'ripple-binary-codec'

import { ValidationError } from '../../errors'
import {
  Amount,
  AuthorizeCredential,
  Currency,
  IssuedCurrencyAmount,
  MPTAmount,
  Memo,
  Signer,
  XChainBridge,
} from '../common'
import { onlyHasFields } from '../utils'

const MEMO_SIZE = 3
export const MAX_AUTHORIZED_CREDENTIALS = 8
const MAX_CREDENTIAL_BYTE_LENGTH = 64
const MAX_CREDENTIAL_TYPE_LENGTH = MAX_CREDENTIAL_BYTE_LENGTH * 2

function isMemo(obj: { Memo?: unknown }): boolean {
  if (obj.Memo == null) {
    return false
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Only used by JS
  const memo = obj.Memo as Record<string, unknown>
  const size = Object.keys(memo).length
  const validData = memo.MemoData == null || typeof memo.MemoData === 'string'
  const validFormat =
    memo.MemoFormat == null || typeof memo.MemoFormat === 'string'
  const validType = memo.MemoType == null || typeof memo.MemoType === 'string'

  return (
    size >= 1 &&
    size <= MEMO_SIZE &&
    validData &&
    validFormat &&
    validType &&
    onlyHasFields(memo, ['MemoFormat', 'MemoData', 'MemoType'])
  )
}

const SIGNER_SIZE = 3

function isSigner(obj: unknown): boolean {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Only used by JS
  const signerWrapper = obj as Record<string, unknown>

  if (signerWrapper.Signer == null) {
    return false
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Only used by JS and Signer is previously unknown
  const signer = signerWrapper.Signer as Record<string, unknown>
  return (
    Object.keys(signer).length === SIGNER_SIZE &&
    typeof signer.Account === 'string' &&
    typeof signer.TxnSignature === 'string' &&
    typeof signer.SigningPubKey === 'string'
  )
}

const XRP_CURRENCY_SIZE = 1
const ISSUE_SIZE = 2
const ISSUED_CURRENCY_SIZE = 3
const XCHAIN_BRIDGE_SIZE = 4
const MPTOKEN_SIZE = 2
const AUTHORIZE_CREDENTIAL_SIZE = 1

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

/**
 * Verify the form and type of a string at runtime.
 *
 * @param str - The object to check the form and type of.
 * @returns Whether the string is properly formed.
 */
export function isString(str: unknown): str is string {
  return typeof str === 'string'
}

/**
 * Verify the form and type of a number at runtime.
 *
 * @param num - The object to check the form and type of.
 * @returns Whether the number is properly formed.
 */
export function isNumber(num: unknown): num is number {
  return typeof num === 'number'
}

/**
 * Verify the form and type of an IssuedCurrency at runtime.
 *
 * @param input - The input to check the form and type of.
 * @returns Whether the IssuedCurrency is properly formed.
 */
export function isCurrency(input: unknown): input is Currency {
  return (
    isRecord(input) &&
    ((Object.keys(input).length === ISSUE_SIZE &&
      typeof input.issuer === 'string' &&
      typeof input.currency === 'string') ||
      (Object.keys(input).length === XRP_CURRENCY_SIZE &&
        input.currency === 'XRP'))
  )
}

/**
 * Verify the form and type of an IssuedCurrencyAmount at runtime.
 *
 * @param input - The input to check the form and type of.
 * @returns Whether the IssuedCurrencyAmount is properly formed.
 */
export function isIssuedCurrency(
  input: unknown,
): input is IssuedCurrencyAmount {
  return (
    isRecord(input) &&
    Object.keys(input).length === ISSUED_CURRENCY_SIZE &&
    typeof input.value === 'string' &&
    typeof input.issuer === 'string' &&
    typeof input.currency === 'string'
  )
}

/**
 * Verify the form and type of an AuthorizeCredential at runtime
 *
 * @param input - The input to check the form and type of
 * @returns Whether the AuthorizeCredential is properly formed
 */
export function isAuthorizeCredential(
  input: unknown,
): input is AuthorizeCredential {
  return (
    isRecord(input) &&
    isRecord(input.Credential) &&
    Object.keys(input).length === AUTHORIZE_CREDENTIAL_SIZE &&
    typeof input.Credential.CredentialType === 'string' &&
    typeof input.Credential.Issuer === 'string'
  )
}

/**
 * Verify the form and type of an MPT at runtime.
 *
 * @param input - The input to check the form and type of.
 * @returns Whether the MPTAmount is properly formed.
 */
export function isMPTAmount(input: unknown): input is MPTAmount {
  return (
    isRecord(input) &&
    Object.keys(input).length === MPTOKEN_SIZE &&
    typeof input.value === 'string' &&
    typeof input.mpt_issuance_id === 'string'
  )
}

/**
 * Must be a valid account address
 */
export type Account = string

/**
 * Verify a string is in fact a valid account address.
 *
 * @param account - The object to check the form and type of.
 * @returns Whether the account is properly formed account for a transaction.
 */
export function isAccount(account: unknown): account is Account {
  return (
    typeof account === 'string' &&
    (isValidClassicAddress(account) || isValidXAddress(account))
  )
}

/**
 * Verify the form and type of an Amount at runtime.
 *
 * @param amount - The object to check the form and type of.
 * @returns Whether the Amount is properly formed.
 */
export function isAmount(amount: unknown): amount is Amount {
  return (
    typeof amount === 'string' ||
    isIssuedCurrency(amount) ||
    isMPTAmount(amount)
  )
}

/**
 * Verify the form and type of an XChainBridge at runtime.
 *
 * @param input - The input to check the form and type of.
 * @returns Whether the XChainBridge is properly formed.
 */
export function isXChainBridge(input: unknown): input is XChainBridge {
  return (
    isRecord(input) &&
    Object.keys(input).length === XCHAIN_BRIDGE_SIZE &&
    typeof input.LockingChainDoor === 'string' &&
    isCurrency(input.LockingChainIssue) &&
    typeof input.IssuingChainDoor === 'string' &&
    isCurrency(input.IssuingChainIssue)
  )
}

/* eslint-disable @typescript-eslint/restrict-template-expressions -- tx.TransactionType is checked before any calls */

/**
 * Verify the form and type of a required type for a transaction at runtime.
 *
 * @param tx - The transaction input to check the form and type of.
 * @param paramName - The name of the transaction parameter.
 * @param checkValidity - The function to use to check the type.
 * @throws
 */
export function validateRequiredField(
  tx: Record<string, unknown>,
  paramName: string,
  checkValidity: (inp: unknown) => boolean,
): void {
  if (tx[paramName] == null) {
    throw new ValidationError(
      `${tx.TransactionType}: missing field ${paramName}`,
    )
  }

  if (!checkValidity(tx[paramName])) {
    throw new ValidationError(
      `${tx.TransactionType}: invalid field ${paramName}`,
    )
  }
}

/**
 * Verify the form and type of an optional type for a transaction at runtime.
 *
 * @param tx - The transaction input to check the form and type of.
 * @param paramName - The name of the transaction parameter.
 * @param checkValidity - The function to use to check the type.
 * @throws
 */
export function validateOptionalField(
  tx: Record<string, unknown>,
  paramName: string,
  checkValidity: (inp: unknown) => boolean,
): void {
  if (tx[paramName] !== undefined && !checkValidity(tx[paramName])) {
    throw new ValidationError(
      `${tx.TransactionType}: invalid field ${paramName}`,
    )
  }
}

/* eslint-enable @typescript-eslint/restrict-template-expressions -- checked before */

// eslint-disable-next-line @typescript-eslint/no-empty-interface -- no global flags right now, so this is fine
export interface GlobalFlags {}

/**
 * Every transaction has the same set of common fields.
 */
export interface BaseTransaction {
  /** The unique address of the transaction sender. */
  Account: Account
  /**
   * The type of transaction. Valid types include: `Payment`, `OfferCreate`,
   * `TrustSet`, and many others.
   */
  TransactionType: string
  /**
   * Integer amount of XRP, in drops, to be destroyed as a cost for
   * distributing this transaction to the network. Some transaction types have
   * different minimum requirements.
   */
  Fee?: string
  /**
   * The sequence number of the account sending the transaction. A transaction
   * is only valid if the Sequence number is exactly 1 greater than the previous
   * transaction from the same account. The special case 0 means the transaction
   * is using a Ticket instead.
   */
  Sequence?: number
  /**
   * Hash value identifying another transaction. If provided, this transaction
   * is only valid if the sending account's previously-sent transaction matches
   * the provided hash.
   */
  AccountTxnID?: string
  /** Set of bit-flags for this transaction. */
  Flags?: number | GlobalFlags
  /**
   * Highest ledger index this transaction can appear in. Specifying this field
   * places a strict upper limit on how long the transaction can wait to be
   * validated or rejected.
   */
  LastLedgerSequence?: number
  /**
   * Additional arbitrary information used to identify this transaction.
   */
  Memos?: Memo[]
  /**
   * Array of objects that represent a multi-signature which authorizes this
   * transaction.
   */
  Signers?: Signer[]
  /**
   * Arbitrary integer used to identify the reason for this payment, or a sender
   * on whose behalf this transaction is made. Conventionally, a refund should
   * specify the initial payment's SourceTag as the refund payment's
   * DestinationTag.
   */
  SourceTag?: number
  /**
   * Hex representation of the public key that corresponds to the private key
   * used to sign this transaction. If an empty string, indicates a
   * multi-signature is present in the Signers field instead.
   */
  SigningPubKey?: string
  /**
   * The sequence number of the ticket to use in place of a Sequence number. If
   * this is provided, Sequence must be 0. Cannot be used with AccountTxnID.
   */
  TicketSequence?: number
  /**
   * The signature that verifies this transaction as originating from the
   * account it says it is from.
   */
  TxnSignature?: string
  /**
   * The network id of the transaction.
   */
  NetworkID?: number
}

/**
 * Verify the common fields of a transaction. The validate functionality will be
 * optional, and will check transaction form at runtime. This should be called
 * any time a transaction will be verified.
 *
 * @param common - An interface w/ common transaction fields.
 * @throws When the common param is malformed.
 */
export function validateBaseTransaction(common: Record<string, unknown>): void {
  if (common.TransactionType === undefined) {
    throw new ValidationError('BaseTransaction: missing field TransactionType')
  }

  if (typeof common.TransactionType !== 'string') {
    throw new ValidationError('BaseTransaction: TransactionType not string')
  }

  if (!TRANSACTION_TYPES.includes(common.TransactionType)) {
    throw new ValidationError('BaseTransaction: Unknown TransactionType')
  }

  validateRequiredField(common, 'Account', isString)

  validateOptionalField(common, 'Fee', isString)

  validateOptionalField(common, 'Sequence', isNumber)

  validateOptionalField(common, 'AccountTxnID', isString)

  validateOptionalField(common, 'LastLedgerSequence', isNumber)

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Only used by JS
  const memos = common.Memos as Array<{ Memo?: unknown }> | undefined
  if (memos !== undefined && !memos.every(isMemo)) {
    throw new ValidationError('BaseTransaction: invalid Memos')
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Only used by JS
  const signers = common.Signers as Array<Record<string, unknown>> | undefined

  if (
    signers !== undefined &&
    (signers.length === 0 || !signers.every(isSigner))
  ) {
    throw new ValidationError('BaseTransaction: invalid Signers')
  }

  validateOptionalField(common, 'SourceTag', isNumber)

  validateOptionalField(common, 'SigningPubKey', isString)

  validateOptionalField(common, 'TicketSequence', isNumber)

  validateOptionalField(common, 'TxnSignature', isString)

  validateOptionalField(common, 'NetworkID', isNumber)
}

/**
 * Parse the value of an amount, expressed either in XRP or as an Issued Currency, into a number.
 *
 * @param amount - An Amount to parse for its value.
 * @returns The parsed amount value, or NaN if the amount count not be parsed.
 */
export function parseAmountValue(amount: unknown): number {
  if (!isAmount(amount)) {
    return NaN
  }
  if (typeof amount === 'string') {
    return parseFloat(amount)
  }
  return parseFloat(amount.value)
}

/**
 * Verify the form and type of a CredentialType at runtime.
 *
 * @param tx A CredentialType Transaction.
 * @throws when the CredentialType is malformed.
 */
export function validateCredentialType(tx: Record<string, unknown>): void {
  if (typeof tx.TransactionType !== 'string') {
    throw new ValidationError('Invalid TransactionType')
  }
  if (tx.CredentialType === undefined) {
    throw new ValidationError(
      `${tx.TransactionType}: missing field CredentialType`,
    )
  }

  if (!isString(tx.CredentialType)) {
    throw new ValidationError(
      `${tx.TransactionType}: CredentialType must be a string`,
    )
  }
  if (tx.CredentialType.length === 0) {
    throw new ValidationError(
      `${tx.TransactionType}: CredentialType cannot be an empty string`,
    )
  } else if (tx.CredentialType.length > MAX_CREDENTIAL_TYPE_LENGTH) {
    throw new ValidationError(
      `${tx.TransactionType}: CredentialType length cannot be > ${MAX_CREDENTIAL_TYPE_LENGTH}`,
    )
  }

  if (!HEX_REGEX.test(tx.CredentialType)) {
    throw new ValidationError(
      `${tx.TransactionType}: CredentialType must be encoded in hex`,
    )
  }
}

/**
 * Check a CredentialAuthorize array for parameter errors
 *
 * @param credentials An array of credential IDs to check for errors
 * @param transactionType The transaction type to include in error messages
 * @param isStringID Toggle for if array contains IDs instead of AuthorizeCredential objects
 * @param maxCredentials The maximum length of the credentials array.
 *        PermissionedDomainSet transaction uses 10, other transactions use 8.
 * @throws Validation Error if the formatting is incorrect
 */
// eslint-disable-next-line max-lines-per-function, max-params -- separating logic further will add unnecessary complexity
export function validateCredentialsList(
  credentials: unknown,
  transactionType: string,
  isStringID: boolean,
  maxCredentials: number,
): void {
  if (credentials == null) {
    return
  }
  if (!Array.isArray(credentials)) {
    throw new ValidationError(
      `${transactionType}: Credentials must be an array`,
    )
  }
  if (credentials.length > maxCredentials) {
    throw new ValidationError(
      `${transactionType}: Credentials length cannot exceed ${maxCredentials} elements`,
    )
  } else if (credentials.length === 0) {
    throw new ValidationError(
      `${transactionType}: Credentials cannot be an empty array`,
    )
  }
  credentials.forEach((credential) => {
    if (isStringID) {
      if (!isString(credential)) {
        throw new ValidationError(
          `${transactionType}: Invalid Credentials ID list format`,
        )
      }
    } else if (!isAuthorizeCredential(credential)) {
      throw new ValidationError(
        `${transactionType}: Invalid Credentials format`,
      )
    }
  })
  if (containsDuplicates(credentials)) {
    throw new ValidationError(
      `${transactionType}: Credentials cannot contain duplicate elements`,
    )
  }
}

// Type guard to ensure we're working with AuthorizeCredential[]
// Note: This is not a rigorous type-guard. A more thorough solution would be to iterate over the array and check each item.
function isAuthorizeCredentialArray(
  list: AuthorizeCredential[] | string[],
): list is AuthorizeCredential[] {
  return typeof list[0] !== 'string'
}

/**
 * Check if an array of objects contains any duplicates.
 *
 * @param objectList - Array of objects to check for duplicates
 * @returns True if duplicates exist, false otherwise
 */
export function containsDuplicates(
  objectList: AuthorizeCredential[] | string[],
): boolean {
  // Case-1: Process a list of string-IDs
  if (typeof objectList[0] === 'string') {
    const objSet = new Set(objectList.map((obj) => JSON.stringify(obj)))
    return objSet.size !== objectList.length
  }

  // Case-2: Process a list of nested objects
  const seen = new Set<string>()

  if (isAuthorizeCredentialArray(objectList)) {
    for (const item of objectList) {
      const key = `${item.Credential.Issuer}-${item.Credential.CredentialType}`
      // eslint-disable-next-line max-depth -- necessary to check for type-guards
      if (seen.has(key)) {
        return true
      }
      seen.add(key)
    }
  }

  return false
}
