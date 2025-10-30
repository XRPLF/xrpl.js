/* eslint-disable max-lines -- common utility file */
/* eslint-disable no-continue -- makes logic easier to write and read in this case */
import { HEX_REGEX, hexToString, stringToHex } from '@xrplf/isomorphic/utils'
import stableStringify from 'fast-json-stable-stringify'
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

const MPT_META_URI_FIELDS = [
  {
    long: 'uri',
    compact: 'u',
  },
  {
    long: 'category',
    compact: 'c',
  },
  {
    long: 'title',
    compact: 't',
  },
]

const MPT_META_ALL_FIELDS = [
  {
    long: 'ticker',
    compact: 't',
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      const value = obj[this.long] ?? obj[this.compact]
      if (!isString(value) || !/^[A-Z0-9]{1,6}$/u.test(value)) {
        return [
          `${this.long}/${this.compact}: should have uppercase letters (A-Z) and digits (0-9) only. Max 6 characters recommended.`,
        ]
      }

      return []
    },
  },
  {
    long: 'name',
    compact: 'n',
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      const value = obj[this.long] ?? obj[this.compact]
      if (!isString(value) || value.length === 0) {
        return [`${this.long}/${this.compact}: should be a non-empty string.`]
      }

      return []
    },
  },
  {
    long: 'icon',
    compact: 'i',
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      const value = obj[this.long] ?? obj[this.compact]
      if (!isString(value) || value.length === 0) {
        return [`${this.long}/${this.compact}: should be a non-empty string.`]
      }

      return []
    },
  },
  {
    long: 'asset_class',
    compact: 'ac',
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      const value = obj[this.long] ?? obj[this.compact]
      const MPT_META_ASSET_CLASSES = [
        'rwa',
        'memes',
        'wrapped',
        'gaming',
        'defi',
        'other',
      ]

      if (!isString(value) || !MPT_META_ASSET_CLASSES.includes(value)) {
        return [
          `${this.long}/${this.compact}: should be one of ${MPT_META_ASSET_CLASSES.join(
            ', ',
          )}.`,
        ]
      }
      return []
    },
  },
  {
    long: 'issuer_name',
    compact: 'in',
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      const value = obj[this.long] ?? obj[this.compact]
      if (!isString(value) || value.length === 0) {
        return [`${this.long}/${this.compact}: should be a non-empty string.`]
      }

      return []
    },
  },
  {
    long: 'desc',
    compact: 'd',
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      if (obj[this.long] === undefined && obj[this.compact] === undefined) {
        return []
      }
      const value = obj[this.long] ?? obj[this.compact]
      if (!isString(value) || value.length === 0) {
        return [`${this.long}/${this.compact}: should be a non-empty string.`]
      }

      return []
    },
  },
  {
    long: 'asset_subclass',
    compact: 'as',
    required: false,
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      const value = obj[this.long] ?? obj[this.compact]
      if (
        (obj.asset_class === 'rwa' || obj.ac === 'rwa') &&
        value === undefined
      ) {
        return [
          `${this.long}/${this.compact}: required when asset_class is rwa.`,
        ]
      }

      if (obj[this.long] === undefined && obj[this.compact] === undefined) {
        return []
      }

      const MPT_META_ASSET_SUB_CLASSES = [
        'stablecoin',
        'commodity',
        'real_estate',
        'private_credit',
        'equity',
        'treasury',
        'other',
      ]
      if (!isString(value) || !MPT_META_ASSET_SUB_CLASSES.includes(value)) {
        return [
          `${this.long}/${this.compact}: should be one of ${MPT_META_ASSET_SUB_CLASSES.join(
            ', ',
          )}.`,
        ]
      }
      return []
    },
  },
  {
    long: 'uris',
    compact: 'us',
    required: false,
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      if (obj[this.long] === undefined && obj[this.compact] === undefined) {
        return []
      }
      const value = obj[this.long] ?? obj[this.compact]
      if (!Array.isArray(value) || value.length === 0) {
        return [`${this.long}/${this.compact}: should be a non-empty array.`]
      }

      const messages: string[] = []
      for (const uriObj of value) {
        if (
          !isRecord(uriObj) ||
          Object.keys(uriObj).length !== MPT_META_URI_FIELDS.length
        ) {
          messages.push(
            `${this.long}/${this.compact}: should be an array of objects each with uri/u, category/c, and title/t properties.`,
          )
          continue
        }

        const uri = uriObj.uri ?? uriObj.u
        const category = uriObj.category ?? uriObj.c
        const title = uriObj.title ?? uriObj.t
        if (!isString(uri) || !isString(category) || !isString(title)) {
          messages.push(
            `${this.long}/${this.compact}: should be an array of objects each with uri/u, category/c, and title/t properties.`,
          )
        }
      }
      return messages
    },
  },
  {
    long: 'additional_info',
    compact: 'ai',
    required: false,
    validate(obj: Record<string, unknown>): string[] {
      if (obj[this.long] != null && obj[this.compact] != null) {
        return [
          `${this.long}/${this.compact}: both long and compact forms present. expected only one.`,
        ]
      }

      if (obj[this.long] === undefined && obj[this.compact] === undefined) {
        return []
      }
      const value = obj[this.long] ?? obj[this.compact]
      if (!isString(value) && !isRecord(value)) {
        return [
          `${this.long}/${this.compact}: should be a string or JSON object.`,
        ]
      }

      return []
    },
  },
]

