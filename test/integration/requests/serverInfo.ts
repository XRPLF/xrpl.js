import { assert } from 'chai'
import _ from 'lodash'

import { ServerInfoRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('server_info', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: ServerInfoRequest = {
      command: 'server_info',
    }
    const response = await this.client.request(request)
    const expected = {
      id: 5,
      result: {
        info: {
          build_version: '1.7.3',
          complete_ledgers: '2563-2928',
          hostid: '44578fe64241',
          io_latency_ms: 1,
          jq_trans_overflow: '0',
          last_close: [Object],
          load: [Object],
          load_factor: 1,
          peer_disconnects: '0',
          peer_disconnects_resources: '0',
          peers: 0,
          pubkey_node: 'n9K6DaaReKkCjb9sEfXh5xP3BV9JisrJ9biKB3CSSFXancBnv5cW',
          pubkey_validator: 'none',
          server_state: 'full',
          server_state_duration_us: '8752395105',
          state_accounting: [Object],
          time: '2021-Sep-23 22:56:55.320858 UTC',
          uptime: 8752,
          validated_ledger: [Object],
          validation_quorum: 0,
          validator_list: [Object],
        },
      },
      status: 'success',
      type: 'response',
    }
    assert.equal(response.status, expected.status)
    assert.equal(response.type, expected.type)
    assert.equal(
      _.every(
        Object.keys(expected.result.info),
        // eslint-disable-next-line @typescript-eslint/unbound-method -- has verifies if the object actually has the key.
        _.partial(_.has, response.result.info),
      ),
      true,
    )

    // types
    for (const key of [
      'io_latency_ms',
      'load_factor',
      'peers',
      'uptime',
      'validation_quorum',
    ]) {
      assert.equal(typeof response.result.info[key], 'number')
    }

    const stringKeys = [
      'build_version',
      'complete_ledgers',
      'hostid',
      'jq_trans_overflow',
      'peer_disconnects',
      'peer_disconnects_resources',
      'pubkey_node',
      'pubkey_validator',
      'server_state',
      'server_state_duration_us',
      'time',
    ]
    for (const key of stringKeys) {
      assert.equal(typeof response.result.info[key], 'string')
    }

    // objects
    // last_close
    for (const key of Object.keys(response.result.info.last_close)) {
      assert.equal(typeof response.result.info.last_close[key], 'number')
    }
    // load
    assert.equal(typeof response.result.info.load.threads, 'number')
    for (const obj of response.result.info.load.job_types) {
      assert.equal(typeof obj.per_second, 'number')
      assert.equal(typeof obj.job_type, 'string')
    }
    // state_accounting
    Object.keys(response.result.info.state_accounting).forEach(function (key) {
      assert.equal(
        typeof response.result.info.state_accounting[key].duration_us,
        'string',
      )
      assert.equal(
        typeof response.result.info.state_accounting[key].transitions,
        'number',
      )
    })
    // validated_ledger
    assert.equal(typeof response.result.info.validated_ledger.hash, 'string')
    for (const key of Object.keys(
      _.omit(response.result.info.validated_ledger, 'hash'),
    )) {
      assert.equal(typeof response.result.info.validated_ledger[key], 'number')
    }
    // validator_list
    assert.equal(typeof response.result.info.validator_list.count, 'number')
    assert.equal(
      typeof response.result.info.validator_list.expiration,
      'string',
    )
    assert.equal(typeof response.result.info.validator_list.status, 'string')
  })
})
