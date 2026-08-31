import { ValidationError } from '../../errors'
import { isHex } from '../utils'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateRequiredField,
  validateOptionalField,
  isString,
  VAULT_DATA_MAX_BYTE_LENGTH,
} from './common'

/**
 * The VaultDelete transaction deletes an existing vault object.
 *
 * @category Transaction Models
 */
export interface VaultDelete extends BaseTransaction {
  TransactionType: 'VaultDelete'

  /**
   * The ID of the vault to be deleted.
   */
  VaultID: string

  /**
   * (LendingProtocolV1_1) Arbitrary metadata attached to the deletion, in hex
   * format, limited to 256 bytes.
   */
  MemoData?: string
}

/**
 * Verify the form and type of a {@link VaultDelete} at runtime.
 *
 * @param tx - A {@link VaultDelete} Transaction.
 * @throws When the {@link VaultDelete} is malformed.
 */
export function validateVaultDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'VaultID', isString)
  validateOptionalField(tx, 'MemoData', isString)

  if (tx.MemoData !== undefined) {
    const memoData = tx.MemoData
    if (!isHex(memoData)) {
      throw new ValidationError(
        'VaultDelete: MemoData must be a valid hex string',
      )
    }
    if (memoData.length / 2 > VAULT_DATA_MAX_BYTE_LENGTH) {
      throw new ValidationError(
        `VaultDelete: MemoData must be less than ${VAULT_DATA_MAX_BYTE_LENGTH} bytes`,
      )
    }
  }
}
