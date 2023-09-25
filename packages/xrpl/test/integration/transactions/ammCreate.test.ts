import { assert } from 'chai'
import { isValidClassicAddress } from 'xrpl'

import { AMMInfoResponse } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

describe('AMMCreate', function () {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => teardownClient(testContext))

  it('base', async function () {
    const { asset, asset2 } = testContext.amm

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })
    const { amm } = ammInfoRes.result
    if (asset2.issuer == null) {
      throw new Error('issuer is null')
    }

    assert.isTrue(isValidClassicAddress(amm.account))
    assert.equal(amm.amount, '250')
    assert.deepEqual(amm.amount2, {
      currency: asset2.currency,
      issuer: asset2.issuer,
      value: '250',
    })
    assert.equal(amm.trading_fee, 12)
  })
})
