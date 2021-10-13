import BigNumber from 'bignumber.js'

import { ValidationError } from '..'

const BASE_TEN = 10
const ONE_BILLION = '1000000000'
const TWO_BILLION = '2000000000'

function percentToDecimal(percent: string): BigNumber {
  if (!percent.endsWith('%')) {
    throw new ValidationError(`Value ${percent} must end with %`)
  }

  // Split the string on % and filter out any empty strings
  const split = percent.split('%').filter((str) => str !== '')
  if (split.length !== 1) {
    throw new ValidationError(`Value ${percent} contains too many % signs`)
  }

  return new BigNumber(split[0]).dividedBy('100')
}

/**
 * Converts a string percent to "billionths" format for use with TransferRate.
 *
 * @param percent - A string percent between 0% and 100%.
 * @returns A number in the "billionths" format.
 * @throws ValidationError when the percent parameter is not convertible to
 * "billionths" format.
 */
export function percentToTransferRate(percent: string): number {
  const decimal = percentToDecimal(percent)

  const rate = decimal.times(ONE_BILLION).plus(ONE_BILLION)

  if (rate.isLessThan(ONE_BILLION) || rate.isGreaterThan(TWO_BILLION)) {
    throw new ValidationError(`Value ${percent} must be between 0% and 100%.`)
  }

  const billionths = rate.toString(BASE_TEN)

  if (billionths === ONE_BILLION) {
    return 0
  }

  if (billionths === 'NaN') {
    throw new ValidationError(`Value ${percent} is not a number`)
  }

  if (billionths.includes('.')) {
    throw new ValidationError(`Value ${percent} exceeds maximum precision.`)
  }

  return Number(billionths)
}

/**
 * Converts a string percent to the "billionths" format for use with QualityIn/
 * QualityOut
 *
 * @param percent - A string percent (i.e. ".034%").
 * @returns A number in the "billionths" format.
 * @throws ValidationError when the percent parameter is not convertible to
 * "billionths" format.
 */
export function percentToQuality(percent: string): number {
  const decimal = percentToDecimal(percent)

  const rate = decimal.times(ONE_BILLION)

  const billionths = rate.toString(BASE_TEN)

  if (billionths === 'NaN') {
    throw new ValidationError(`Value ${percent} is not a number`)
  }

  if (billionths === ONE_BILLION) {
    return 0
  }

  if (billionths.includes('.')) {
    throw new ValidationError(`Value ${percent} exceeds maximum precision.`)
  }

  return Number(billionths)
}
