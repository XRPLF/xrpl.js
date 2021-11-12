import { assert } from 'chai'
import _ from 'lodash'

import { ChannelVerifyRequest, ChannelVerifyResponse } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('channel_verify', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const channelVerify: ChannelVerifyRequest = {
      command: 'channel_verify',
      channel_id:
        '5DB01B7FFED6B67E6B0414DED11E051D2EE2B7619CE0EAA6286D67A3A4D5BDB3',
      signature:
        '304402204EF0AFB78AC23ED1C472E74F4299C0C21F1B21D07EFC0A3838A420F76D783A400220154FB11B6F54320666E4C36CA7F686C16A3A0456800BBC43746F34AF50290064',
      public_key: 'aB44YfzW24VDEJQ2UuLPV2PvqcPCSoLnL7y5M1EzhdW4LnK5xMS3',
      amount: '1000000',
    }

    const response = await this.client.request(channelVerify)

    const expectedResponse: ChannelVerifyResponse = {
      id: response.id,
      type: 'response',
      result: {
        signature_verified: response.result.signature_verified,
      },
    }

    assert.deepEqual(response, expectedResponse)
  })
})
