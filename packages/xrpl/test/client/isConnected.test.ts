import { assert } from 'chai'

import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

describe('client.isConnected', () => {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  it('disconnect & isConnected', async () => {
    assert.strictEqual(testContext.client.isConnected(), true)
    await testContext.client.disconnect()
    assert.strictEqual(testContext.client.isConnected(), false)
  })
})
