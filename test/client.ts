import { assert } from 'chai'
import _ from 'lodash'

import { Client } from 'xrpl-local'

import { setupClient, teardownClient } from './setupClient'

// how long before each test case times out
const TIMEOUT = 20000

describe('Client', function () {
  this.timeout(TIMEOUT)
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('Client - implicit server port', function () {
    // eslint-disable-next-line no-new -- Need to test constructor
    new Client('wss://s1.ripple.com')
  })

  it('Client invalid options', function () {
    // @ts-expect-error - This is intentionally invalid
    assert.throws(() => new Client({ invalid: true }))
  })

  it('Client valid options', function () {
    const client = new Client('wss://s:1')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix when src/client linting is merged
    const privateConnectionUrl = (client.connection as any).url
    assert.deepEqual(privateConnectionUrl, 'wss://s:1')
  })

  it('Client invalid server uri', function () {
    assert.throws(() => new Client('wss//s:1'))
  })

  it('Client connect() times out after 2 seconds', function () {
    // TODO: Use a timer mock like https://jestjs.io/docs/en/timer-mocks
    //       to test that connect() times out after 2 seconds.
  })
})
