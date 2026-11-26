import { assert } from 'chai'

import { Client } from '../../src/client'

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

  it('Client rejects authorization over non-TLS websocket', function () {
    assert.throws(
      () => new Client('ws://s1.ripple.com', { authorization: 'secret' }),
      'Authorization Credentials cannot be sent over an unencrypted connection. Use wss:// or wss+unix:// instead.',
    )
  })

  it('Client rejects authorization over ws+unix:// websocket', function () {
    assert.throws(
      () =>
        new Client('ws+unix:///var/run/rippled.sock', {
          authorization: 'secret',
        }),
      'Authorization Credentials cannot be sent over an unencrypted connection. Use wss:// or wss+unix:// instead.',
    )
  })

  it('Client allows authorization over wss:// websocket', function () {
    // Should not throw
    const client = new Client('wss://s1.ripple.com', {
      authorization: 'secret',
    })
    assert.isDefined(client)
  })

  it('Client allows wss+unix:// with authorization', function () {
    // Should not throw
    const client = new Client('wss+unix:///var/run/rippled.sock', {
      authorization: 'secret',
    })
    assert.isDefined(client)
  })

  it('Client allows ws:// without authorization', function () {
    // Should not throw when no credentials are sent over plaintext
    const client = new Client('ws://s1.ripple.com')
    assert.isDefined(client)
  })

  it('Client rejects empty string authorization over ws://', function () {
    // Empty string is still a credential being sent in plaintext
    assert.throws(
      () => new Client('ws://s1.ripple.com', { authorization: '' }),
      'Authorization Credentials cannot be sent over an unencrypted connection. Use wss:// or wss+unix:// instead.',
    )
  })
})
