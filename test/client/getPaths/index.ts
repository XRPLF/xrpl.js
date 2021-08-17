import assert from 'assert-diff'
import {assertResultMatch, assertRejects, TestSuite} from '../../utils'
import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import addresses from '../../fixtures/addresses.json'
const {getPaths: REQUEST_FIXTURES} = requests
const {getPaths: RESPONSE_FIXTURES} = responses

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'simple test': async (client) => {
    const response = await client.getPaths(REQUEST_FIXTURES.normal)
    assertResultMatch(response, RESPONSE_FIXTURES.XrpToUsd, 'getPaths')
  },
  'queuing': async (client) => {
    const [normalResult, usdOnlyResult, xrpOnlyResult] = await Promise.all([
      client.getPaths(REQUEST_FIXTURES.normal),
      client.getPaths(REQUEST_FIXTURES.UsdToUsd),
      client.getPaths(REQUEST_FIXTURES.XrpToXrp)
    ])
    assertResultMatch(normalResult, RESPONSE_FIXTURES.XrpToUsd, 'getPaths')
    assertResultMatch(usdOnlyResult, RESPONSE_FIXTURES.UsdToUsd, 'getPaths')
    assertResultMatch(xrpOnlyResult, RESPONSE_FIXTURES.XrpToXrp, 'getPaths')
  },
  // @TODO
  // need decide what to do with currencies/XRP:
  // if add 'XRP' in currencies, then there will be exception in
  // xrpToDrops function (called from toRippledAmount)
  'getPaths USD 2 USD': async (client) => {
    const response = await client.getPaths(REQUEST_FIXTURES.UsdToUsd)
    assertResultMatch(response, RESPONSE_FIXTURES.UsdToUsd, 'getPaths')
  },
  'getPaths XRP 2 XRP': async (client) => {
    const response = await client.getPaths(REQUEST_FIXTURES.XrpToXrp)
    assertResultMatch(response, RESPONSE_FIXTURES.XrpToXrp, 'getPaths')
  },
  'source with issuer': async (client) => {
    return assertRejects(
      client.getPaths(REQUEST_FIXTURES.issuer),
      client.errors.NotFoundError
    )
  },
  'XRP 2 XRP - not enough': async (client) => {
    return assertRejects(
      client.getPaths(REQUEST_FIXTURES.XrpToXrpNotEnough),
      client.errors.NotFoundError
    )
  },
  'invalid PathFind': async (client) => {
    assert.throws(() => {
      client.getPaths(REQUEST_FIXTURES.invalid)
    }, /Cannot specify both source.amount/)
  },
  'does not accept currency': async (client) => {
    return assertRejects(
      client.getPaths(REQUEST_FIXTURES.NotAcceptCurrency),
      client.errors.NotFoundError
    )
  },
  'no paths': async (client) => {
    return assertRejects(
      client.getPaths(REQUEST_FIXTURES.NoPaths),
      client.errors.NotFoundError
    )
  },
  'no paths source amount': async (client) => {
    return assertRejects(
      client.getPaths(REQUEST_FIXTURES.NoPathsSource),
      client.errors.NotFoundError
    )
  },
  'no paths with source currencies': async (client) => {
    return assertRejects(
      client.getPaths(REQUEST_FIXTURES.NoPathsWithCurrencies),
      client.errors.NotFoundError
    )
  },
  'error: srcActNotFound': async (client) => {
    return assertRejects(
      client.getPaths({
        ...REQUEST_FIXTURES.normal,
        source: {address: addresses.NOTFOUND}
      }),
      client.errors.RippleError
    )
  },
  'send all': async (client) => {
    const response = await client.getPaths(REQUEST_FIXTURES.sendAll)
    assertResultMatch(response, RESPONSE_FIXTURES.sendAll, 'getPaths')
  }
}
