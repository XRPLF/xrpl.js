import { ValidationError } from '../../errors'
import { Signer } from '../common'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isArray,
  isObject,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'
import type { TransactionMetadataBase } from './metadata'
import type { Transaction } from './transaction'

/**
 * Enum representing values of {@link Batch} transaction flags.
 *
 * @category Transaction Flags
 */
export enum BatchFlags {
  tfAllOrNothing = 0x00010000,
  tfOnlyOne = 0x00020000,
  tfUntilFailure = 0x00040000,
  tfIndependent = 0x00080000,
}

/**
 * Map of flags to boolean values representing {@link Batch} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface BatchFlagsInterface extends GlobalFlagsInterface {
  tfAllOrNothing?: boolean
  tfOnlyOne?: boolean
  tfUntilFailure?: boolean
  tfIndependent?: boolean
}

export type BatchInnerTransaction = Transaction & {
  Fee?: '0'

  SigningPubKey?: ''

  TxnSignature?: ''

  Signers?: never

  LastLedgerSequence?: never
}

export interface BatchSigner {
  BatchSigner: {
    Account: string

    SigningPubKey?: string

    TxnSignature?: string

    Signers?: Signer[]
  }
}

/**
 * @category Transaction Models
 */
export interface Batch extends BaseTransaction {
  TransactionType: 'Batch'

  BatchSigners?: BatchSigner[]

  RawTransactions: Array<{
    RawTransaction: BatchInnerTransaction
  }>

  /**
   * Optional because it can be autofilled.
   */
  TxIDs?: string[]
}

export interface BatchMetadata extends TransactionMetadataBase {
  BatchExecutions: Array<{
    TransactionType: string

    InnerResult: string

    TransactionHash: string
  }>
}

/**
 * Verify the form and type of a Batch at runtime.
 *
 * @param tx - A Batch Transaction.
 * @throws When the Batch is malformed.
 */
// eslint-disable-next-line max-lines-per-function -- needed here due to the complexity
export function validateBatch(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'RawTransactions', isArray)
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- checked above
  const rawTransactions = tx.RawTransactions as unknown[]
  rawTransactions.forEach((field, index) => {
    if (!isObject(field)) {
      throw new ValidationError(`Batch: RawTransactions[${index} is not object`)
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- checked above
    const fieldObject = field as Record<string, unknown>
    validateRequiredField(
      fieldObject,
      'RawTransaction',
      isObject,
      `RawTransactions[${index}].RawTransaction`,
    )
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- needed here
    // @ts-expect-error -- checked above
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- checked above
    const rawTx = field.RawTransaction as Record<string, unknown>
    if (!isObject(rawTx)) {
      throw new ValidationError(`Batch: RawTransactions[${index} is not object`)
    }
    if (rawTx.TransactionType === 'Batch') {
      throw new ValidationError(
        `Batch: RawTransactions[${index} is a Batch transaction. Cannot nest Batch transactions.`,
      )
    }
  })
  // Full validation of each `RawTransaction` object is done in `validate` to avoid dependency cycles

  validateOptionalField(tx, 'BatchSigners', isArray)

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- checked above
  const batchSigners = tx.BatchSigners as unknown[] | undefined
  batchSigners?.forEach((field, index) => {
    if (!isObject(field)) {
      throw new ValidationError(`Batch: BatchSigners[${index} is not object`)
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- checked above
    const fieldObject = field as Record<string, unknown>
    validateRequiredField(
      fieldObject,
      'BatchSigner',
      isObject,
      `BatchSigners[${index}].BatchSigner`,
    )
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- checked above
    const batchSignerObject = fieldObject.BatchSigner as Record<string, unknown>
    validateRequiredField(
      batchSignerObject,
      'Account',
      isString,
      `BatchSigners[${index}].Account`,
    )
    validateOptionalField(
      batchSignerObject,
      'SigningPubKey',
      isString,
      `BatchSigners[${index}].SigningPubKey`,
    )
    validateOptionalField(
      batchSignerObject,
      'TxnSignature',
      isString,
      `BatchSigners[${index}].TxnSignature`,
    )
  })

  validateOptionalField(tx, 'TxIDs', isArray)
}
