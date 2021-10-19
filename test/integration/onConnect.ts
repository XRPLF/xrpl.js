import { Client } from 'xrpl-local'

import serverUrl from './serverUrl'

// how long before each test case times out
const TIMEOUT = 20000

describe('on handlers', function () {
  this.timeout(TIMEOUT)

  it('on connect', async function () {
    const client = new Client(serverUrl)
    return new Promise<void>(function (resolve) {
      client.on('connected', function () {
        client.removeAllListeners()
        resolve()
      })
      client.connect()
    })
  })

  it('on disconnect', async function () {
    const client = new Client(serverUrl)
    return new Promise<void>(function (resolve) {
      client.on('disconnected', function () {
        client.removeAllListeners()
        resolve()
      })
      client.connect().then(async () => client.disconnect())
    })
  })
})
