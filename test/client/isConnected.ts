/* eslint-disable mocha/no-hooks-for-single-case -- Use of hooks is restricted when there is a single test case. */
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
