/* eslint-disable max-lines -- common utility file */
import { HEX_REGEX, hexToString } from '@xrplf/isomorphic/utils'
import { isValidClassicAddress, isValidXAddress } from 'ripple-address-codec'
import { TRANSACTION_TYPES } from 'ripple-binary-codec'

import { ValidationError } from '../../errors'
import {
  Amount,
  AuthorizeCredential,
  ClawbackAmount,
  Currency,
  IssuedCurrency,
  IssuedCurrencyAmount,
  MPTAmount,
  MPTokenMetadata,
  Memo,
  Signer,
  XChainBridge,
} from '../common'
import { isHex, onlyHasFields } from '../utils'

const MEMO_SIZE = 3
export const MAX_AUTHORIZED_CREDENTIALS = 8
const MAX_CREDENTIAL_BYTE_LENGTH = 64
const MAX_CREDENTIAL_TYPE_LENGTH = MAX_CREDENTIAL_BYTE_LENGTH * 2
export const MAX_MPT_META_BYTE_LENGTH = 1024

// Used for Vault transactions
export const VAULT_DATA_MAX_BYTE_LENGTH = 256

// To validate MPTokenMetadata as per XLS-89d
const TICKER_REGEX = /^[A-Z0-9]{1,6}$/u

const MAX_MPT_META_TOP_LEVEL_FIELD_COUNT = 9

const MPT_META_URL_FIELD_COUNT = 3

const MPT_META_REQUIRED_FIELDS = [
  'ticker',
  'name',
  'icon',
  'asset_class',
  'issuer_name',
]

const MPT_META_ASSET_CLASSES = [
  'rwa',
  'memes',
  'wrapped',
  'gaming',
  'defi',
  'other',
]

const MPT_META_ASSET_SUB_CLASSES = [
  'stablecoin',
  'commodity',
  'real_estate',
  'private_credit',
  'equity',
  'treasury',
  'other',
]

export const MPT_META_WARNING_HEADER =
  'MPTokenMetadata is not properly formatted as JSON as per the XLS-89d standard. ' +
  "While adherence to this standard is not mandatory, such non-compliant MPToken's might not be discoverable " +
  'by Explorers and Indexers in the XRPL ecosystem.'

