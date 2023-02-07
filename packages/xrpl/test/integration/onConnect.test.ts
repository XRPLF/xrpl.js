import { assert } from 'chai'

import { Client } from '../../src'

import serverUrl from './serverUrl'

// how long before each test case times out
const TIMEOUT = 20000

describe('on handlers', function () {
  it(
    'on connect',
    async () => {
      const client = new Client(serverUrl)
      return new Promise<void>(function (resolve) {
        client.on('connected', function () {
          client.removeAllListeners()
          client.disconnect().then(() => resolve())
        })
        client.connect()
      })
    },
    TIMEOUT,
  )

  it(
    'on disconnect',
    async () => {
      const client = new Client(serverUrl)
      return new Promise<void>(function (resolve) {
        client.on('disconnected', function (code: number) {
          // should be the normal disconnect code
          assert.equal(code, 1000)
          client.removeAllListeners()
          resolve()
        })
        client.connect().then(async () => client.disconnect())
      })
    },
    TIMEOUT,
  )
})
