import { assert } from 'chai'

import { ValidationError } from 'xrpl-local'

import { percentToQuality } from '../../src'

describe('Quality utils', function () {
  it('converts 101 percent to valid Quality', function () {
    const billionths = percentToQuality('101%')

    assert.equal(billionths, 1010000000)
  })

  it('converts 99 percent to valid Quality', function () {
    const billionths = percentToQuality('99%')

    assert.equal(billionths, 990000000)
  })

  it('converts 100 percent to 0', function () {
    const billionths = percentToQuality('100%')

    assert.equal(billionths, 0)
  })

  it('Throws when Quality greater than maximum precision', function () {
    assert.throws(
      () => percentToQuality('.0000000000000011221%'),
      ValidationError,
      'Value .0000000000000011221% exceeds maximum precision.',
    )
  })

  it('Throws with gibberish', function () {
    assert.throws(
      () => percentToQuality('3dsadflk%'),
      ValidationError,
      'Value 3dsadflk% is not a number',
    )
  })
})
