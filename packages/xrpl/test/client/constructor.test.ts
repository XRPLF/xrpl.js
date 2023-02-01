import { assert } from 'chai'
import { Client } from 'xrpl-local'

describe('client constructor', function () {
  it('Client - implicit server port', function () {
    // eslint-disable-next-line no-new -- Testing constructor
    new Client('wss://s1.ripple.com')
  })

  it('Client invalid options', function () {
    // @ts-expect-error - This is intentionally invalid
    assert.throws(() => new Client({ invalid: true }))
  })

  it('Client valid options', function () {
    const client = new Client('wss://s:1')
    const privateConnectionUrl = client.url
    assert.deepEqual(privateConnectionUrl, 'wss://s:1')
  })

  it('Client invalid server uri', function () {
    assert.throws(() => new Client('wss//s:1'))
  })
})
