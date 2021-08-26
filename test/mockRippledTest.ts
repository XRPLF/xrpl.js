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
    await assertRejects(
      this.mockRippled.addResponse({command: 'account_info'}, {data: {}}),
      RippledError
    )
  })

  it('provide bad response shape in function', async function () {
    this.mockRippled.addResponse({command: 'account_info'}, request => {return {data: request}})
    await assertRejects(
      this.client.request({command: 'account_info', account: ''}),
      RippledError
    )
  })
  
})