export const MPT_META_WARNING_HEADER =
  'MPTokenMetadata is not properly formatted as JSON as per the XLS-89 standard. ' +
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

// Currency object sizes
const XRP_CURRENCY_SIZE = 1
const MPT_CURRENCY_SIZE = 1
const ISSUE_CURRENCY_SIZE = 2

// Currency Amount object sizes
const MPT_CURRENCY_AMOUNT_SIZE = 2
const ISSUED_CURRENCY_AMOUNT_SIZE = 3

const XCHAIN_BRIDGE_SIZE = 4
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
 * Verify the form and type of a null value at runtime.
 *
 * @param inp - The value to check the form and type of.
 * @returns Whether the value is properly formed.
 */
export function isNull(inp: unknown): inp is null {
  return inp == null
}

/**
 * Verify that a certain field has a certain exact value at runtime.
 *
 * @param value The value to compare against.
 * @returns Whether the number is properly formed and within the bounds.
 */
export function isValue<V>(value: V): (inp: unknown) => inp is V {
  // eslint-disable-next-line func-style -- returning a function
  const isValueInternal = (inp: unknown): inp is V => inp === value
  return isValueInternal
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
  return (
    isRecord(input) &&
    ((Object.keys(input).length === ISSUE_CURRENCY_SIZE &&
      isString(input.issuer) &&
      isString(input.currency)) ||
      (Object.keys(input).length === XRP_CURRENCY_SIZE &&
        input.currency === 'XRP') ||
      (Object.keys(input).length === MPT_CURRENCY_SIZE &&
        isString(input.mpt_issuance_id)))
  )
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
    ((Object.keys(input).length === ISSUE_CURRENCY_SIZE &&
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
    Object.keys(input).length === ISSUED_CURRENCY_AMOUNT_SIZE &&
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
    Object.keys(input).length === MPT_CURRENCY_AMOUNT_SIZE &&
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

/**
 * Shortens long field names to their compact form equivalents.
 * Reverse operation of {@link expandKeys}.
 *
 * @param input - Object with potentially long field names.
 * @param mappings - Array of field mappings with long and compact names.
 * @returns Object with shortened compact field names.
 */
function shortenKeys(
  input: Record<string, unknown>,
  mappings: Array<{ long: string; compact: string }>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    const mapping = mappings.find(
      ({ long, compact }) => long === key || compact === key,
    )
    // Extra keys stays there
    if (mapping === undefined) {
      output[key] = value
      continue
    }

    // Both long and compact forms are present
    if (
      input[mapping.long] !== undefined &&
      input[mapping.compact] !== undefined
    ) {
      output[key] = value
      continue
    }

    output[mapping.compact] = value
  }

  return output
}

/**
 * Encodes {@link MPTokenMetadata} object to a hex string.
 * Steps:
 * 1. Shorten long field names to their compact form equivalents.
 * 2. Sort the fields alphabetically for deterministic encoding.
 * 3. Stringify the object.
 * 4. Convert to hex.
 *
 * @param mptokenMetadata - {@link MPTokenMetadata} to encode.
 * @returns Hex encoded {@link MPTokenMetadata}.
 * @throws Error if input is not a JSON object.
 * @category Utilities
 */
export function encodeMPTokenMetadata(
  mptokenMetadata: MPTokenMetadata,
): string {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Required here to implement type-guard
  let input = mptokenMetadata as unknown as Record<string, unknown>

  if (!isRecord(input)) {
    throw new Error('MPTokenMetadata must be JSON object.')
  }

  input = shortenKeys(input, MPT_META_ALL_FIELDS)

  if (Array.isArray(input.uris)) {
    input.uris = input.uris.map(
      (uri: Record<string, unknown>): Record<string, unknown> => {
        if (isRecord(uri)) {
          return shortenKeys(uri, MPT_META_URI_FIELDS)
        }
        return uri
      },
    )
  }

  if (Array.isArray(input.us)) {
    input.us = input.us.map(
      (uri: Record<string, unknown>): Record<string, unknown> => {
        if (isRecord(uri)) {
          return shortenKeys(uri, MPT_META_URI_FIELDS)
        }
        return uri
      },
    )
  }

  return stringToHex(stableStringify(input)).toUpperCase()
}

/**
 * Expands compact field names to their long form equivalents.
 * Reverse operation of {@link shortenKeys}.
 *
 * @param input - Object with potentially compact field names.
 * @param mappings - Array of field mappings with long and compact names.
 * @returns Object with expanded long field names.
 */
function expandKeys(
  input: Record<string, unknown>,
  mappings: Array<{ long: string; compact: string }>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    const mapping = mappings.find(
      ({ long, compact }) => long === key || compact === key,
    )
    // Extra keys stays there
    if (mapping === undefined) {
      output[key] = value
      continue
    }

    // Both long and compact forms are present
    if (
      input[mapping.long] !== undefined &&
      input[mapping.compact] !== undefined
    ) {
      output[key] = value
      continue
    }

    output[mapping.long] = value
  }

  return output
}

/**
 * Decodes hex-encoded {@link MPTokenMetadata} into a JSON object.
 * Converts compact field names to their corresponding long-form equivalents.
 *
 * @param input - Hex encoded {@link MPTokenMetadata}.
 * @returns Decoded {@link MPTokenMetadata} object with long field names.
 * @throws Error if input is not valid hex or cannot be parsed as JSON.
 * @category Utilities
 */
export function decodeMPTokenMetadata(input: string): MPTokenMetadata {
  if (!isHex(input)) {
    throw new Error('MPTokenMetadata must be in hex format.')
  }

  let jsonMetaData: unknown
  try {
    jsonMetaData = JSON.parse(hexToString(input))
  } catch (err) {
    throw new Error(
      `MPTokenMetadata is not properly formatted as JSON - ${String(err)}`,
    )
  }

  if (!isRecord(jsonMetaData)) {
    throw new Error('MPTokenMetadata must be a JSON object.')
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We know its a record
  let output = jsonMetaData as unknown as Record<string, unknown>

  output = expandKeys(output, MPT_META_ALL_FIELDS)

  if (Array.isArray(output.uris)) {
    output.uris = output.uris.map(
      (uri: Record<string, unknown>): Record<string, unknown> => {
        if (isRecord(uri)) {
          return expandKeys(uri, MPT_META_URI_FIELDS)
        }
        return uri
      },
    )
  }

  if (Array.isArray(output.us)) {
    output.us = output.us.map(
      (uri: Record<string, unknown>): Record<string, unknown> => {
        if (isRecord(uri)) {
          return expandKeys(uri, MPT_META_URI_FIELDS)
        }
        return uri
      },
    )
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Required here as output is now properly formatted
  return output as unknown as MPTokenMetadata
}

/**
 * Validates {@link MPTokenMetadata} adheres to XLS-89 standard.
 *
 * @param input - Hex encoded {@link MPTokenMetadata}.
 * @returns Validation messages if {@link MPTokenMetadata} does not adheres to XLS-89 standard.
 * @category Utilities
 */
export function validateMPTokenMetadata(input: string): string[] {
  const validationMessages: string[] = []

  // Validate hex format
  if (!isHex(input)) {
    validationMessages.push(`MPTokenMetadata must be in hex format.`)
    return validationMessages
  }

  // Validate byte length
  if (input.length / 2 > MAX_MPT_META_BYTE_LENGTH) {
    validationMessages.push(
      `MPTokenMetadata must be max ${MAX_MPT_META_BYTE_LENGTH} bytes.`,
    )
    return validationMessages
  }

  // Parse JSON
  let jsonMetaData: unknown
  try {
    jsonMetaData = JSON.parse(hexToString(input))
  } catch (err) {
    validationMessages.push(
      `MPTokenMetadata is not properly formatted as JSON - ${String(err)}`,
    )
    return validationMessages
  }

  // Validate JSON structure
  if (!isRecord(jsonMetaData)) {
    validationMessages.push(
      'MPTokenMetadata is not properly formatted JSON object as per XLS-89.',
    )
    return validationMessages
  }

  if (Object.keys(jsonMetaData).length > MPT_META_ALL_FIELDS.length) {
    validationMessages.push(
      `MPTokenMetadata must not contain more than ${MPT_META_ALL_FIELDS.length} top-level fields (found ${
        Object.keys(jsonMetaData).length
      }).`,
    )
  }

  const obj = jsonMetaData

  for (const property of MPT_META_ALL_FIELDS) {
    validationMessages.push(...property.validate(obj))
  }

  return validationMessages
}
