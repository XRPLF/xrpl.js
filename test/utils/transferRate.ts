import { assert } from 'chai'

import { ValidationError } from 'xrpl-local'

import { percentToTransferRate } from '../../src'

describe('TransferRate utils', function () {
  it('converts 1 percent to valid TransferRate', function () {
    const billionths = percentToTransferRate('1%')

    assert.equal(billionths, 1010000000)
  })

  it('Throws when TransferRate < 0%', function () {
    assert.throws(
      () => percentToTransferRate('-1%'),
      ValidationError,
      'Value -1% must be between 0% and 100%.',
    )
  })

  it('Throws when TransferRate >100%', function () {
    assert.throws(
      () => percentToTransferRate('101%'),
      ValidationError,
      'Value 101% must be between 0% and 100%.',
    )
  })

  it('Throws when TransferRate greater than maximum precision', function () {
    assert.throws(
      () => percentToTransferRate('.0000000000000011221%'),
      ValidationError,
      'Value .0000000000000011221% exceeds maximum precision.',
    )
  })

  it('converts 0 percent to valid 0', function () {
    const billionths = percentToTransferRate('0%')

    assert.equal(billionths, 0)
  })
})
