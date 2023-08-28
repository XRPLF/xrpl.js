/* eslint-disable max-lines-per-function -- Necessary for validateBaseTransaction */
/* eslint-disable complexity -- Necessary for validateBaseTransaction */
/* eslint-disable max-statements -- Necessary for validateBaseTransaction */
import { TRANSACTION_TYPES } from 'ripple-binary-codec'

import { ValidationError } from '../../errors'
import { Amount, Currency, IssuedCurrencyAmount, Memo, Signer } from '../common'
import { onlyHasFields } from '../utils'

const MEMO_SIZE = 3

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
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
 * Verify the form and type of an Amount at runtime.
 *
 * @param amount - The object to check the form and type of.
 * @returns Whether the Amount is properly formed.
 */
export function isAmount(amount: unknown): amount is Amount {
  return typeof amount === 'string' || isIssuedCurrency(amount)
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface -- no global flags right now, so this is fine
export interface GlobalFlags {}

/**
 * Every transaction has the same set of common fields.
 */
export interface BaseTransaction {
  /** The unique address of the transaction sender. */
  Account: string
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
  if (common.Account === undefined) {
    throw new ValidationError('BaseTransaction: missing field Account')
  }

  if (typeof common.Account !== 'string') {
    throw new ValidationError('BaseTransaction: Account not string')
  }

  if (common.TransactionType === undefined) {
    throw new ValidationError('BaseTransaction: missing field TransactionType')
  }

  if (typeof common.TransactionType !== 'string') {
    throw new ValidationError('BaseTransaction: TransactionType not string')
  }

  if (!TRANSACTION_TYPES.includes(common.TransactionType)) {
    throw new ValidationError('BaseTransaction: Unknown TransactionType')
  }

  if (common.Fee !== undefined && typeof common.Fee !== 'string') {
    throw new ValidationError('BaseTransaction: invalid Fee')
  }

  if (common.Sequence !== undefined && typeof common.Sequence !== 'number') {
    throw new ValidationError('BaseTransaction: invalid Sequence')
  }

  if (
    common.AccountTxnID !== undefined &&
    typeof common.AccountTxnID !== 'string'
  ) {
    throw new ValidationError('BaseTransaction: invalid AccountTxnID')
  }

  if (
    common.LastLedgerSequence !== undefined &&
    typeof common.LastLedgerSequence !== 'number'
  ) {
    throw new ValidationError('BaseTransaction: invalid LastLedgerSequence')
  }

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

  if (common.SourceTag !== undefined && typeof common.SourceTag !== 'number') {
    throw new ValidationError('BaseTransaction: invalid SourceTag')
  }

  if (
    common.SigningPubKey !== undefined &&
    typeof common.SigningPubKey !== 'string'
  ) {
    throw new ValidationError('BaseTransaction: invalid SigningPubKey')
  }

  if (
    common.TicketSequence !== undefined &&
    typeof common.TicketSequence !== 'number'
  ) {
    throw new ValidationError('BaseTransaction: invalid TicketSequence')
  }

  if (
    common.TxnSignature !== undefined &&
    typeof common.TxnSignature !== 'string'
  ) {
    throw new ValidationError('BaseTransaction: invalid TxnSignature')
  }
  if (common.NetworkID !== undefined && typeof common.NetworkID !== 'number') {
    throw new ValidationError('BaseTransaction: invalid NetworkID')
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
