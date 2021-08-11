import assert from 'assert-diff'
import BigNumber from 'bignumber.js'
import {TestSuite} from '../../utils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'works with a typical amount': function (client) {
    const drops = client.xrpToDrops('2')
    assert.strictEqual(drops, '2000000', '2 XRP equals 2 million drops')
  },
  'works with fractions': function (client) {
    let drops = client.xrpToDrops('3.456789')
    assert.strictEqual(drops, '3456789', '3.456789 XRP equals 3,456,789 drops')
    drops = client.xrpToDrops('3.400000')
    assert.strictEqual(drops, '3400000', '3.400000 XRP equals 3,400,000 drops')
    drops = client.xrpToDrops('0.000001')
    assert.strictEqual(drops, '1', '0.000001 XRP equals 1 drop')
    drops = client.xrpToDrops('0.0000010')
    assert.strictEqual(drops, '1', '0.0000010 XRP equals 1 drop')
  },
  'works with zero': function (client) {
    let drops = client.xrpToDrops('0')
    assert.strictEqual(drops, '0', '0 XRP equals 0 drops')
    drops = client.xrpToDrops('-0') // negative zero is equivalent to zero
    assert.strictEqual(drops, '0', '-0 XRP equals 0 drops')
    drops = client.xrpToDrops('0.000000')
    assert.strictEqual(drops, '0', '0.000000 XRP equals 0 drops')
    drops = client.xrpToDrops('0.0000000')
    assert.strictEqual(drops, '0', '0.0000000 XRP equals 0 drops')
  },
  'works with a negative value': function (client) {
    const drops = client.xrpToDrops('-2')
    assert.strictEqual(drops, '-2000000', '-2 XRP equals -2 million drops')
  },
  'works with a value ending with a decimal point': function (client) {
    let drops = client.xrpToDrops('2.')
    assert.strictEqual(drops, '2000000', '2. XRP equals 2000000 drops')
    drops = client.xrpToDrops('-2.')
    assert.strictEqual(drops, '-2000000', '-2. XRP equals -2000000 drops')
  },
  'works with BigNumber objects': function (client) {
    let drops = client.xrpToDrops(new BigNumber(2))
    assert.strictEqual(
      drops,
      '2000000',
      '(BigNumber) 2 XRP equals 2 million drops'
    )
    drops = client.xrpToDrops(new BigNumber(-2))
    assert.strictEqual(
      drops,
      '-2000000',
      '(BigNumber) -2 XRP equals -2 million drops'
    )
  },
  'works with a number': function (client) {
    // This is not recommended. Use strings or BigNumber objects to avoid precision errors.
    let drops = client.xrpToDrops(2)
    assert.strictEqual(
      drops,
      '2000000',
      '(number) 2 XRP equals 2 million drops'
    )
    drops = client.xrpToDrops(-2)
    assert.strictEqual(
      drops,
      '-2000000',
      '(number) -2 XRP equals -2 million drops'
    )
  },
  'throws with an amount with too many decimal places': function (client) {
    assert.throws(() => {
      client.xrpToDrops('1.1234567')
    }, /has too many decimal places/)
    assert.throws(() => {
      client.xrpToDrops('0.0000001')
    }, /has too many decimal places/)
  },
  'throws with an invalid value': function (client) {
    assert.throws(() => {
      client.xrpToDrops('FOO')
    }, /invalid value/)
    assert.throws(() => {
      client.xrpToDrops('1e-7')
    }, /invalid value/)
    assert.throws(() => {
      client.xrpToDrops('2,0')
    }, /invalid value/)
    assert.throws(() => {
      client.xrpToDrops('.')
    }, /xrpToDrops: invalid value '\.', should be a BigNumber or string-encoded number\./)
  },
  'throws with an amount more than one decimal point': function (client) {
    assert.throws(() => {
      client.xrpToDrops('1.0.0')
    }, /xrpToDrops: invalid value '1\.0\.0'/)
    assert.throws(() => {
      client.xrpToDrops('...')
    }, /xrpToDrops: invalid value '\.\.\.'/)
  }
}
