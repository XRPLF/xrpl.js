import { PaymentChannelCreate } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('PaymentChannelCreate', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)
      const paymentChannelCreate: PaymentChannelCreate = {
        TransactionType: 'PaymentChannelCreate',
        Account: testContext.wallet.classicAddress,
        Amount: '100',
        Destination: wallet2.classicAddress,
        SettleDelay: 86400,
        PublicKey: testContext.wallet.publicKey,
      }

      await testTransaction(
        testContext.client,
        paymentChannelCreate,
        testContext.wallet,
      )
    },
    TIMEOUT,
  )
})
