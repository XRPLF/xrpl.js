import { assert } from 'chai'

import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'

describe('client.getLedgerIndex', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('getLedgerIndex', async function () {
    this.mockRippled.addResponse('ledger', rippled.ledger.normal)
    const fee = await this.client.getLedgerIndex()
    assert.strictEqual(fee, 9038214)
  })
})
