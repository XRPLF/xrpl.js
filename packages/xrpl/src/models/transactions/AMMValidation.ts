import { ValidationError } from '../../errors'
// eslint-disable-next-line import/no-cycle -- flag conversion maps transaction types to their flags
import { convertTxFlagsToNumber } from '../utils/flags'

import type { Transaction } from './transaction'

interface Mode {
  flag: number
  required: string[]
  allowed: string[]
  paired?: [string, string]
}

/**
 * Validate the mode flag and the fields allowed by that mode.
 *
 * @param tx - The transaction to validate.
 * @param modes - The permitted mode rules.
 * @param fields - All mode-specific fields.
 * @throws When the mode or its fields are invalid.
 */
export function validateAMMMode(
  tx: Record<string, unknown>,
  modes: Mode[],
  fields: string[],
): void {
  const transactionType = String(tx.TransactionType)
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- validated transaction record
  const flags = convertTxFlagsToNumber(tx as Transaction)
  // eslint-disable-next-line no-bitwise -- transaction flags are a bit mask
  const selected = modes.filter((mode) => (flags & mode.flag) !== 0)
  if (selected.length !== 1) {
    throw new ValidationError(
      `${transactionType}: exactly one AMM mode is required`,
    )
  }
  const mode = selected[0]
  if (
    mode.paired != null &&
    (tx[mode.paired[0]] == null) !== (tx[mode.paired[1]] == null)
  ) {
    throw new ValidationError(
      `${transactionType}: ${mode.paired[0]} and ${mode.paired[1]} must be supplied together`,
    )
  }
  for (const field of mode.required) {
    if (tx[field] == null) {
      throw new ValidationError(
        `${transactionType}: ${field} is required for this mode`,
      )
    }
  }
  for (const field of fields) {
    if (tx[field] != null && !mode.allowed.includes(field)) {
      throw new ValidationError(
        `${transactionType}: ${field} is not allowed for this mode`,
      )
    }
  }
}
