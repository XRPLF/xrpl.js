import { assert } from 'chai'
import _ from 'lodash'

import { NoRippleCheckRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('NoRippleCheck', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: NoRippleCheckRequest = {
      command: 'noripple_check',
      account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      role: 'gateway',
      ledger_index: 'current',
      transactions: true,
    }
    const response = await this.client.request(request)
    const expected = {
      id: 5,
      result: {
        ledger_current_index: 2535,
        problems: ['You should immediately set your default ripple flag'],
        transactions: [
          {
            Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
            Fee: 10,
            Sequence: 1268,
            SetFlag: 8,
            TransactionType: 'AccountSet',
          },
        ],
        validated: false,
      },
      status: 'success',
      type: 'response',
    }
    assert.equal(response.status, expected.status)
    assert.equal(response.type, expected.type)
    const responseTx = response.result.transactions[0]
    const expectedTx = expected.result.transactions[0]
    assert.deepEqual(
      [responseTx.Account, responseTx.SetFlag, responseTx.TransactionType],
      [expectedTx.Account, expectedTx.SetFlag, expectedTx.TransactionType],
    )
  })
})
