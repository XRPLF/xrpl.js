import { assert } from 'chai'

import rippled from '../fixtures/rippled'
import setupClient from '../setupClient'

describe('client.getFee', function () {
  beforeEach(setupClient.setup)
  afterEach(setupClient.teardown)

  it('getFee', async function () {
    this.mockRippled.addResponse('server_info', rippled.server_info.normal)
    const fee = await this.client.getFee()
    assert.strictEqual(fee, '0.000012')
  })

  it('getFee - high load_factor', async function () {
    this.mockRippled.addResponse(
      'server_info',
      rippled.server_info.highLoadFactor,
    )
    const fee = await this.client.getFee()
    assert.strictEqual(fee, '2')
  })

  it('getFee - high load_factor with custom maxFeeXRP', async function () {
    this.mockRippled.addResponse(
      'server_info',
      rippled.server_info.highLoadFactor,
    )
    // Ensure that overriding with high maxFeeXRP of '51540' causes no errors.
    // (fee will actually be 51539.607552)
    this.client.maxFeeXRP = '51540'
    const fee = await this.client.getFee()
    assert.strictEqual(fee, '51539.607552')
  })

  it('getFee custom cushion', async function () {
    this.mockRippled.addResponse('server_info', rippled.server_info.normal)
    this.client.feeCushion = 1.4
    const fee = await this.client.getFee()
    assert.strictEqual(fee, '0.000014')
  })

  // This is not recommended since it may result in attempting to pay
  // less than the base fee. However, this test verifies the existing behavior.
  it('getFee cushion less than 1.0', async function () {
    this.mockRippled.addResponse('server_info', rippled.server_info.normal)
    this.client.feeCushion = 0.9
    const fee = await this.client.getFee()
    assert.strictEqual(fee, '0.000009')
  })

  it('getFee reporting', async function () {
    this.mockRippled.addResponse('server_info', rippled.server_info.normal)
    const fee = await this.client.getFee()
    assert.strictEqual(fee, '0.000012')
  })
})
