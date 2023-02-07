import { assert } from 'chai'

import { OfferCreate } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('OfferCreate', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const tx: OfferCreate = {
        TransactionType: 'OfferCreate',
        Account: testContext.wallet.classicAddress,
        TakerGets: '13100000',
        TakerPays: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '10',
        },
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      // confirm that the offer actually went through
      const accountOffersResponse = await testContext.client.request({
        command: 'account_offers',
        account: testContext.wallet.classicAddress,
      })
      assert.lengthOf(
        accountOffersResponse.result.offers!,
        1,
        'Should be exactly one offer on the ledger',
      )
    },
    TIMEOUT,
  )
})
