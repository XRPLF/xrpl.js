import { ValidationError } from '../../common/errors'
import { BaseTransaction, verifyBaseTransaction } from './common'

export interface DepositPreauth extends BaseTransaction {
    TransactionType: 'DepositPreauth'
    Authorize?: string
    Unauthorize?: string
}

/**
 * 
 * @param {DepositPreauth} tx A DepositPreauth Transaction.
 * @returns {void}
 * @throws {ValidationError} When the DepositPreauth is malformed.
 */
export function verifyDepositPreauth(tx: DepositPreauth): void {
    verifyBaseTransaction(tx)

    if (tx.Authorize !== undefined && tx.Unauthorize !== undefined) {
        throw new ValidationError("DepositPreauth: can't provide both Authorize and Unauthorize fields")
    }

    if (tx.Authorize === undefined && tx.Unauthorize === undefined) {
        throw new ValidationError('DepositPreauth: must provide either Authorize or Unauthorize field')
    }

    if (tx.Authorize !== undefined && tx.Account === tx.Authorize) {
        throw new ValidationError("DepositPreauth: Account can't preauthorize its own address")
    }

    if (tx.Unauthorize !== undefined && tx.Account === tx.Unauthorize) {
        throw new ValidationError("DepositPreauth: Account can't unauthorize its own address")
    }
}
