// import { assert } from 'chai'
import _ from 'lodash'

import { ManifestRequest } from '../../../src'
import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'
import { getMasterPublicKey } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Server Info Manifest', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('manifest', async function () {
    const request: ManifestRequest = {
      command: 'manifest',
      public_key: getMasterPublicKey(),
    }
    console.log(request)
    // const response = await this.client.request(request)
    // assert.equal(response.status, 'success')
    // assert.equal(response.type, 'response')
  })
})
