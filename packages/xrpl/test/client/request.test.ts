import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'
import { addressTests, assertResultMatch } from '../testUtils'

describe('client.request', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  addressTests.forEach(function (testcase) {
    describe(testcase.type, () => {
      it('request account_objects', async function () {
        testContext.mockRippled!.addResponse(
          'account_objects',
          rippled.account_objects.normal,
        )
        const result = await testContext.client.request({
          command: 'account_objects',
          account: testcase.address,
        })

        assertResultMatch(
          result.result,
          responses.getAccountObjects,
          'AccountObjectsResponse',
        )
      })

      it('request account_objects - invalid options', async function () {
        testContext.mockRippled!.addResponse(
          'account_objects',
          rippled.account_objects.normal,
        )
        const result = await testContext.client.request({
          command: 'account_objects',
          account: testcase.address,
        })

        assertResultMatch(
          result.result,
          responses.getAccountObjects,
          'AccountObjectsResponse',
        )
      })
    })
  })
})
