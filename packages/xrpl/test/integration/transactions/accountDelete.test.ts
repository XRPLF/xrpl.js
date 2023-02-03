import { AccountDelete } from '../../../src/models/transactions'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, submitTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('AccountDelete', function () {
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
      // const promises: Array<Promise<void> | Promise<unknown>> = []
      // for (let iter = 0; iter < 256; iter += 1) {
      //   promises.push(ledgerAccept(testContext.client))
      // }
      // await Promise.all(promises)
      const tx: AccountDelete = {
        TransactionType: 'AccountDelete',
        Account: testContext.wallet.classicAddress,
        Destination: wallet2.classicAddress,
      }

      // Since we are not testing the functionaity of rippled in this library, only that we are submitting commands
      // properly, we can just test that the AccountDelete command was successfully received.
      await submitTransaction({
        client: testContext.client,
        transaction: tx,
        wallet: testContext.wallet,
      })

      // TODO: Re-enable this test once we can test the `engine_result` without waiting a significant amount of time.
      // Note, we can't test the `engine_result` without waiting a significant
      // amount of time because accounts can't be deleted until some number of
      // ledgers have closed since its creation.
      //
      // The documentation for `tecTOO_SOON` reads:
      // "The AccountDelete transaction failed because the account to be deleted had a
      // Sequence number that is too high. The current ledger index must be at least
      // 256 higher than the account's sequence number."
      //
      // self.assertEqual(response.result['engine_result'], 'tesSUCCESS')
      // await testTransaction(testContext.client, tx, testContext.wallet, {
      //   // Need to retry when running tests concurrently
      //   count: 5,
      //   delayMs: 1000,
      // })
    },
    TIMEOUT,
  )
})
