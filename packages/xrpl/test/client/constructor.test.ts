import { assert } from 'chai'
import { Client } from 'xrpl-local'

describe('client constructor', () => {
  it('Client - implicit server port', () => {
    // eslint-disable-next-line no-new -- Testing constructor
    new Client('wss://s1.ripple.com')
  })

  it('Client invalid options', () => {
    // @ts-expect-error - This is intentionally invalid
    assert.throws(() => new Client({ invalid: true }))
  })

  it('Client valid options', () => {
    const client = new Client('wss://s:1')
    const privateConnectionUrl = client.url
    assert.deepEqual(privateConnectionUrl, 'wss://s:1')
  })

  it('Client invalid server uri', () => {
    assert.throws(() => new Client('wss//s:1'))
  })
})
