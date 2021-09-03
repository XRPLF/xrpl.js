import addresses from '../fixtures/addresses.json'
import requests from '../fixtures/requests'
import rippled from '../fixtures/rippled'
import setupClient from '../setupClient'
import { assertRejects } from '../testUtils'
// import responses from '../fixtures/responses'
const { getPaths: REQUEST_FIXTURES } = requests
// const {getPaths: RESPONSE_FIXTURES} = responses

const rippledResponse = rippled.path_find.generate.generateIOUPaymentPaths(
  0,
  REQUEST_FIXTURES.normal.source.address,
  REQUEST_FIXTURES.normal.destination.address,
  REQUEST_FIXTURES.normal.destination.amount,
)

describe('client.getPaths', function () {
  beforeEach(setupClient.setup)
  afterEach(setupClient.teardown)
  // 'simple test', function () {
  //   const response = await this.client.getPaths(REQUEST_FIXTURES.normal)
  //   assertResultMatch(response, RESPONSE_FIXTURES.XrpToUsd, 'getPaths')
  // })
  // 'queuing', function () {
  //   const [normalResult, usdOnlyResult, xrpOnlyResult] = await Promise.all([
  //     this.client.getPaths(REQUEST_FIXTURES.normal),
  //     this.client.getPaths(REQUEST_FIXTURES.UsdToUsd),
  //     this.client.getPaths(REQUEST_FIXTURES.XrpToXrp)
  //   ])
  //   assertResultMatch(normalResult, RESPONSE_FIXTURES.XrpToUsd, 'getPaths')
  //   assertResultMatch(usdOnlyResult, RESPONSE_FIXTURES.UsdToUsd, 'getPaths')
  //   assertResultMatch(xrpOnlyResult, RESPONSE_FIXTURES.XrpToXrp, 'getPaths')
  // })
  // // @TODO
  // // need decide what to do with currencies/XRP:
  // // if add 'XRP' in currencies, then there will be exception in
  // // xrpToDrops function (called from toRippledAmount)
  // 'getPaths USD 2 USD', function () {
  //   const response = await this.client.getPaths(REQUEST_FIXTURES.UsdToUsd)
  //   assertResultMatch(response, RESPONSE_FIXTURES.UsdToUsd, 'getPaths')
  // })
  // 'getPaths XRP 2 XRP', function () {
  //   const response = await this.client.getPaths(REQUEST_FIXTURES.XrpToXrp)
  //   assertResultMatch(response, RESPONSE_FIXTURES.XrpToXrp, 'getPaths')
  // })
  it('source with issuer', async function () {
    this.mockRippled.addResponse('ripple_path_find', rippledResponse)
    return assertRejects(
      this.client.getPaths(REQUEST_FIXTURES.issuer),
      this.client.errors.NotFoundError,
    )
  })
  // 'XRP 2 XRP - not enough', function () {
  //   return assertRejects(
  //     this.client.getPaths(REQUEST_FIXTURES.XrpToXrpNotEnough),
  //     this.client.errors.NotFoundError
  //   )
  // })
  // it("invalid PathFind", function () {
  //   this.mockRippled.addResponse("ripple_path_find", rippledResponse);
  //   assert.throws(() => {
  //     this.client.getPaths(REQUEST_FIXTURES.invalid);
  //   }, /Cannot specify both source.amount/);
  // });
  it('does not accept currency', async function () {
    this.mockRippled.addResponse('ripple_path_find', rippledResponse)
    return assertRejects(
      this.client.getPaths(REQUEST_FIXTURES.NotAcceptCurrency),
      this.client.errors.NotFoundError,
    )
  })
  it('no paths', async function () {
    this.mockRippled.addResponse('ripple_path_find', rippledResponse)
    return assertRejects(
      this.client.getPaths(REQUEST_FIXTURES.NoPaths),
      this.client.errors.NotFoundError,
    )
  })
  it('no paths source amount', async function () {
    this.mockRippled.addResponse('ripple_path_find', rippledResponse)
    return assertRejects(
      this.client.getPaths(REQUEST_FIXTURES.NoPathsSource),
      this.client.errors.NotFoundError,
    )
  })
  it('no paths with source currencies', async function () {
    this.mockRippled.addResponse('ripple_path_find', rippledResponse)
    return assertRejects(
      this.client.getPaths(REQUEST_FIXTURES.NoPathsWithCurrencies),
      this.client.errors.NotFoundError,
    )
  })
  it('error: srcActNotFound', async function () {
    this.mockRippled.addResponse('ripple_path_find', rippledResponse)
    return assertRejects(
      this.client.getPaths({
        ...REQUEST_FIXTURES.normal,
        source: { address: addresses.NOTFOUND },
      }),
      this.client.errors.RippleError,
    )
  })
  // 'send all', function () {
  //   const response = await this.client.getPaths(REQUEST_FIXTURES.sendAll)
  //   assertResultMatch(response, RESPONSE_FIXTURES.sendAll, 'getPaths')
  // })
})
