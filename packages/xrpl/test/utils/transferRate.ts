import { assert } from 'chai'

import { ValidationError } from 'xrpl-local'

import {
  percentToTransferRate,
  decimalToTransferRate,
  transferRateToDecimal,
} from '../../src'

describe('TransferRate utils', function () {
  it('converts 1 percent to valid TransferRate', function () {
    const billionths = percentToTransferRate('1%')

    assert.equal(billionths, 1010000000)
  })

  it('converts .01 percent to valid TransferRate', function () {
    assert.equal(decimalToTransferRate('.01'), 1010000000)
    assert.equal(transferRateToDecimal(1010000000), '0.01')
  })

  it('Throws when TransferRate < 0%', function () {
    assert.throws(
      () => percentToTransferRate('-1%'),
      ValidationError,
      'Decimal value must be between 0 and 1.00.',
    )
  })

  it('Throws when TransferRate < 0', function () {
    assert.throws(
      () => decimalToTransferRate('-.01'),
      ValidationError,
      'Decimal value must be between 0 and 1.00.',
    )
  })

  it('Throws when TransferRate >100%', function () {
    assert.throws(
      () => percentToTransferRate('101%'),
      ValidationError,
      'Decimal value must be between 0 and 1.00.',
    )
  })

  it('Throws when TransferRate >1.00', function () {
    assert.throws(
      () => decimalToTransferRate('1.01'),
      ValidationError,
      'Decimal value must be between 0 and 1.00.',
    )
  })

  it('percentToTransferRate greater than maximum precision', function () {
    assert.throws(
      () => percentToTransferRate('.0000000000000011221%'),
      ValidationError,
      'Decimal exceeds maximum precision.',
    )
  })

  it('decimalToTransferRate greater than maximum precision', function () {
    assert.throws(
      () => decimalToTransferRate('.000000000000000011221'),
      ValidationError,
      'Decimal exceeds maximum precision.',
    )
  })

  it('converts 0 percent to valid 0', function () {
    const billionths = percentToTransferRate('0%')

    assert.equal(billionths, 0)
  })

  it('converts 0 to valid 0', function () {
    assert.equal(decimalToTransferRate('0'), 0)
    assert.equal(transferRateToDecimal(0), '0')
  })
})
