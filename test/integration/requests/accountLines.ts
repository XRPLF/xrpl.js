import { assert } from 'chai'
import _ from 'lodash'

import { AccountLinesRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('AccountLines', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: AccountLinesRequest = {
      command: 'account_lines',
      account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      strict: true,
      ledger_index: 'validated',
    }
    const response = await this.client.request(request)
    const expected = {
      id: 5,
      result: {
        account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        ledger_hash:
          '0C09AAFA88AC1A616058220CF33269788D3985DAA6F2386196D4A7404252BB61',
        ledger_index: 1074,
        lines: [],
        validated: true,
      },
      status: 'success',
      type: 'response',
    }
    assert.equal(response.status, expected.status)
    assert.equal(response.type, expected.type)
    assert.deepEqual(
      _.omit(response.result, ['ledger_hash', 'ledger_index']),
      _.omit(expected.result, ['ledger_hash', 'ledger_index']),
    )
  })
})
