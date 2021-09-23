import { assert } from 'chai'
import _ from 'lodash'

import { AccountInfoRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('AccountInfo', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: AccountInfoRequest = {
      command: 'account_info',
      account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      strict: true,
      ledger_index: 'validated',
    }
    const response = await this.client.request(request)
    const expected = {
      id: 5,
      result: {
        account_data: {
          Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
          Balance: '99999887199996616',
          Flags: 0,
          LedgerEntryType: 'AccountRoot',
          OwnerCount: 0,
          PreviousTxnID:
            '19A8211695785A3A02C1C287D93C2B049E83A9CD609825E721052D63FF4F0EC8',
          PreviousTxnLgrSeq: 582,
          Sequence: 283,
          index:
            '2B6AC232AA4C4BE41BF49D2459FA4A0347E1B543A4C92FCEE0821C0201E2E9A8',
        },
        ledger_hash:
          'F0DEEC46A7185BBB535517EE38CF2025973022D5B0532B36407F492521FDB0C6',
        ledger_index: 582,
        validated: true,
      },
      status: 'success',
      type: 'response',
    }
    assert.equal(
      _.has(response.result.account_data, 'Balance'),
      _.has(expected.result.account_data, 'Balance'),
    )
    assert.equal(response.status, expected.status)
    assert.equal(response.type, expected.type)
    assert.equal(response.result.validated, expected.result.validated)
    assert.deepEqual(
      _.omit(response.result.account_data, [
        'PreviousTxnID',
        'PreviousTxnLgrSeq',
        'Sequence',
        'Balance',
      ]),
      _.omit(expected.result.account_data, [
        'PreviousTxnID',
        'PreviousTxnLgrSeq',
        'Sequence',
        'Balance',
      ]),
    )
  })
})
