import { assert } from 'chai'

import getFeeXrp from '../../src/sugar/getFeeXrp'
import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

describe('getFeeXrp', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  it('getFeeXrp', async function () {
    testContext.mockRippled!.addResponse(
      'server_info',
      rippled.server_info.normal,
    )
    const fee = await getFeeXrp(testContext.client)
    assert.strictEqual(fee, '0.000012')
  })

  it('getFeeXrp - high load_factor', async function () {
    testContext.mockRippled!.addResponse(
      'server_info',
      rippled.server_info.highLoadFactor,
    )
    const fee = await getFeeXrp(testContext.client)
    assert.strictEqual(fee, '2')
  })

  it('getFeeXrp - high load_factor with custom maxFeeXRP', async function () {
    testContext.mockRippled!.addResponse(
      'server_info',
      rippled.server_info.highLoadFactor,
    )

    /*
     * Ensure that overriding with high maxFeeXRP of '51540' causes no errors.
     * (fee will actually be 51539.607552)
     */
    // @ts-expect-error Manually setting this for the purpose of testing
    testContext.client.maxFeeXRP = '51540'
    const fee = await getFeeXrp(testContext.client)
    assert.strictEqual(fee, '51539.607552')
  })

  it('getFeeXrp custom cushion', async function () {
    testContext.mockRippled!.addResponse(
      'server_info',
      rippled.server_info.normal,
    )
    // @ts-expect-error Manually setting this for the purpose of testing
    testContext.client.feeCushion = 1.4
    const fee = await getFeeXrp(testContext.client)
    assert.strictEqual(fee, '0.000014')
  })

  /*
   * This is not recommended since it may result in attempting to pay
   * less than the base fee. However, this test verifies the existing behavior.
   */
  it('getFeeXrp cushion less than 1.0', async function () {
    testContext.mockRippled!.addResponse(
      'server_info',
      rippled.server_info.normal,
    )
    // @ts-expect-error Manually setting this for the purpose of testing
    testContext.client.feeCushion = 0.9
    const fee = await getFeeXrp(testContext.client)
    assert.strictEqual(fee, '0.000009')
  })

  it('getFeeXrp reporting', async function () {
    testContext.mockRippled!.addResponse(
      'server_info',
      rippled.server_info.normal,
    )
    const fee = await getFeeXrp(testContext.client)
    assert.strictEqual(fee, '0.000012')
  })
})
