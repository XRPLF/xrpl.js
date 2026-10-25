import { ValidationError } from '../../errors'

/**
 * (VaultContinuousAccrual) Largest `DepositFee` or `RedemptionFee` a vault may
 * charge, in units of 1/10 basis point (50000 = 50%). See rippled `kMaxVaultFee`.
 */
export const MAX_VAULT_FEE = 50000

/**
 * Check that RedemptionPeriod is only set together with RedemptionFee, since a
 * period without a fee to gate would never be read.
 *
 * @param tx - A VaultCreate Transaction.
 * @throws When RedemptionPeriod is present without RedemptionFee.
 */
export function validateRedemptionPeriod(tx: Record<string, unknown>): void {
  if (tx.RedemptionPeriod !== undefined && tx.RedemptionFee === undefined) {
    throw new ValidationError(
      'VaultCreate: RedemptionPeriod requires RedemptionFee',
    )
  }
}

/**
 * Check that DepositFee and RedemptionFee, when present, are between 0 and
 * {@link MAX_VAULT_FEE} inclusive. Shared by VaultCreate and VaultSet.
 *
 * @param tx - A VaultCreate or VaultSet Transaction.
 * @throws When a fee is out of range.
 */
export function validateVaultFees(tx: Record<string, unknown>): void {
  for (const field of ['DepositFee', 'RedemptionFee']) {
    const fee = tx[field]
    if (typeof fee === 'number' && (fee < 0 || fee > MAX_VAULT_FEE)) {
      throw new ValidationError(
        `${String(tx.TransactionType)}: ${field} must be between 0 and ${MAX_VAULT_FEE}`,
      )
    }
  }
}
