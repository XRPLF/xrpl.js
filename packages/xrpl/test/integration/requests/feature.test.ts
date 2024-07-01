import { assert } from 'chai'

import { FeatureRequest, FeatureResponse } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

// how long before each test case times out
const TIMEOUT = 20000
const AMENDMENT =
  '8CC0774A3BF66D1D22E76BBDA8E8A232E6B6313834301B3B23E8601196AE6455'

describe('feature', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const featureRequest: FeatureRequest = {
        command: 'feature',
      }
      const featureResponse: FeatureResponse = await testContext.client.request(
        featureRequest,
      )

      assert.equal(featureResponse.type, 'response')
      assert.typeOf(featureResponse.result.features, 'object')
      assert.isTrue(AMENDMENT in featureResponse.result.features)

      const amendmentData = featureResponse.result.features[AMENDMENT]
      assert.equal(amendmentData.name, 'AMM')
      // TODO: fix with actual value
      assert.typeOf(amendmentData.enabled, 'boolean')
      assert.equal(amendmentData.supported, true)
    },
    TIMEOUT,
  )
})
