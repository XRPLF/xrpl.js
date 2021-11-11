import { assert } from 'chai'
import _ from 'lodash'

import { AccountInfoRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('account_info', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: AccountInfoRequest = {
      command: 'account_info',
      account: this.wallet.classicAddress,
      strict: true,
      ledger_index: 'validated',
    }
    const response = await this.client.request(request)
    const expected = {
      id: 0,
      result: {
        account_data: {
          Account: this.wallet.classicAddress,
          Balance: '400000000',
          Flags: 0,
          LedgerEntryType: 'AccountRoot',
          OwnerCount: 0,
          PreviousTxnID:
            '19A8211695785A3A02C1C287D93C2B049E83A9CD609825E721052D63FF4F0EC8',
          PreviousTxnLgrSeq: 582,
          Sequence: 283,
          index:
            'BD4815E6EB304136E6044F778FB68D4E464CC8DFC59B8F6CC93D90A3709AE194',
        },
        ledger_hash:
          'F0DEEC46A7185BBB535517EE38CF2025973022D5B0532B36407F492521FDB0C6',
        ledger_index: 582,
        validated: true,
      },
      type: 'response',
    }
    assert.equal(response.type, expected.type)
    assert.equal(response.result.validated, expected.result.validated)
    assert.equal(typeof response.result.ledger_hash, 'string')
    assert.equal(typeof response.result.ledger_index, 'number')
    assert.equal(typeof response.result.account_data.PreviousTxnID, 'string')
    assert.equal(typeof response.result.account_data.index, 'string')
    assert.equal(
      typeof response.result.account_data.PreviousTxnLgrSeq,
      'number',
    )
    assert.equal(typeof response.result.account_data.Sequence, 'number')
    assert.deepEqual(
      _.omit(response.result.account_data, [
        'PreviousTxnID',
        'PreviousTxnLgrSeq',
        'Sequence',
        'index',
      ]),
      _.omit(expected.result.account_data, [
        'PreviousTxnID',
        'PreviousTxnLgrSeq',
        'Sequence',
        'index',
      ]),
    )
  })
})
