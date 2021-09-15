/* eslint-disable max-lines-per-function -- Necessary for validateBaseTransaction */
/* eslint-disable complexity -- Necessary for validateBaseTransaction */
/* eslint-disable max-statements -- Necessary for validateBaseTransaction */
import { ValidationError } from '../../common/errors'
import { Memo, Signer } from '../common'
import { onlyHasFields } from '../utils'

const transactionTypes = [
  'AccountSet',
  'AccountDelete',
  'CheckCancel',
  'CheckCash',
  'CheckCreate',
  'DepositPreauth',
  'EscrowCancel',
  'EscrowCreate',
  'EscrowFinish',
  'OfferCancel',
  'OfferCreate',
  'Payment',
  'PaymentChannelClaim',
  'PaymentChannelCreate',
  'PaymentChannelFund',
  'SetRegularKey',
  'SignerListSet',
  'TicketCreate',
  'TrustSet',
]

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

const ISSUED_CURRENCY_SIZE = 3

/**
 * Verify the form and type of an IssuedCurrencyAmount at runtime.
 *
 * @param obj - The object to check the form and type of.
 * @returns Whether the IssuedCurrencyAmount is malformed.
 */
export function isIssuedCurrency(obj: Record<string, unknown>): boolean {
  return (
    Object.keys(obj).length === ISSUED_CURRENCY_SIZE &&
    typeof obj.value === 'string' &&
    typeof obj.issuer === 'string' &&
    typeof obj.currency === 'string'
  )
}

/**
 * Verify the form and type of an Amount at runtime.
 *
 * @param amount - The object to check the form and type of.
 * @returns Whether the Amount is malformed.
 */
export function isAmount(amount: unknown): boolean {
  return (
    typeof amount === 'string' ||
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Only used by JS
    isIssuedCurrency(amount as Record<string, unknown>)
  )
}

export interface GlobalFlags {}

export interface BaseTransaction {
  Account: string
  TransactionType: string
  Fee?: string
  Sequence?: number
  AccountTxnID?: string
  Flags?: number | GlobalFlags
  LastLedgerSequence?: number
  // TODO: Make Memo match the format of Signer (By including the Memo: wrapper inside the Interface)
  Memos?: Array<{ Memo: Memo }>
  Signers?: Signer[]
  SourceTag?: number
  SigningPubKey?: string
  TicketSequence?: number
  TxnSignature?: string
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

  if (!transactionTypes.includes(common.TransactionType)) {
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
}
