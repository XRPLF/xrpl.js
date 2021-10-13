import BigNumber from 'bignumber.js'

import { ValidationError } from '..'

/**
 * Converts a percentage to a billionths format.
 *
 * @param percent - Percent to convert to QualityIn/QualityOut.
 */
function percentToQuality(percent: string): string {
  if (!percent.endsWith('%')) {
    throw new ValidationError(`Value ${percent} not specified as a percent.`)
  }

  const split = percent.split('%')

  if (split.length !== 1) {
    throw new ValidationError(`Value ${percent} contains more than one %`)
  }

  const number = new BigNumber(percent.split('%')[0])

  const decimal = number.dividedBy(100)
}
