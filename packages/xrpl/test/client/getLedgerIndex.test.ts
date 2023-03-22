import { assert } from 'chai'

import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

describe('client.getLedgerIndex', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  it('getLedgerIndex', async function () {
    testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)
    const ledgerIndex = await testContext.client.getLedgerIndex()
    assert.strictEqual(ledgerIndex, 9038214)
  })
})
