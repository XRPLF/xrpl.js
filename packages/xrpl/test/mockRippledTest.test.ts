import { assert } from 'chai'

import { RippledError } from '../src'

import rippledFixtures from './fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from './setupClient'
import { assertRejects } from './testUtils'

describe('mock rippled tests', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))
  it('errors if a mock is not provided', async function () {
    if (testContext.mockRippled) {
      testContext.mockRippled.suppressOutput = true
    }

    await assertRejects(
      testContext.client.request({
        command: 'account_info',
        account:
          rippledFixtures.account_info.normal.result.account_data.Account,
      }),
      RippledError,
    )
  })

  it('provide bad response shape', async function () {
    try {
      testContext.mockRippled!.addResponse('account_info', { data: {} })
      assert.fail('Should have errored')
    } catch (err) {
      if (!(err instanceof Error)) {
        assert.fail(`Wrong error type: ${err as string}`)
      }
    }
  })

  it('provide bad response shape in function', async function () {
    testContext.mockRippled!.suppressOutput = true
    testContext.mockRippled!.addResponse('account_info', (request) => {
      return { data: request }
    })
    await assertRejects(
      testContext.client.request({
        command: 'account_info',
        account:
          rippledFixtures.account_info.normal.result.account_data.Account,
      }),
      RippledError,
    )
  })
})
