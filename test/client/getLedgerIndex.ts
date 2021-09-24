import { assert } from 'chai'

import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'

describe('client.getLedgerIndex', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('getLedgerIndex', async function () {
    this.mockRippled.addResponse('ledger', rippled.ledger.normal)
    const ledgerIndex = await this.client.getLedgerIndex()
    assert.strictEqual(ledgerIndex, 9038214)
  })
})
