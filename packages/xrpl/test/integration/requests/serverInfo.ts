import { assert } from 'chai'
import _ from 'lodash'

import { ServerInfoRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('server_info', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: ServerInfoRequest = {
      command: 'server_info',
    }
    const response = await this.client.request(request)
    const expected = {
      id: 0,
      result: {
        info: {
          build_version: '1.7.3',
          complete_ledgers: '2563-2928',
          hostid: '44578fe64241',
          io_latency_ms: 1,
          jq_trans_overflow: '0',
          last_close: { converge_time_s: 0.1, proposers: 0 },
          load: {
            job_types: [
              {
                in_progress: 1,
                job_type: 'clientCommand',
                peak_time: 4,
                per_second: 9,
              },
              { job_type: 'updatePaths', per_second: 1 },
              { job_type: 'advanceLedger', per_second: 1 },
              { job_type: 'pathFind', per_second: 1 },
              { job_type: 'WriteNode', per_second: 17 },
            ],
            threads: 1,
          },
          load_factor: 1,
          peer_disconnects: '0',
          peer_disconnects_resources: '0',
          peers: 0,
          pubkey_node: 'n9K6DaaReKkCjb9sEfXh5xP3BV9JisrJ9biKB3CSSFXancBnv5cW',
          pubkey_validator: 'none',
          server_state: 'full',
          server_state_duration_us: '8752395105',
          state_accounting: {
            connected: { duration_us: '0', transitions: 0 },
            disconnected: { duration_us: '41860', transitions: 1 },
            full: { duration_us: '20723121268', transitions: 1 },
            syncing: { duration_us: '0', transitions: 0 },
            tracking: { duration_us: '0', transitions: 0 },
          },
          time: '2021-Sep-23 22:56:55.320858 UTC',
          uptime: 8752,
          validated_ledger: {
            age: 0,
            base_fee_xrp: 0.00001,
            hash: '532175EC25CF34081D7F83584F37DAB70035A422CBE94352BEDA8EC123CB8F60',
            reserve_base_xrp: 200,
            reserve_inc_xrp: 50,
            seq: 1906,
          },
          validation_quorum: 0,
          validator_list: {
            count: 0,
            expiration: 'unknown',
            status: 'unknown',
          },
        },
      },
      type: 'response',
    }
    assert.equal(response.type, expected.type)

    assert.equal(typeof response.result.info.time, 'string')
    assert.equal(typeof response.result.info.uptime, 'number')
    assert.equal(typeof response.result.info.complete_ledgers, 'string')
    assert.equal(typeof response.result.info.hostid, 'string')
    assert.equal(typeof response.result.info.pubkey_node, 'string')
    assert.equal(typeof response.result.info.server_state_duration_us, 'string')
    const removeKeys = [
      'time',
      'uptime',
      'complete_ledgers',
      'hostid',
      'load',
      'state_accounting',
      'pubkey_node',
      'server_state_duration_us',
      'validated_ledger',
    ]
    assert.deepEqual(
      _.omit(response.result.info, removeKeys),
      _.omit(expected.result.info, removeKeys),
    )

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
  })
})
