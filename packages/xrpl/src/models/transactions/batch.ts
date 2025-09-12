import { ValidationError } from '../../errors'
import { Signer } from '../common'
import { hasFlag } from '../utils'

import {
  BaseTransaction,
  GlobalFlags,
  GlobalFlagsInterface,
  isArray,
  isNull,
  isRecord,
  isString,
  isValue,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'
import type { SubmittableTransaction } from './transaction'

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
    RawTransaction: SubmittableTransaction
  }>
}

function validateBatchInnerTransaction(
  tx: Record<string, unknown>,
  index: number,
): void {
  if (tx.TransactionType === 'Batch') {
    throw new ValidationError(
      `Batch: RawTransactions[${index}] is a Batch transaction. Cannot nest Batch transactions.`,
    )
  }

  // Check for the `tfInnerBatchTxn` flag in the inner transactions
  if (!hasFlag(tx, GlobalFlags.tfInnerBatchTxn, 'tfInnerBatchTxn')) {
    throw new ValidationError(
      `Batch: RawTransactions[${index}] must contain the \`tfInnerBatchTxn\` flag.`,
    )
  }
  validateOptionalField(tx, 'Fee', isValue('0'), {
    paramName: `RawTransactions[${index}].RawTransaction.Fee`,
    txType: 'Batch',
  })
  validateOptionalField(tx, 'SigningPubKey', isValue(''), {
    paramName: `RawTransactions[${index}].RawTransaction.SigningPubKey`,
    txType: 'Batch',
  })
  validateOptionalField(tx, 'TxnSignature', isNull, {
    paramName: `RawTransactions[${index}].RawTransaction.TxnSignature`,
    txType: 'Batch',
  })
  validateOptionalField(tx, 'Signers', isNull, {
    paramName: `RawTransactions[${index}].RawTransaction.Signers`,
    txType: 'Batch',
  })
  validateOptionalField(tx, 'LastLedgerSequence', isNull, {
    paramName: `RawTransactions[${index}].RawTransaction.LastLedgerSequence`,
    txType: 'Batch',
  })
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

  tx.RawTransactions.forEach((rawTxObj, index) => {
    if (!isRecord(rawTxObj)) {
      throw new ValidationError(
        `Batch: RawTransactions[${index}] is not object.`,
      )
    }
    validateRequiredField(rawTxObj, 'RawTransaction', isRecord, {
      paramName: `RawTransactions[${index}].RawTransaction`,
      txType: 'Batch',
    })

    const rawTx = rawTxObj.RawTransaction
    validateBatchInnerTransaction(rawTx, index)

    // Full validation of each `RawTransaction` object is done in `validate` to avoid dependency cycles
  })

  validateOptionalField(tx, 'BatchSigners', isArray)

  tx.BatchSigners?.forEach((signerObj, index) => {
    if (!isRecord(signerObj)) {
      throw new ValidationError(`Batch: BatchSigners[${index}] is not object.`)
    }

    const signerRecord = signerObj
    validateRequiredField(signerRecord, 'BatchSigner', isRecord, {
      paramName: `BatchSigners[${index}].BatchSigner`,
      txType: 'Batch',
    })

    const signer = signerRecord.BatchSigner
    validateRequiredField(signer, 'Account', isString, {
      paramName: `BatchSigners[${index}].BatchSigner.Account`,
      txType: 'Batch',
    })
    validateOptionalField(signer, 'SigningPubKey', isString, {
      paramName: `BatchSigners[${index}].BatchSigner.SigningPubKey`,
      txType: 'Batch',
    })
    validateOptionalField(signer, 'TxnSignature', isString, {
      paramName: `BatchSigners[${index}].BatchSigner.TxnSignature`,
      txType: 'Batch',
    })
    validateOptionalField(signer, 'Signers', isArray, {
      paramName: `BatchSigners[${index}].BatchSigner.Signers`,
      txType: 'Batch',
    })
  })
}
