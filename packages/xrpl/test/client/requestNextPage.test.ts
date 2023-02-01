import { assert } from 'chai'

import { hasNextPage, type Request } from '../../src'
import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'
import { assertRejects } from '../testUtils'

const rippledResponse = function (request: Request): Record<string, unknown> {
  if ('marker' in request) {
    return rippled.ledger_data.last_page
  }
  return rippled.ledger_data.first_page
}

describe('client.requestNextPage', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))
  it('requests the next page', async function () {
    testContext.mockRippled!.addResponse('ledger_data', rippledResponse)
    const response = await testContext.client.request({
      command: 'ledger_data',
    })
    const responseNextPage = await testContext.client.requestNextPage(
      { command: 'ledger_data' },
      response,
    )
    assert.equal(
      responseNextPage.result.state[0].index,
      '000B714B790C3C79FEE00D17C4DEB436B375466F29679447BA64F265FD63D731',
    )
  })

  it('rejects when there are no more pages', async function () {
    testContext.mockRippled!.addResponse('ledger_data', rippledResponse)
    const response = await testContext.client.request({
      command: 'ledger_data',
    })
    const responseNextPage = await testContext.client.requestNextPage(
      { command: 'ledger_data' },
      response,
    )
    assert(!hasNextPage(responseNextPage))
    await assertRejects(
      testContext.client.requestNextPage(
        { command: 'ledger_data' },
        responseNextPage,
      ),
      Error,
      'response does not have a next page',
    )
  })
})
