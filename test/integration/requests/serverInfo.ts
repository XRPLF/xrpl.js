import { assert } from 'chai'
import _ from 'lodash'

import { ServerInfoRequest } from '../../../src'
import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('Server Info ServerInfo', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('serverInfo', async function () {
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
  })
})
