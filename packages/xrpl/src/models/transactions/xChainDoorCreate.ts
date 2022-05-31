import { ValidationError } from '../../errors'
import { Sidechain, SignerEntry } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * A XChainDoorCreate transaction assigns, changes, or removes the regular key
 * pair associated with an account.
 *
 * @category Transaction Models
 */
export interface XChainDoorCreate extends BaseTransaction {
  TransactionType: 'XChainDoorCreate'

  Sidechain: Sidechain

  SignerEntries: SignerEntry[]

  SignerQuorum: number
}

const MAX_SIGNERS = 8

/**
 * Verify the form and type of a XChainDoorCreate at runtime.
 *
 * @param tx - A XChainDoorCreate Transaction.
 * @throws When the XChainDoorCreate is malformed.
 */
export function validateXChainDoorCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Sidechain !== undefined && typeof tx.Sidechain !== 'object') {
    throw new ValidationError('XChainDoorCreate: Sidechain must be an object')
  }

  if (tx.SignerQuorum === undefined) {
    throw new ValidationError('SignerListSet: missing field SignerQuorum')
  }

  if (typeof tx.SignerQuorum !== 'number') {
    throw new ValidationError('SignerListSet: invalid SignerQuorum')
  }

  if (tx.SignerEntries === undefined) {
    throw new ValidationError('SignerListSet: missing field SignerEntries')
  }

  if (!Array.isArray(tx.SignerEntries)) {
    throw new ValidationError('SignerListSet: invalid SignerEntries')
  }

  if (tx.SignerEntries.length === 0) {
    throw new ValidationError(
      'SignerListSet: need atleast 1 member in SignerEntries',
    )
  }

  if (tx.SignerEntries.length > MAX_SIGNERS) {
    throw new ValidationError(
      'SignerListSet: maximum of 8 members allowed in SignerEntries',
    )
  }
}
