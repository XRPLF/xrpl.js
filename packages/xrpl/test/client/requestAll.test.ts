import { assert } from 'chai'

import type { Request } from '../../src'
import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

const rippledResponse = function (request: Request): Record<string, unknown> {
  if ('marker' in request) {
    return rippled.ledger_data.lastPage
  }
  return rippled.ledger_data.firstPage
}

const rippledResponseFirstEmpty = function (
  request: Request,
): Record<string, unknown> {
  if ('marker' in request) {
    return rippled.ledger_data.lastPage
  }
  return rippled.ledger_data.firstPageEmpty
}

describe('client.requestAll', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))
  it('requests the next page', async function () {
    testContext.mockRippled!.addResponse('ledger_data', rippledResponse)
    const allResponses = await testContext.client.requestAll({
      command: 'ledger_data',
    })
    assert.equal(allResponses.length, 2)
    assert.equal(
      allResponses[1].result.state[0].index,
      '000B714B790C3C79FEE00D17C4DEB436B375466F29679447BA64F265FD63D731',
    )
  })

  it('stops when there are no more pages', async function () {
    testContext.mockRippled!.addResponse(
      'ledger_data',
      rippled.ledger_data.lastPage,
    )
    const allResponses = await testContext.client.requestAll({
      command: 'ledger_data',
    })
    assert.equal(allResponses.length, 1)
  })

  it('handles when the first page has no results', async function () {
    testContext.mockRippled!.addResponse(
      'ledger_data',
      rippledResponseFirstEmpty,
    )
    const allResponses = await testContext.client.requestAll({
      command: 'ledger_data',
    })
    assert.equal(allResponses.length, 2)
  })
})
