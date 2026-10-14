import BigNumber from 'bignumber.js'
import { assert } from 'chai'

import { dropsToXrp, xrpToDrops } from '../../src/utils'

function assertXrp(drops: BigNumber.Value, expected: string): void {
  const xrp = dropsToXrp(drops)
  assert.instanceOf(xrp, BigNumber)
  assert.strictEqual(xrp.toString(), expected, `${JSON.stringify(drops)} drops`)
}

describe('dropsToXrp', function () {
  it('works with a typical amount', function () {
    assertXrp('2000000', '2')
  })

  it('works with fractions', function () {
    assertXrp('3456789', '3.456789')
    assertXrp('3400000', '3.4')
    assertXrp('1', '0.000001')
    assertXrp('1.0', '0.000001')
    assertXrp('1.00', '0.000001')
  })

  it('works with zero', function () {
    assertXrp('0', '0')
    // negative zero is equivalent to zero
    assertXrp('-0', '0')
    assertXrp('0.00', '0')
    assertXrp('000000000', '0')
  })

  it('works with a negative value', function () {
    assertXrp('-2000000', '-2')
  })

  it('works with a value ending with a decimal point', function () {
    assertXrp('2000000.', '2')
    assertXrp('-2000000.', '-2')
  })

  it('works with BigNumber objects', function () {
    assertXrp(new BigNumber(2000000), '2')
    assertXrp(new BigNumber(-2000000), '-2')
    assertXrp(new BigNumber(2345678), '2.345678')
    assertXrp(new BigNumber(-2345678), '-2.345678')
  })

  it('works with a number', function () {
    // This is not recommended. Use strings or BigNumber objects to avoid precision errors.
    assertXrp(2000000, '2')
    assertXrp(-2000000, '-2')
  })

  it('works with scientific notation', function () {
    assertXrp('1e6', '1')
  })

  it('throws with an amount with too many decimal places', function () {
    assert.throws(() => {
      dropsToXrp(1.2)
    }, /has too many decimal places/u)

    assert.throws(() => {
      dropsToXrp(0.1)
    }, /has too many decimal places/u)
  })

  it('throws with an invalid value', function () {
    assert.throws(() => {
      dropsToXrp('FOO')
    }, /invalid value/u)

    assert.throws(() => {
      dropsToXrp('1e-7')
    }, /decimal place/u)

    assert.throws(() => {
      dropsToXrp('2,0')
    }, /invalid value/u)

    assert.throws(() => {
      dropsToXrp('.')
    }, /dropsToXrp: invalid value '\.', should be a BigNumber or string-encoded number\./u)
  })

  it('throws with an amount more than one decimal point', function () {
    assert.throws(() => {
      dropsToXrp('1.0.0')
    }, /dropsToXrp: invalid value '1\.0\.0'/u)

    assert.throws(() => {
      dropsToXrp('...')
    }, /dropsToXrp: invalid value '\.\.\.'/u)
  })

  it('keeps every drop of large amounts (#3316)', function () {
    const cases: Array<[string, string]> = [
      ['9999999999999999', '9999999999.999999'],
      ['-9999999999999999', '-9999999999.999999'],
      ['99999999999999999', '99999999999.999999'],
    ]
    cases.forEach(([drops, xrp]) => {
      assertXrp(drops, xrp)
      assert.strictEqual(xrpToDrops(dropsToXrp(drops)), drops)
    })
  })
})
