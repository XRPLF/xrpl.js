import assert from 'assert-diff'
import {TestSuite} from '../../utils'
import BigNumber from 'bignumber.js'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'works with a typical amount': async (client) => {
    const xrp = client.dropsToXrp('2000000')
    assert.strictEqual(xrp, '2', '2 million drops equals 2 XRP')
  },
  'works with fractions': async (client) => {
    let xrp = client.dropsToXrp('3456789')
    assert.strictEqual(xrp, '3.456789', '3,456,789 drops equals 3.456789 XRP')

    xrp = client.dropsToXrp('3400000')
    assert.strictEqual(xrp, '3.4', '3,400,000 drops equals 3.4 XRP')

    xrp = client.dropsToXrp('1')
    assert.strictEqual(xrp, '0.000001', '1 drop equals 0.000001 XRP')

    xrp = client.dropsToXrp('1.0')
    assert.strictEqual(xrp, '0.000001', '1.0 drops equals 0.000001 XRP')

    xrp = client.dropsToXrp('1.00')
    assert.strictEqual(xrp, '0.000001', '1.00 drops equals 0.000001 XRP')
  },
  'works with zero': async (client) => {
    let xrp = client.dropsToXrp('0')
    assert.strictEqual(xrp, '0', '0 drops equals 0 XRP')

    // negative zero is equivalent to zero
    xrp = client.dropsToXrp('-0')
    assert.strictEqual(xrp, '0', '-0 drops equals 0 XRP')

    xrp = client.dropsToXrp('0.00')
    assert.strictEqual(xrp, '0', '0.00 drops equals 0 XRP')

    xrp = client.dropsToXrp('000000000')
    assert.strictEqual(xrp, '0', '000000000 drops equals 0 XRP')
  },
  'works with a negative value': async (client) => {
    const xrp = client.dropsToXrp('-2000000')
    assert.strictEqual(xrp, '-2', '-2 million drops equals -2 XRP')
  },
  'works with a value ending with a decimal point': async (client) => {
    let xrp = client.dropsToXrp('2000000.')
    assert.strictEqual(xrp, '2', '2000000. drops equals 2 XRP')

    xrp = client.dropsToXrp('-2000000.')
    assert.strictEqual(xrp, '-2', '-2000000. drops equals -2 XRP')
  },
  'works with BigNumber objects': async (client) => {
    let xrp = client.dropsToXrp(new BigNumber(2000000))
    assert.strictEqual(xrp, '2', '(BigNumber) 2 million drops equals 2 XRP')

    xrp = client.dropsToXrp(new BigNumber(-2000000))
    assert.strictEqual(xrp, '-2', '(BigNumber) -2 million drops equals -2 XRP')

    xrp = client.dropsToXrp(new BigNumber(2345678))
    assert.strictEqual(
      xrp,
      '2.345678',
      '(BigNumber) 2,345,678 drops equals 2.345678 XRP'
    )

    xrp = client.dropsToXrp(new BigNumber(-2345678))
    assert.strictEqual(
      xrp,
      '-2.345678',
      '(BigNumber) -2,345,678 drops equals -2.345678 XRP'
    )
  },
  'works with a number': async (client) => {
    // This is not recommended. Use strings or BigNumber objects to avoid precision errors.
    let xrp = client.dropsToXrp(2000000)
    assert.strictEqual(xrp, '2', '(number) 2 million drops equals 2 XRP')
    xrp = client.dropsToXrp(-2000000)
    assert.strictEqual(xrp, '-2', '(number) -2 million drops equals -2 XRP')
  },
  'throws with an amount with too many decimal places': async (client) => {
    assert.throws(() => {
      client.dropsToXrp('1.2')
    }, /has too many decimal places/)

    assert.throws(() => {
      client.dropsToXrp('0.10')
    }, /has too many decimal places/)
  },
  'throws with an invalid value': async (client) => {
    assert.throws(() => {
      client.dropsToXrp('FOO')
    }, /invalid value/)

    assert.throws(() => {
      client.dropsToXrp('1e-7')
    }, /invalid value/)

    assert.throws(() => {
      client.dropsToXrp('2,0')
    }, /invalid value/)

    assert.throws(() => {
      client.dropsToXrp('.')
    }, /dropsToXrp: invalid value '\.', should be a BigNumber or string-encoded number\./)
  },
  'throws with an amount more than one decimal point': async (client) => {
    assert.throws(() => {
      client.dropsToXrp('1.0.0')
    }, /dropsToXrp: invalid value '1\.0\.0'/)

    assert.throws(() => {
      client.dropsToXrp('...')
    }, /dropsToXrp: invalid value '\.\.\.'/)
  }
}
