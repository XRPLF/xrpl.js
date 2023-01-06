import { assert } from 'chai'
import _ from 'lodash'
import { LedgerDataRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('ledger_data', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const ledgerDataRequest: LedgerDataRequest = {
      command: 'ledger_data',
      ledger_index: 'validated',
      limit: 5,
      binary: true,
    }

    const ledgerDataResponse = await this.client.request(ledgerDataRequest)

    const expected = {
      id: 0,
      result: {
        ledger_hash: 'string',
        ledger_index: 0,
        marker: 'string',
        state: [
          {
            data: 'string',
            index: 'string',
          },
        ],
      },
      type: 'response',
    }

    assert.equal(ledgerDataResponse.type, expected.type)

    assert.typeOf(ledgerDataResponse.result.ledger_hash, 'string')
    assert.typeOf(ledgerDataResponse.result.ledger_index, 'number')
    assert.typeOf(ledgerDataResponse.result.marker, 'string')

    assert.equal(ledgerDataResponse.result.state.length, 5)
    ledgerDataResponse.result.state.forEach((item) => {
      assert.typeOf(item.data, 'string')
      assert.typeOf(item.index, 'string')
    })
  })
})
