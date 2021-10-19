import { assert } from 'chai'

import getFeeXrp from '../../src/sugar/fee'
import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'

describe('getFeeXrp', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('getFeeXrp', async function () {
    this.mockRippled.addResponse('server_info', rippled.server_info.normal)
    const fee = await getFeeXrp(this.client)
    assert.strictEqual(fee, '0.000012')
  })

  it('getFeeXrp - high load_factor', async function () {
    this.mockRippled.addResponse(
      'server_info',
      rippled.server_info.highLoadFactor,
    )
    const fee = await getFeeXrp(this.client)
    assert.strictEqual(fee, '2')
  })

  it('getFeeXrp - high load_factor with custom maxFeeXRP', async function () {
    this.mockRippled.addResponse(
      'server_info',
      rippled.server_info.highLoadFactor,
    )

    /*
     * Ensure that overriding with high maxFeeXRP of '51540' causes no errors.
     * (fee will actually be 51539.607552)
     */
    this.client.maxFeeXRP = '51540'
    const fee = await getFeeXrp(this.client)
    assert.strictEqual(fee, '51539.607552')
  })

  it('getFeeXrp custom cushion', async function () {
    this.mockRippled.addResponse('server_info', rippled.server_info.normal)
    this.client.feeCushion = 1.4
    const fee = await getFeeXrp(this.client)
    assert.strictEqual(fee, '0.000014')
  })

  /*
   * This is not recommended since it may result in attempting to pay
   * less than the base fee. However, this test verifies the existing behavior.
   */
  it('getFeeXrp cushion less than 1.0', async function () {
    this.mockRippled.addResponse('server_info', rippled.server_info.normal)
    this.client.feeCushion = 0.9
    const fee = await getFeeXrp(this.client)
    assert.strictEqual(fee, '0.000009')
  })

  it('getFeeXrp reporting', async function () {
    this.mockRippled.addResponse('server_info', rippled.server_info.normal)
    const fee = await getFeeXrp(this.client)
    assert.strictEqual(fee, '0.000012')
  })
})
