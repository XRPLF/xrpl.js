import BigNumber from 'bignumber.js'

import { ValidationError } from '../errors'

const BASE_TEN = 10
const ONE_BILLION = '1000000000'
const TWO_BILLION = '2000000000'

function percentToDecimal(percent: string): string {
  if (!percent.endsWith('%')) {
    throw new ValidationError(`Value ${percent} must end with %`)
  }

  // Split the string on % and filter out any empty strings
  const split = percent.split('%').filter((str) => str !== '')
  if (split.length !== 1) {
    throw new ValidationError(`Value ${percent} contains too many % signs`)
  }

  return new BigNumber(split[0]).dividedBy('100').toString(BASE_TEN)
}

/**
 * Converts a string decimal to "billionths" format for use with TransferRate.
 *
 * @param decimal - A string decimal between 0 and 1.00
 * @returns A number in the "billionths" format.
 * @throws ValidationError when the parameter is not convertible to
 * "billionths" format.
 * @category Utilities
 */
export function decimalToTransferRate(decimal: string): number {
  const rate = new BigNumber(decimal).times(ONE_BILLION).plus(ONE_BILLION)

  if (rate.isLessThan(ONE_BILLION) || rate.isGreaterThan(TWO_BILLION)) {
    throw new ValidationError(`Decimal value must be between 0 and 1.00.`)
  }

  const billionths = rate.toString(BASE_TEN)

  if (billionths === ONE_BILLION) {
    return 0
  }

  if (billionths === 'NaN') {
    throw new ValidationError(`Value is not a number`)
  }

  if (billionths.includes('.')) {
    throw new ValidationError(`Decimal exceeds maximum precision.`)
  }

  return Number(billionths)
}

/**
 * Converts a string percent to "billionths" format for use with TransferRate.
 *
 * @param percent - A string percent between 0% and 100%.
 * @returns A number in the "billionths" format.
 * @throws ValidationError when the percent parameter is not convertible to
 * "billionths" format.
 * @category Utilities
 */
export function percentToTransferRate(percent: string): number {
  return decimalToTransferRate(percentToDecimal(percent))
}

/**
 * Converts a string decimal to the "billionths" format for use with QualityIn/
 * QualityOut
 *
 * @param decimal - A string decimal (i.e. ".00034").
 * @returns A number in the "billionths" format.
 * @throws ValidationError when the parameter is not convertible to
 * "billionths" format.
 * @category Utilities
 */
export function decimalToQuality(decimal: string): number {
  const rate = new BigNumber(decimal).times(ONE_BILLION)

  const billionths = rate.toString(BASE_TEN)

  if (billionths === 'NaN') {
    throw new ValidationError(`Value is not a number`)
  }

  if (billionths.includes('-')) {
    throw new ValidationError('Cannot have negative Quality')
  }

  if (billionths === ONE_BILLION) {
    return 0
  }

  if (billionths.includes('.')) {
    throw new ValidationError(`Decimal exceeds maximum precision.`)
  }

  return Number(billionths)
}

/**
 * Converts a quality in "billionths" format to a decimal.
 *
 * @param quality - Quality to convert to decimal.
 * @returns decimal representation of quality.
 * @throws ValidationError when quality is not convertible to decimal format.
 * @category Utilities
 */
export function qualityToDecimal(quality: number): string {
  if (!Number.isInteger(quality)) {
    throw new ValidationError('Quality must be an integer')
  }

  if (quality < 0) {
    throw new ValidationError('Negative quality not allowed')
  }

  if (quality === 0) {
    return '1'
  }

  const decimal = new BigNumber(quality).dividedBy(ONE_BILLION)

  return decimal.toString(BASE_TEN)
}

/**
 * Converts a transfer rate in "billionths" format to a decimal.
 *
 * @param rate - TransferRate to convert to decimal.
 * @returns decimal representation of transfer Rate.
 * @throws ValidationError when it cannot convert from billionths format.
 * @category Utilities
 */
export function transferRateToDecimal(rate: number): string {
  if (!Number.isInteger(rate)) {
    throw new ValidationError(
      'Error decoding, transfer Rate must be an integer',
    )
  }

  if (rate === 0) {
    return '0'
  }

  const decimal = new BigNumber(rate).minus(ONE_BILLION).dividedBy(ONE_BILLION)

  if (decimal.isLessThan(0)) {
    throw new ValidationError('Error decoding, negative transfer rate')
  }

  return decimal.toString(BASE_TEN)
}

/**
 * Converts a string percent to the "billionths" format for use with QualityIn/
 * QualityOut
 *
 * @param percent - A string percent (i.e. ".034%").
 * @returns A number in the "billionths" format.
 * @throws ValidationError when the percent parameter is not convertible to
 * "billionths" format.
 * @category Utilities
 */
export function percentToQuality(percent: string): number {
  return decimalToQuality(percentToDecimal(percent))
}
