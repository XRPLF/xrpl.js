import BigNumber from 'bignumber.js'

import { Amount, MPTAmount } from '../common'
import { isIssuedCurrencyAmount, isMPTAmount } from '../transactions/common'

/**
 * Check whether two amounts are denominated in the same asset: both XRP, both
 * the same issued currency from the same issuer, or both the same MPT issuance.
 *
 * @param first - The first amount.
 * @param second - The second amount.
 * @returns Whether both amounts share an asset.
 */
export function isSameAsset(
  first: Amount | MPTAmount,
  second: Amount | MPTAmount,
): boolean {
  if (typeof first === 'string' || typeof second === 'string') {
    return typeof first === 'string' && typeof second === 'string'
  }
  if (isMPTAmount(first) || isMPTAmount(second)) {
    return (
      isMPTAmount(first) &&
      isMPTAmount(second) &&
      first.mpt_issuance_id === second.mpt_issuance_id
    )
  }
  return (
    isIssuedCurrencyAmount(first) &&
    isIssuedCurrencyAmount(second) &&
    first.currency === second.currency &&
    first.issuer === second.issuer
  )
}

/**
 * The numeric value of an amount: drops for XRP, `value` for a token.
 *
 * @param amount - The amount.
 * @returns The value as a BigNumber (NaN when the value is not numeric).
 */
export function amountValue(amount: Amount | MPTAmount): BigNumber {
  return new BigNumber(typeof amount === 'string' ? amount : amount.value)
}
