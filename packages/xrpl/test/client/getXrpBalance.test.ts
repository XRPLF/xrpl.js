import { assert } from 'chai'

import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'
import { addressTests } from '../testUtils'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
describe('client.getXrpBalance', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  addressTests.forEach(function (testcase) {
    describe(testcase.type, function () {
      it('getXrpBalance', async function () {
        this.mockRippled.addResponse(
          'account_info',
          rippled.account_info.normal,
        )
        this.mockRippled.addResponse('ledger', rippled.ledger.normal)
        const result = await this.client.getXrpBalance(testcase.address)
        assert.equal(result, '922.913243')
      })
    })
  })
})
