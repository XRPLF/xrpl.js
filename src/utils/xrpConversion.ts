import BigNumber from 'bignumber.js'

import { ValidationError } from '../errors'

const DROPS_PER_XRP = 1000000.0
const MAX_FRACTION_LENGTH = 6
const BASE_TEN = 10
const SANITY_CHECK = /^-?[0-9.]+$/u

/**
 * Convert Drops to XRP.
 *
 * @param dropsToConvert - Drops to convert to XRP.
 * @returns Amount in XRP.
 * @throws When drops amount is invalid.
 */
export function dropsToXrp(dropsToConvert: BigNumber.Value): string {
  let drops = dropsToConvert
  if (typeof drops === 'string') {
    if (!/^-?[0-9]*\.?[0-9]*$/u.exec(drops)) {
      throw new ValidationError(
        `dropsToXrp: invalid value '${drops}',` +
          ` should be a number matching (^-?[0-9]*\\.?[0-9]*$).`,
      )
    } else if (drops === '.') {
      throw new ValidationError(
        `dropsToXrp: invalid value '${drops}',` +
          ` should be a BigNumber or string-encoded number.`,
      )
    }
  }

  /*
   * Converting to BigNumber and then back to string should remove any
   * decimal point followed by zeros, e.g. '1.00'.
   * Important: specify base 10 to avoid exponential notation, e.g. '1e-7'.
   */
  drops = new BigNumber(drops).toString(BASE_TEN)

  // drops are only whole units
  if (drops.includes('.')) {
    throw new ValidationError(
      `dropsToXrp: value '${drops}' has too many decimal places.`,
    )
  }

  /*
   * This should never happen; the value has already been
   * validated above. This just ensures BigNumber did not do
   * something unexpected.
   */
  if (!SANITY_CHECK.exec(drops)) {
    throw new ValidationError(
      `dropsToXrp: failed sanity check -` +
        ` value '${drops}',` +
        ` does not match (^-?[0-9]+$).`,
    )
  }

  return new BigNumber(drops).dividedBy(DROPS_PER_XRP).toString(BASE_TEN)
}

/**
 * Convert an amount in XRP to an amount in drops.
 *
 * @param xrpToConvert - Amount in XRP.
 * @returns Amount in drops.
 * @throws When amount in xrp is invalid.
 */
export function xrpToDrops(xrpToConvert: BigNumber.Value): string {
  let xrp = xrpToConvert
  if (typeof xrp === 'string') {
    if (!/^-?[0-9]*\.?[0-9]*$/u.exec(xrp)) {
      throw new ValidationError(
        `xrpToDrops: invalid value '${xrp}', should be a number matching (^-?[0-9]*\\.?[0-9]*$).`,
      )
    } else if (xrp === '.') {
      throw new ValidationError(
        `xrpToDrops: invalid value '${xrp}', should be a BigNumber or string-encoded number.`,
      )
    }
  }

  // Important: specify base 10 to avoid exponential notation, e.g. '1e-7'.
  xrp = new BigNumber(xrp).toString(BASE_TEN)
  /*
   * This should never happen; the value has already been
   * validated above. This just ensures BigNumber did not do
   * something unexpected.
   */
  if (!SANITY_CHECK.exec(xrp)) {
    throw new ValidationError(
      `xrpToDrops: failed sanity check -` +
        ` value '${xrp}',` +
        ` does not match (^-?[0-9.]+$).`,
    )
  }

  const components = xrp.split('.')
  if (components.length > 2) {
    throw new ValidationError(
      `xrpToDrops: failed sanity check -` +
        ` value '${xrp}' has` +
        ` too many decimal points.`,
    )
  }

  const fraction = components[1] || '0'
  if (fraction.length > MAX_FRACTION_LENGTH) {
    throw new ValidationError(
      `xrpToDrops: value '${xrp}' has too many decimal places.`,
    )
  }

  return new BigNumber(xrp)
    .times(DROPS_PER_XRP)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toString(BASE_TEN)
}
