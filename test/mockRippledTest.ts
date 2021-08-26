import { assert } from 'chai'
import { RippledError } from '../src/common/errors'
import setupClient from './setupClient'
import { assertRejects } from './testUtils'

describe('mock rippled tests', () => {
  beforeEach(setupClient.setup)
  afterEach(setupClient.teardown)
  it('errors if a mock is not provided', async function () {
    this.mockRippled.suppressOutput = true
    await assertRejects(this.client.request({command: 'server_info'}), RippledError)
  })

  it('provide bad response shape', async function () {
    try {
      this.mockRippled.addResponse({command: 'account_info'}, {data: {}})
      assert.fail('Expected an error to be thrown')
    } catch (error) {
      assert(error instanceof Error, error.message)
    }
  })

  it('provide bad response shape in function', async function () {
    this.mockRippled.suppressOutput = true
    this.mockRippled.addResponse({command: 'account_info'}, request => {return {data: request}})
    await assertRejects(
      this.client.request({command: 'account_info', account: ''}),
      RippledError
    )
  })
  
})