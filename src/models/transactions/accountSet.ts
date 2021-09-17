/* eslint-disable complexity -- Necessary for validateAccountSet */
import { ValidationError } from '../../common/errors'

import { BaseTransaction, validateBaseTransaction } from './common'

export enum AccountSetFlags {
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

export enum AccountSetTransactionFlags {
  tfRequireDestTag = 0x00010000,
  tfOptionalDestTag = 0x00020000,
  tfRequireAuth = 0x00040000,
  tfOptionalAuth = 0x00080000,
  tfDisallowXRP = 0x00100000,
  tfAllowXRP = 0x00200000,
}

export interface AccountSetFlagsInterface {
  tfRequireDestTag?: boolean
  tfOptionalDestTag?: boolean
  tfRequireAuth?: boolean
  tfOptionalAuth?: boolean
  tfDisallowXRP?: boolean
  tfAllowXRP?: boolean
}

export interface AccountSet extends BaseTransaction {
  TransactionType: 'AccountSet'
  Flags?: number | AccountSetFlagsInterface
  ClearFlag?: number
  Domain?: string
  EmailHash?: string
  MessageKey?: string
  SetFlag?: AccountSetFlags
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
export function validateAccountSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.ClearFlag !== undefined) {
    if (typeof tx.ClearFlag !== 'number') {
      throw new ValidationError('AccountSet: invalid ClearFlag')
    }
    if (!Object.values(AccountSetFlags).includes(tx.ClearFlag)) {
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
    if (!Object.values(AccountSetFlags).includes(tx.SetFlag)) {
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
