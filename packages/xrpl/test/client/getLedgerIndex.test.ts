import { assert } from 'chai'

import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

describe('client.getLedgerIndex', () => {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  it('getLedgerIndex', async () => {
    testContext.mockRippled?.addResponse('ledger', rippled.ledger.normal)
    const ledgerIndex = await testContext.client.getLedgerIndex()
    assert.strictEqual(ledgerIndex, 9038214)
  })
})
