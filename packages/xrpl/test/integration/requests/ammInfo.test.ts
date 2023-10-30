import { assert } from 'chai'
import { isValidClassicAddress } from 'xrpl'

import { AMMInfoResponse } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupAMMPool,
  setupClient,
  teardownClient,
  type TestAMMPool,
  type XrplIntegrationTestContext,
} from '../setup'

describe('AMMInfo', function () {
  let testContext: XrplIntegrationTestContext
  let ammPool: TestAMMPool

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    ammPool = await setupAMMPool(testContext.client)
  })
  afterAll(async () => teardownClient(testContext))

  it('base', async function () {
    const { asset, asset2 } = ammPool

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })
    const { amm } = ammInfoRes.result

    assert.ok(asset2.issuer)

    assert.isTrue(isValidClassicAddress(amm.account))
    assert.equal(amm.amount, '1250')
    assert.deepEqual(amm.amount2, {
      currency: asset2.currency,
      // @ts-expect-error: asset2.issuer should be defined at this point
      issuer: asset2.issuer,
      value: '250',
    })
    assert.equal(amm.trading_fee, 12)
  })
})
