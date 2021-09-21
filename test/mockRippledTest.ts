import { assert } from 'chai'

import { RippledError } from 'xrpl-local'

import { setupClient, teardownClient } from './setupClient'
import { assertRejects } from './testUtils'

describe('mock rippled tests', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)
  it('errors if a mock is not provided', async function () {
    this.mockRippled.suppressOutput = true
    await assertRejects(
      this.client.request({ command: 'server_info' }),
      RippledError,
    )
  })

  it('provide bad response shape', async function () {
    try {
      this.mockRippled.addResponse('account_info', { data: {} })
      assert.fail('Should have errored')
    } catch (err) {
      if (!(err instanceof Error)) {
        assert.fail(`Wrong error type: ${err as string}`)
      }
    }
  })

  it('provide bad response shape in function', async function () {
    this.mockRippled.suppressOutput = true
    this.mockRippled.addResponse('account_info', (request) => {
      return { data: request }
    })
    await assertRejects(
      this.client.request({ command: 'account_info', account: '' }),
      RippledError,
    )
  })
})
