import { Signer } from '../common'

import {
  BaseTransaction,
  isObject,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'
import type { TransactionMetadataBase } from './metadata'
import type { Transaction } from './transaction'

export interface BatchTxn {
  OuterAccount: string

  Sequence?: number

  TicketSequence?: number

  BatchIndex: number
}

export type BatchInnerTransaction = Transaction & {
  BatchTxn?: BatchTxn
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

  RawTransactions: BatchInnerTransaction[]

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
export function validateBatch(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'RawTransactions', isObject)
  // Full validation of each `RawTransaction` object is done in `validate` to avoid dependency cycles

  validateOptionalField(tx, 'BatchSigners', (field) => {
    if (!isObject(field)) {
      return false
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- checked above
    const fieldObject = field as Record<string, unknown>
    validateRequiredField(
      fieldObject,
      'Account',
      isString,
      'BatchSigners.Account',
    )
    validateOptionalField(
      fieldObject,
      'SigningPubKey',
      isString,
      'BatchSigners.SigningPubKey',
    )
    validateOptionalField(
      fieldObject,
      'TxnSignature',
      isString,
      'BatchSigners.TxnSignature',
    )

    return true
  })
}
