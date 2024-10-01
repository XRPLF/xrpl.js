import { Signer } from '../common'

import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'
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

/**
 * Verify the form and type of a Batch at runtime.
 *
 * @param tx - A Batch Transaction.
 * @throws When the Batch is malformed.
 */
export function validateBatch(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateOptionalField(tx, 'BatchSigners', (field) => {
    if (!(typeof field === 'object')) {
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
