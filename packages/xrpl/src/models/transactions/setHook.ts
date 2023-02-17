import { ValidationError } from '../../errors'
import { Hook } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 *
 * @category Transaction Models
 */
export interface SetHook extends BaseTransaction {
  TransactionType: 'SetHook'
  /**
   *
   */
  Hooks: Hook[]
}

const MAX_HOOKS = 4

/**
 * Verify the form and type of an SetHook at runtime.
 *
 * @param tx - An SetHook Transaction.
 * @throws When the SetHook is Malformed.
 */
export function validateSetHook(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Hooks === undefined) {
    throw new ValidationError('SetHook: missing field Hooks')
  }

  if (!Array.isArray(tx.Hooks)) {
    throw new ValidationError('SetHook: invalid Hooks')
  }

  if (tx.Hooks.length === 0) {
    throw new ValidationError('SetHook: need at least 1 hook in Hooks')
  }

  if (tx.Hooks.length > MAX_HOOKS) {
    throw new ValidationError(
      `SetHook: maximum of ${MAX_HOOKS} hooks allowed in Hooks`,
    )
  }
}
