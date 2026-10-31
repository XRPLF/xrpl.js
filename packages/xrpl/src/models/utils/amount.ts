import { stringToHex } from '@xrplf/isomorphic/utils'
import BigNumber from 'bignumber.js'

import { Amount, MPTAmount } from '../common'
import {
  areAddressesEqual,
  isIssuedCurrencyAmount,
  isMPTAmount,
} from '../transactions/common'

const ISO_CODE_LENGTH = 3
const ISO_CODE_HEX_OFFSET = 30
const CURRENCY_HEX_LENGTH = 40

/**
 * A currency code as its 40-character uppercase hex form.
 *
 * @param code - A 3-character or 40-character hex currency code.
 * @returns The hex form of the code.
 */
function currencyHex(code: string): string {
  if (code.length === ISO_CODE_LENGTH) {
    return stringToHex(code)
      .toUpperCase()
      .padStart(ISO_CODE_HEX_OFFSET, '0')
      .padEnd(CURRENCY_HEX_LENGTH, '0')
  }
  return code.toUpperCase()
}

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
      first.mpt_issuance_id.toUpperCase() ===
        second.mpt_issuance_id.toUpperCase()
    )
  }
  return (
    isIssuedCurrencyAmount(first) &&
    isIssuedCurrencyAmount(second) &&
    currencyHex(first.currency) === currencyHex(second.currency) &&
    areAddressesEqual(first.issuer, second.issuer)
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
