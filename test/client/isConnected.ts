import { assert } from 'chai'

import { setupClient, teardownClient } from '../setupClient'

describe('client.isConnected', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('disconnect & isConnected', async function () {
    assert.strictEqual(this.client.isConnected(), true)
    await this.client.disconnect()
    assert.strictEqual(this.client.isConnected(), false)
  })
})
