import { assert } from 'chai'

import {
  ValidationError,
  decimalToQuality,
  percentToQuality,
  qualityToDecimal,
} from '../../src'

describe('Quality utils', function () {
  it('converts 101 percent to valid Quality', function () {
    const billionths = percentToQuality('101%')

    assert.equal(billionths, 1010000000)
  })

  it('converts 1.01 to valid Quality', function () {
    assert.equal(decimalToQuality('1.01'), 1010000000)
    assert.equal(qualityToDecimal(1010000000), '1.01')
  })

  it('converts 99 percent to valid Quality', function () {
    const billionths = percentToQuality('99%')

    assert.equal(billionths, 990000000)
  })

  it('converts .99 to valid Quality', function () {
    assert.equal(decimalToQuality('.99'), 990000000)
    assert.equal(qualityToDecimal(990000000), '0.99')
  })

  it('converts 100 percent to 0', function () {
    const billionths = percentToQuality('100%')

    assert.equal(billionths, 0)
  })

  it('converts 1.00 percent to 0', function () {
    assert.equal(decimalToQuality('1.00'), 0)
    assert.equal(qualityToDecimal(0), '1')
  })

  it('Throws when percent Quality greater than maximum precision', function () {
    assert.throws(
      () => percentToQuality('.0000000000000011221%'),
      ValidationError,
      'Decimal exceeds maximum precision.',
    )
  })

  it('Throws when decimal Quality greater than maximum precision', function () {
    assert.throws(
      () => decimalToQuality('.000000000000000011221'),
      ValidationError,
      'Decimal exceeds maximum precision.',
    )
  })

  it('percentToQuality throws with gibberish', function () {
    assert.throws(
      () => percentToQuality('3dsadflk%'),
      ValidationError,
      'Value is not a number',
    )
  })

  it('decimalToQuality throws with gibberish', function () {
    assert.throws(
      () => decimalToQuality('3dsadflk%'),
      ValidationError,
      'Value is not a number',
    )
  })
})
