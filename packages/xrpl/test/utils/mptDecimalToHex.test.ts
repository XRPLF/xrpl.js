import { assert } from 'chai'

import { mptDecimalToHex } from '../../src/utils'

describe('mptDecimalToHex', function () {
  it('works with a typical amount', function () {
    let hexStr = mptDecimalToHex('1000')
    assert.strictEqual(hexStr, '3e8', '1000 equals to 3e8 in hex')

    hexStr = mptDecimalToHex('9223372036854775807')
    assert.strictEqual(
      hexStr,
      '7fffffffffffffff',
      '9223372036854775807 equals to 7fffffffffffffff in hex',
    )
  })

  it('works with zero', function () {
    let hexStr = mptDecimalToHex('0')
    assert.strictEqual(hexStr, '0', '0 equals to 0 in hex')

    hexStr = mptDecimalToHex('000000000')
    assert.strictEqual(hexStr, '0', '000000000 equals 0 in hex')

    hexStr = mptDecimalToHex('-0')
    assert.strictEqual(hexStr, '0', '-0 equals 0 in hex')
  })

  it('throws with a negative value', function () {
    assert.throws(() => {
      mptDecimalToHex('-1')
    }, "mptDecimalToHex: value '-1' cannot be negative.")
  })

  it('checks decimal value', function () {
    assert.throws(() => {
      mptDecimalToHex('20000.1')
    }, "mptDecimalToHex: value '20000.1' has too many decimal places.")

    const hexStr = mptDecimalToHex('20000.')
    assert.strictEqual(hexStr, '4e20', '20000. equals 4e20 in hex')
  })

  it('works with scientific notation', function () {
    const hexStr = mptDecimalToHex('1e6')
    assert.strictEqual(hexStr, 'f4240', '1e6 equals f4240 in hex')
  })

  it('throws with an value with 64-bit range', function () {
    assert.throws(() => {
      mptDecimalToHex('9223372036854775808')
    }, "mptDecimalToHex: invalid value '9223372036854775808', should be within 63-bit range.")
  })

  it('throws with an value with invalid format', function () {
    assert.throws(() => {
      mptDecimalToHex('1a')
    }, "mptDecimalToHex: invalid value '1a', should be a string-encoded number.")
  })

  it('works with a hex value', function () {
    const hexStr = mptDecimalToHex('0x1a')
    assert.strictEqual(hexStr, '1a', '0x1a equals 1a in hex')
  })
})
