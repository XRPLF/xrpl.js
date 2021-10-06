import { assert } from 'chai'
import _ from 'lodash'

import { AccountObjectsRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('account_objects', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: AccountObjectsRequest = {
      command: 'account_objects',
      account: this.wallet.getClassicAddress(),
      ledger_index: 'validated',
    }
    const response = await this.client.request(request)
    const expected = {
      id: 0,
      result: {
        account: this.wallet.getClassicAddress(),
        account_objects: [],
        ledger_hash:
          '28D68B351ED58B9819502EF5FC05BA4412A048597E5159E1C226703BDF7C7897',
        ledger_index: 1294,
        validated: true,
      },
      type: 'response',
    }
    assert.equal(response.type, expected.type)
    assert.equal(typeof response.result.ledger_hash, 'string')
    assert.equal(typeof response.result.ledger_index, 'number')
    assert.deepEqual(
      _.omit(response.result, ['ledger_hash', 'ledger_index']),
      _.omit(expected.result, ['ledger_hash', 'ledger_index']),
    )
  })
})
