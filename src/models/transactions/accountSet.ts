/* eslint-disable complexity -- Necessary for verifyAccountSet */
import { ValidationError } from '../../common/errors'

import { BaseTransaction, verifyBaseTransaction } from './common'

enum AccountSetFlagEnum {
  asfRequireDest = 1,
  asfRequireAuth = 2,
  asfDisallowXRP = 3,
  asfDisableMaster = 4,
  asfAccountTxnID = 5,
  asfNoFreeze = 6,
  asfGlobalFreeze = 7,
  asfDefaultRipple = 8,
  asfDepositAuth = 9,
}

export interface AccountSet extends BaseTransaction {
  TransactionType: 'AccountSet'
  ClearFlag?: number
  Domain?: string
  EmailHash?: string
  MessageKey?: string
  SetFlag?: AccountSetFlagEnum
  TransferRate?: number
  TickSize?: number
}

const MIN_TICK_SIZE = 3
const MAX_TICK_SIZE = 15

/**
 * Verify the form and type of an AccountSet at runtime.
 *
 * @param tx - An AccountSet Transaction.
 * @throws When the AccountSet is Malformed.
 */
export function verifyAccountSet(tx: Record<string, unknown>): void {
  verifyBaseTransaction(tx)

  if (tx.ClearFlag !== undefined) {
    if (typeof tx.ClearFlag !== 'number') {
      throw new ValidationError('AccountSet: invalid ClearFlag')
    }
    if (!Object.values(AccountSetFlagEnum).includes(tx.ClearFlag)) {
      throw new ValidationError('AccountSet: invalid ClearFlag')
    }
  }

  if (tx.Domain !== undefined && typeof tx.Domain !== 'string') {
    throw new ValidationError('AccountSet: invalid Domain')
  }

  if (tx.EmailHash !== undefined && typeof tx.EmailHash !== 'string') {
    throw new ValidationError('AccountSet: invalid EmailHash')
  }

  if (tx.MessageKey !== undefined && typeof tx.MessageKey !== 'string') {
    throw new ValidationError('AccountSet: invalid MessageKey')
  }

  if (tx.SetFlag !== undefined) {
    if (typeof tx.SetFlag !== 'number') {
      throw new ValidationError('AccountSet: invalid SetFlag')
    }
    if (!Object.values(AccountSetFlagEnum).includes(tx.SetFlag)) {
      throw new ValidationError('AccountSet: invalid SetFlag')
    }
  }

  if (tx.TransferRate !== undefined && typeof tx.TransferRate !== 'number') {
    throw new ValidationError('AccountSet: invalid TransferRate')
  }

  if (tx.TickSize !== undefined) {
    if (typeof tx.TickSize !== 'number') {
      throw new ValidationError('AccountSet: invalid TickSize')
    }
    if (
      tx.TickSize !== 0 &&
      (tx.TickSize < MIN_TICK_SIZE || tx.TickSize > MAX_TICK_SIZE)
    ) {
      throw new ValidationError('AccountSet: invalid TickSize')
    }
  }
}