function isMemo(obj: unknown): obj is Memo {
  if (!isRecord(obj)) {
    return false
  }

  const memo = obj.Memo
  if (!isRecord(memo)) {
    return false
  }
  const size = Object.keys(memo).length
  const validData =
    memo.MemoData == null || (isString(memo.MemoData) && isHex(memo.MemoData))
  const validFormat =
    memo.MemoFormat == null ||
    (isString(memo.MemoFormat) && isHex(memo.MemoFormat))
  const validType =
    memo.MemoType == null || (isString(memo.MemoType) && isHex(memo.MemoType))

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

function isSigner(obj: unknown): obj is Signer {
  if (!isRecord(obj)) {
    return false
  }

  const signer = obj.Signer
  if (!isRecord(signer)) {
    return false
  }

  return (
    Object.keys(signer).length === SIGNER_SIZE &&
    isString(signer.Account) &&
    isString(signer.TxnSignature) &&
    isString(signer.SigningPubKey)
  )
}

const XRP_CURRENCY_SIZE = 1
const ISSUE_SIZE = 2
const ISSUED_CURRENCY_SIZE = 3
const XCHAIN_BRIDGE_SIZE = 4
const MPTOKEN_SIZE = 2
const AUTHORIZE_CREDENTIAL_SIZE = 1

/**
 * Verify the form and type of a Record/Object at runtime.
 *
 * @param value - The object to check the form and type of.
 * @returns Whether the Record/Object is properly formed.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
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
 * Checks whether the given value is a valid XRPL number string.
 * Accepts integer, decimal, or scientific notation strings.
 *
 * Examples of valid input:
 *   - "123"
 *   - "-987.654"
 *   - "+3.14e10"
 *   - "-7.2e-9"
 *
 * @param value - The value to check.
 * @returns True if value is a string that matches the XRPL number format, false otherwise.
 */
export function isXRPLNumber(value: unknown): value is XRPLNumber {
  // Matches optional sign, digits, optional decimal, optional exponent (scientific)
  // Allows leading zeros, but not empty string, lone sign, or missing digits
  return (
    typeof value === 'string' &&
    /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/u.test(value.trim())
  )
}

/**
 * Verify the form and type of a Currency at runtime.
 *
 * @param input - The input to check the form and type of.
 * @returns Whether the Currency is properly formed.
 */
export function isCurrency(input: unknown): input is Currency {
  return isString(input) || isIssuedCurrency(input)
}

/**
 * Verify the form and type of an IssuedCurrency at runtime.
 *
 * @param input - The input to check the form and type of.
 * @returns Whether the IssuedCurrency is properly formed.
 */
export function isIssuedCurrency(input: unknown): input is IssuedCurrency {
  return (
    isRecord(input) &&
    ((Object.keys(input).length === ISSUE_SIZE &&
      isString(input.issuer) &&
      isString(input.currency)) ||
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
export function isIssuedCurrencyAmount(
  input: unknown,
): input is IssuedCurrencyAmount {
  return (
    isRecord(input) &&
    Object.keys(input).length === ISSUED_CURRENCY_SIZE &&
    isString(input.value) &&
    isString(input.issuer) &&
    isString(input.currency)
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
 * Type guard to verify if the input is a valid ClawbackAmount.
 *
 * A ClawbackAmount can be either an {@link IssuedCurrencyAmount} or an {@link MPTAmount}.
 * This function checks if the input matches either type.
 *
 * @param input - The value to check for ClawbackAmount structure.
 * @returns True if the input is an IssuedCurrencyAmount or MPTAmount, otherwise false.
 */
export function isClawbackAmount(input: unknown): input is ClawbackAmount {
  return isIssuedCurrencyAmount(input) || isMPTAmount(input)
}

/**
 * Must be a valid account address
 */
export type Account = string

/**
 * XRPL Number type represented as a string.
 *
 * This string can be an integer (e.g., "123"), a decimal (e.g., "123.45"),
 * or in scientific notation (e.g., "1.23e5", "-4.56e-7").
 * Used for fields that accept arbitrary-precision numbers in XRPL transactions and ledger objects.
 */
export type XRPLNumber = string

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
    isIssuedCurrencyAmount(amount) ||
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
    isIssuedCurrency(input.LockingChainIssue) &&
    typeof input.IssuingChainDoor === 'string' &&
    isIssuedCurrency(input.IssuingChainIssue)
  )
}

/**
 * Verify the form and type of an Array at runtime.
 *
 * @param input - The object to check the form and type of.
 * @returns Whether the Array is properly formed.
 */
export function isArray<T = unknown>(input: unknown): input is T[] {
  return input != null && Array.isArray(input)
}

/* eslint-disable @typescript-eslint/restrict-template-expressions -- tx.TransactionType is checked before any calls */

/**
 * Verify the form and type of a required type for a transaction at runtime.
 *
 * @param tx - The object input to check the form and type of.
 * @param param - The object parameter.
 * @param checkValidity - The function to use to check the type.
 * @param errorOpts - Extra values to make the error message easier to understand.
 * @param errorOpts.txType - The transaction type throwing the error.
 * @param errorOpts.paramName - The name of the parameter in the transaction with the error.
 * @throws ValidationError if the parameter is missing or invalid.
 */
// eslint-disable-next-line max-params -- helper function
export function validateRequiredField<
  T extends Record<string, unknown>,
  K extends keyof T,
  V,
>(
  tx: T,
  param: K,
  checkValidity: (inp: unknown) => inp is V,
  errorOpts: {
    txType?: string
    paramName?: string
  } = {},
): asserts tx is T & { [P in K]: V } {
  const paramNameStr = errorOpts.paramName ?? param
  const txType = errorOpts.txType ?? tx.TransactionType
  if (tx[param] == null) {
    throw new ValidationError(
      `${txType}: missing field ${String(paramNameStr)}`,
    )
  }

  if (!checkValidity(tx[param])) {
    throw new ValidationError(
      `${txType}: invalid field ${String(paramNameStr)}`,
    )
  }
}

/**
 * Verify the form and type of an optional type for a transaction at runtime.
 *
 * @param tx - The transaction input to check the form and type of.
 * @param param - The object parameter.
 * @param checkValidity - The function to use to check the type.
 * @param errorOpts - Extra values to make the error message easier to understand.
 * @param errorOpts.txType - The transaction type throwing the error.
 * @param errorOpts.paramName - The name of the parameter in the transaction with the error.
 * @throws ValidationError if the parameter is invalid.
 */
// eslint-disable-next-line max-params -- helper function
export function validateOptionalField<
  T extends Record<string, unknown>,
  K extends keyof T,
  V,
>(
  tx: T,
  param: K,
  checkValidity: (inp: unknown) => inp is V,
  errorOpts: {
    txType?: string
    paramName?: string
  } = {},
): asserts tx is T & { [P in K]: V | undefined } {
  const paramNameStr = errorOpts.paramName ?? param
  const txType = errorOpts.txType ?? tx.TransactionType
  if (tx[param] !== undefined && !checkValidity(tx[param])) {
    throw new ValidationError(
      `${txType}: invalid field ${String(paramNameStr)}`,
    )
  }
}

/* eslint-enable @typescript-eslint/restrict-template-expressions -- checked before */

export enum GlobalFlags {
  tfInnerBatchTxn = 0x40000000,
}

export interface GlobalFlagsInterface {
  tfInnerBatchTxn?: boolean
}

/**
 * Every transaction has the same set of common fields.
 */
export interface BaseTransaction extends Record<string, unknown> {
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
  Flags?: number | GlobalFlagsInterface
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
  /**
   * The delegate account that is sending the transaction.
   */
  Delegate?: Account
}

/**
 * Verify the common fields of a transaction. The validate functionality will be
 * optional, and will check transaction form at runtime. This should be called
 * any time a transaction will be verified.
 *
 * @param common - An interface w/ common transaction fields.
 * @throws When the common param is malformed.
 */
// eslint-disable-next-line max-statements, max-lines-per-function -- lines required for validation
export function validateBaseTransaction(
  common: unknown,
): asserts common is BaseTransaction {
  if (!isRecord(common)) {
    throw new ValidationError(
      'BaseTransaction: invalid, expected a valid object',
    )
  }

  if (common.TransactionType === undefined) {
    throw new ValidationError('BaseTransaction: missing field TransactionType')
  }

  if (typeof common.TransactionType !== 'string') {
    throw new ValidationError('BaseTransaction: TransactionType not string')
  }

  if (!TRANSACTION_TYPES.includes(common.TransactionType)) {
    throw new ValidationError(
      `BaseTransaction: Unknown TransactionType ${common.TransactionType}`,
    )
  }

  validateRequiredField(common, 'Account', isString)

  validateOptionalField(common, 'Fee', isString)

  validateOptionalField(common, 'Sequence', isNumber)

  validateOptionalField(common, 'AccountTxnID', isString)

  validateOptionalField(common, 'LastLedgerSequence', isNumber)

  const memos = common.Memos
  if (memos != null && (!isArray(memos) || !memos.every(isMemo))) {
    throw new ValidationError('BaseTransaction: invalid Memos')
  }

  const signers = common.Signers

  if (
    signers != null &&
    (!isArray(signers) || signers.length === 0 || !signers.every(isSigner))
  ) {
    throw new ValidationError('BaseTransaction: invalid Signers')
  }

  validateOptionalField(common, 'SourceTag', isNumber)

  validateOptionalField(common, 'SigningPubKey', isString)

  validateOptionalField(common, 'TicketSequence', isNumber)

  validateOptionalField(common, 'TxnSignature', isString)

  validateOptionalField(common, 'NetworkID', isNumber)

  validateOptionalField(common, 'Delegate', isAccount)

  const delegate = common.Delegate
  if (delegate != null && delegate === common.Account) {
    throw new ValidationError(
      'BaseTransaction: Account and Delegate addresses cannot be the same',
    )
  }
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
export function validateCredentialType<
  T extends BaseTransaction & Record<string, unknown>,
>(tx: T): void {
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
// eslint-disable-next-line max-params, max-lines-per-function -- separating logic further will add unnecessary complexity
export function validateCredentialsList(
  credentials: unknown,
  transactionType: string,
  isStringID: boolean,
  maxCredentials: number,
): void {
  if (credentials == null) {
    return
  }
  if (!isArray(credentials)) {
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
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- checked above
  if (containsDuplicates(credentials as string[] | AuthorizeCredential[])) {
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
      if (seen.has(key)) {
        return true
      }
      seen.add(key)
    }
  }

  return false
}

const _DOMAIN_ID_LENGTH = 64

/**
 * Utility method used across OfferCreate and Payment transactions to validate the DomainID.
 *
 * @param domainID - The domainID is a 64-character string that is used to identify a domain.
 *
 * @returns true if the domainID is a valid 64-character string, false otherwise
 */
export function isDomainID(domainID: unknown): domainID is string {
  return (
    isString(domainID) &&
    domainID.length === _DOMAIN_ID_LENGTH &&
    isHex(domainID)
  )
}

/* eslint-disable max-lines-per-function -- Required here as structure validation is verbose. */
/* eslint-disable max-statements -- Required here as structure validation is verbose. */

/**
 * Validates if MPTokenMetadata adheres to XLS-89d standard.
 *
 * @param input - Hex encoded MPTokenMetadata.
 * @returns Validation messages if MPTokenMetadata does not adheres to XLS-89d standard.
 */
export function validateMPTokenMetadata(input: string): string[] {
  const validationMessages: string[] = []

  if (!isHex(input)) {
    validationMessages.push(`MPTokenMetadata must be in hex format.`)
    return validationMessages
  }

  if (input.length / 2 > MAX_MPT_META_BYTE_LENGTH) {
    validationMessages.push(
      `MPTokenMetadata must be max ${MAX_MPT_META_BYTE_LENGTH} bytes.`,
    )
    return validationMessages
  }

  let jsonMetaData: unknown

  try {
    jsonMetaData = JSON.parse(hexToString(input))
  } catch (err) {
    validationMessages.push(
      `MPTokenMetadata is not properly formatted as JSON - ${String(err)}`,
    )
    return validationMessages
  }

  if (
    jsonMetaData == null ||
    typeof jsonMetaData !== 'object' ||
    Array.isArray(jsonMetaData)
  ) {
    validationMessages.push(
      'MPTokenMetadata is not properly formatted as per XLS-89d.',
    )
    return validationMessages
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- It must be some JSON object.
  const obj = jsonMetaData as Record<string, unknown>

  // validating structure

  // check for maximum number of fields
  const fieldCount = Object.keys(obj).length
  if (fieldCount > MAX_MPT_META_TOP_LEVEL_FIELD_COUNT) {
    validationMessages.push(
      `MPTokenMetadata must not contain more than ${MAX_MPT_META_TOP_LEVEL_FIELD_COUNT} top-level fields (found ${fieldCount}).`,
    )
    return validationMessages
  }

  const incorrectRequiredFields = MPT_META_REQUIRED_FIELDS.filter(
    (field) => !isString(obj[field]),
  )

  if (incorrectRequiredFields.length > 0) {
    incorrectRequiredFields.forEach((field) =>
      validationMessages.push(`${field} is required and must be string.`),
    )
    return validationMessages
  }

  if (obj.desc != null && !isString(obj.desc)) {
    validationMessages.push(`desc must be a string.`)
    return validationMessages
  }

  if (obj.asset_subclass != null && !isString(obj.asset_subclass)) {
    validationMessages.push(`asset_subclass must be a string.`)
    return validationMessages
  }

  if (
    obj.additional_info != null &&
    !isString(obj.additional_info) &&
    !isRecord(obj.additional_info)
  ) {
    validationMessages.push(`additional_info must be a string or JSON object.`)
    return validationMessages
  }

  if (obj.urls != null) {
    if (!Array.isArray(obj.urls)) {
      validationMessages.push('urls must be an array as per XLS-89d.')
      return validationMessages
    }
    if (!obj.urls.every(isValidMPTokenMetadataUrlStructure)) {
      validationMessages.push(
        'One or more urls are not structured per XLS-89d.',
      )
      return validationMessages
    }
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Required here.
  const mptMPTokenMetadata = obj as unknown as MPTokenMetadata

  // validating content
  if (!TICKER_REGEX.test(mptMPTokenMetadata.ticker)) {
    validationMessages.push(
      `ticker should have uppercase letters (A-Z) and digits (0-9) only. Max 6 characters recommended.`,
    )
  }

  if (!mptMPTokenMetadata.icon.startsWith('https://')) {
    validationMessages.push(`icon should be a valid https url.`)
  }

  if (
    !MPT_META_ASSET_CLASSES.includes(
      mptMPTokenMetadata.asset_class.toLowerCase(),
    )
  ) {
    validationMessages.push(
      `asset_class should be one of ${MPT_META_ASSET_CLASSES.join(', ')}.`,
    )
  }

  if (
    mptMPTokenMetadata.asset_subclass != null &&
    !MPT_META_ASSET_SUB_CLASSES.includes(
      mptMPTokenMetadata.asset_subclass.toLowerCase(),
    )
  ) {
    validationMessages.push(
      `asset_subclass should be one of ${MPT_META_ASSET_SUB_CLASSES.join(
        ', ',
      )}.`,
    )
  }

  if (
    mptMPTokenMetadata.asset_class.toLowerCase() === 'rwa' &&
    mptMPTokenMetadata.asset_subclass == null
  ) {
    validationMessages.push(
      `asset_subclass is required when asset_class is rwa.`,
    )
  }

  if (
    mptMPTokenMetadata.urls != null &&
    !mptMPTokenMetadata.urls.every((ele) => ele.url.startsWith('https://'))
  ) {
    validationMessages.push(`url should be a valid https url.`)
  }

  return validationMessages
}
/* eslint-enable max-lines-per-function */
/* eslint-enable max-statements */

function isValidMPTokenMetadataUrlStructure(input: unknown): boolean {
  if (input == null) {
    return false
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Required here.
  const obj = input as Record<string, unknown>

  return (
    typeof obj === 'object' &&
    isString(obj.url) &&
    isString(obj.type) &&
    isString(obj.title) &&
    Object.keys(obj).length === MPT_META_URL_FIELD_COUNT
  )
}
