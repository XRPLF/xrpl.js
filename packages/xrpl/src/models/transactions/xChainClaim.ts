import { ValidationError } from '../../errors'
import { Sidechain, XChainProofSig } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * A XChainClaim transaction assigns, changes, or removes the regular key
 * pair associated with an account.
 *
 * @category Transaction Models
 */
export interface XChainClaim extends BaseTransaction {
  TransactionType: 'XChainClaim'

  XChainClaimProof: {
    amount: string

    sidechain: Sidechain

    signatures: XChainProofSig[]

    was_src_chain_send: boolean

    xchain_seq: number
  }
}

/**
 * Verify the form and type of a XChainClaim at runtime.
 *
 * @param tx - A XChainClaim Transaction.
 * @throws When the XChainClaim is malformed.
 */
export function validateXChainClaim(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Sidechain !== undefined && typeof tx.Sidechain !== 'object') {
    throw new ValidationError('XChainClaim: Sidechain must be an object')
  }

  if (tx.XChainSequence === undefined) {
    throw new ValidationError('EscrowCancel: missing XChainSequence')
  }

  if (typeof tx.XChainSequence !== 'number') {
    throw new ValidationError('EscrowCancel: XChainSequence must be a number')
  }
}
