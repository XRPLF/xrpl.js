import { assert } from 'chai'

import { Client } from '../../src'

// how long before each test case times out
const TIMEOUT = 20000

describe('Client', function () {
  it(
    'Client - implicit server port',
    () => {
      // eslint-disable-next-line no-new -- Need to test constructor
      new Client('wss://s1.ripple.com')
    },
    TIMEOUT,
  )

  it(
    'Client invalid options',
    () => {
      // @ts-expect-error - This is intentionally invalid
      assert.throws(() => new Client({ invalid: true }))
    },
    TIMEOUT,
  )

  it(
    'Client valid options',
    () => {
      const client = new Client('wss://s:1')
      const privateConnectionUrl = client.url
      assert.deepEqual(privateConnectionUrl, 'wss://s:1')
    },
    TIMEOUT,
  )

  it(
    'Client invalid server uri',
    () => {
      assert.throws(() => new Client('wss//s:1'))
    },
    TIMEOUT,
  )

  // it(
  //   'Client connect() times out after 2 seconds',
  //   () => {
  //     /*
  //      * TODO: Use a timer mock like https://jestjs.io/docs/en/timer-mocks
  //      *       to test that connect() times out after 2 seconds.
  //      */
  //   },
  //   TIMEOUT,
  // )
})
