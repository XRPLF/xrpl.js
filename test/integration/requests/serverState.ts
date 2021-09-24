import { assert } from 'chai'
import _ from 'lodash'

import { ServerStateRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('server_state', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: ServerStateRequest = {
      command: 'server_state',
    }
    const response = await this.client.request(request)
    const expected = {
      id: 0,
      result: {
        state: {
          build_version: '1.7.3',
          complete_ledgers: '2563-2932',
          io_latency_ms: 1,
          jq_trans_overflow: '0',
          last_close: {
            converge_time: 100,
            proposers: 0,
          },
          load: [Object],
          load_base: 256,
          load_factor: 256,
          load_factor_fee_escalation: 256,
          load_factor_fee_queue: 256,
          load_factor_fee_reference: 256,
          load_factor_server: 256,
          peer_disconnects: '0',
          peer_disconnects_resources: '0',
          peers: 0,
          pubkey_node: 'n9K6DaaReKkCjb9sEfXh5xP3BV9JisrJ9biKB3CSSFXancBnv5cW',
          pubkey_validator: 'none',
          server_state: 'full',
          server_state_duration_us: '8752487389',
          state_accounting: [Object],
          time: '2021-Sep-23 22:56:55.413151 UTC',
          uptime: 8752,
          validated_ledger: {
            base_fee: 10,
            close_time: 685829741,
            hash: 'B98AABCE40A54DF654C86E56088AD7D46BBA8B8E93AD3FAC2426FEFF847F7937',
            reserve_base: 20000000,
            reserve_inc: 5000000,
            seq: 2294,
          },
          validation_quorum: 0,
          validator_list_expires: 0,
        },
      },
      status: 'success',
      type: 'response',
    }
    assert.equal(response.status, expected.status)
    assert.equal(response.type, expected.type)
    const removeKeys = [
      'complete_ledgers',
      'load',
      'state_accounting',
      'pubkey_node',
      'time',
      'uptime',
      'server_state_duration_us',
      'validated_ledger.hash',
      'validated_ledger.seq',
      'validated_ledger.close_time',
    ]
    assert.deepEqual(
      _.omit(response.result.state, removeKeys),
      _.omit(expected.result.state, removeKeys),
    )

    // load
    assert.equal(typeof response.result.state.load.threads, 'number')
    for (const obj of response.result.state.load.job_types) {
      assert.equal(typeof obj.per_second, 'number')
      assert.equal(typeof obj.job_type, 'string')
    }
    // state_accounting
    Object.keys(response.result.state.state_accounting).forEach(function (key) {
      assert.equal(
        typeof response.result.state.state_accounting[key].duration_us,
        'string',
      )
      assert.equal(
        typeof response.result.state.state_accounting[key].transitions,
        'number',
      )
    })
  })
})
