import _ from 'lodash'
import { AccountDelete } from 'xrpl-local/models/transactions'

import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, ledgerAccept, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('AccountDelete', () => {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)
      // to the satisfy the condition that account sequence and current ledger_index should be 256 apart.
      const promises: Array<Promise<void>> = []
      for (let iter = 0; iter < 256; iter += 1) {
        promises.push(ledgerAccept(testContext.client))
      }

      await Promise.all(promises)
      const tx: AccountDelete = {
        TransactionType: 'AccountDelete',
        Account: testContext.wallet.classicAddress,
        Destination: wallet2.classicAddress,
      }
      await testTransaction(testContext.client, tx, testContext.wallet, {
        count: 5,
        delayMs: 1000,
      })
    },
    TIMEOUT,
  )
})
