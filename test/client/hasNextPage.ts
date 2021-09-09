import { assert } from 'chai'

import { Client } from '../../src'
import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'

describe('client.hasNextPage', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('returns true when there is another page', async function () {
    this.mockRippled.addResponse('ledger_data', rippled.ledger_data.first_page)
    const response = await this.client.request({ command: 'ledger_data' })
    assert(Client.hasNextPage(response))
  })

  it('returns false when there are no more pages', async function () {
    const rippledResponse = function (request: Request): object {
      if ('marker' in request) {
        return rippled.ledger_data.last_page
      }
      return rippled.ledger_data.first_page
    }
    this.mockRippled.addResponse('ledger_data', rippledResponse)
    const response = await this.client.request({ command: 'ledger_data' })
    const responseNextPage = await this.client.requestNextPage(
      { command: 'ledger_data' },
      response,
    )
    assert(!Client.hasNextPage(responseNextPage))
  })
})
