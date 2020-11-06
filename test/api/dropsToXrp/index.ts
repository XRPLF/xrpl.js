import assert from 'assert-diff'
import {TestSuite} from '../../utils'
import BigNumber from 'bignumber.js'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'works with a typical amount': async (api) => {
    const xrp = api.dropsToXrp('2000000')
    assert.strictEqual(xrp, '2', '2 million drops equals 2 XRP')
  },
  'works with fractions': async (api) => {
    let xrp = api.dropsToXrp('3456789')
    assert.strictEqual(xrp, '3.456789', '3,456,789 drops equals 3.456789 XRP')

    xrp = api.dropsToXrp('3400000')
    assert.strictEqual(xrp, '3.4', '3,400,000 drops equals 3.4 XRP')

    xrp = api.dropsToXrp('1')
    assert.strictEqual(xrp, '0.000001', '1 drop equals 0.000001 XRP')

    xrp = api.dropsToXrp('1.0')
    assert.strictEqual(xrp, '0.000001', '1.0 drops equals 0.000001 XRP')

    xrp = api.dropsToXrp('1.00')
    assert.strictEqual(xrp, '0.000001', '1.00 drops equals 0.000001 XRP')
  },
  'works with zero': async (api) => {
    let xrp = api.dropsToXrp('0')
    assert.strictEqual(xrp, '0', '0 drops equals 0 XRP')

    // negative zero is equivalent to zero
    xrp = api.dropsToXrp('-0')
    assert.strictEqual(xrp, '0', '-0 drops equals 0 XRP')

    xrp = api.dropsToXrp('0.00')
    assert.strictEqual(xrp, '0', '0.00 drops equals 0 XRP')

    xrp = api.dropsToXrp('000000000')
    assert.strictEqual(xrp, '0', '000000000 drops equals 0 XRP')
  },
  'works with a negative value': async (api) => {
    const xrp = api.dropsToXrp('-2000000')
    assert.strictEqual(xrp, '-2', '-2 million drops equals -2 XRP')
  },
  'works with a value ending with a decimal point': async (api) => {
    let xrp = api.dropsToXrp('2000000.')
    assert.strictEqual(xrp, '2', '2000000. drops equals 2 XRP')

    xrp = api.dropsToXrp('-2000000.')
    assert.strictEqual(xrp, '-2', '-2000000. drops equals -2 XRP')
  },
  'works with BigNumber objects': async (api) => {
    let xrp = api.dropsToXrp(new BigNumber(2000000))
    assert.strictEqual(xrp, '2', '(BigNumber) 2 million drops equals 2 XRP')

    xrp = api.dropsToXrp(new BigNumber(-2000000))
    assert.strictEqual(xrp, '-2', '(BigNumber) -2 million drops equals -2 XRP')

    xrp = api.dropsToXrp(new BigNumber(2345678))
    assert.strictEqual(
      xrp,
      '2.345678',
      '(BigNumber) 2,345,678 drops equals 2.345678 XRP'
    )

    xrp = api.dropsToXrp(new BigNumber(-2345678))
    assert.strictEqual(
      xrp,
      '-2.345678',
      '(BigNumber) -2,345,678 drops equals -2.345678 XRP'
    )
  },
  'works with a number': async (api) => {
    // This is not recommended. Use strings or BigNumber objects to avoid precision errors.
    let xrp = api.dropsToXrp(2000000)
    assert.strictEqual(xrp, '2', '(number) 2 million drops equals 2 XRP')
    xrp = api.dropsToXrp(-2000000)
    assert.strictEqual(xrp, '-2', '(number) -2 million drops equals -2 XRP')
  },
  'throws with an amount with too many decimal places': async (api) => {
    assert.throws(() => {
      api.dropsToXrp('1.2')
    }, /has too many decimal places/)

    assert.throws(() => {
      api.dropsToXrp('0.10')
    }, /has too many decimal places/)
  },
  'throws with an invalid value': async (api) => {
    assert.throws(() => {
      api.dropsToXrp('FOO')
    }, /invalid value/)

    assert.throws(() => {
      api.dropsToXrp('1e-7')
    }, /invalid value/)

    assert.throws(() => {
      api.dropsToXrp('2,0')
    }, /invalid value/)

    assert.throws(() => {
      api.dropsToXrp('.')
    }, /dropsToXrp: invalid value '\.', should be a BigNumber or string-encoded number\./)
  },
  'throws with an amount more than one decimal point': async (api) => {
    assert.throws(() => {
      api.dropsToXrp('1.0.0')
    }, /dropsToXrp: invalid value '1\.0\.0'/)

    assert.throws(() => {
      api.dropsToXrp('...')
    }, /dropsToXrp: invalid value '\.\.\.'/)
  }
}
