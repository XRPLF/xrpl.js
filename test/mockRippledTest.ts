import { assert } from 'chai'

import { RippledError } from '../src/common/errors'

import setupClient from './setupClient'
import { assertRejects } from './testUtils'

describe('mock rippled tests', function () {
  beforeEach(setupClient.setup)
  afterEach(setupClient.teardown)
  it('errors if a mock is not provided', async function () {
    this.mockRippled.suppressOutput = true
    await assertRejects(
      this.client.request({ command: 'server_info' }),
      RippledError,
    )
  })

  it('provide bad response shape', async function () {
    assert.throws(
      () => this.mockRippled.addResponse('account_info', { data: {} }),
      Error,
    )
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
