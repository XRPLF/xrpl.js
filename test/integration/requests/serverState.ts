import { assert } from 'chai'
import _ from 'lodash'

import { ServerStateRequest } from '../../../src'
import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('Server Info ServerState', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('serverState', async function () {
    const request: ServerStateRequest = {
      command: 'server_state',
    }
    const response = await this.client.request(request)
    const expected = {
      id: 5,
      result: {
        state: {
          build_version: '1.7.3',
          complete_ledgers: '2563-2932',
          io_latency_ms: 1,
          jq_trans_overflow: '0',
          last_close: [Object],
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
          validated_ledger: [Object],
          validation_quorum: 0,
          validator_list_expires: 0,
        },
      },
      status: 'success',
      type: 'response',
    }
    assert.equal(response.status, expected.status)
    assert.equal(response.type, expected.type)
  })
})
