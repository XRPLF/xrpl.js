import { assert } from 'chai'

import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'
import { addressTests } from '../testUtils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
describe('client.getXrpBalance', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  addressTests.forEach(function (testcase) {
    describe(testcase.type, () => {
      it('getXrpBalance', async function () {
        testContext.mockRippled!.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        testContext.mockRippled!.addResponse('ledger', rippled.ledger.normal)
        const result = await testContext.client.getXrpBalance(testcase.address)
        assert.equal(result, 922.913243)
      })
    })
  })
})
