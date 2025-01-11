import { Batch, Wallet } from '../../../src'
import { BatchFlags } from '../../../src/models/transactions/batch'
// import { signMultiBatch } from '../../../src/Wallet/batchSigner'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Batch', function () {
  let testContext: XrplIntegrationTestContext
  let destination: Wallet
  let wallet2: Wallet

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    wallet2 = await generateFundedWallet(testContext.client)
    destination = await generateFundedWallet(testContext.client)
  }, TIMEOUT)
  afterAll(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const tx: Batch = {
        TransactionType: 'Batch',
        Account: testContext.wallet.classicAddress,
        Flags: BatchFlags.tfAllOrNothing,
        RawTransactions: [
          {
            RawTransaction: {
              TransactionType: 'Payment',
              Account: testContext.wallet.classicAddress,
              Destination: destination.classicAddress,
              Amount: '10000000',
            },
          },
          {
            RawTransaction: {
              TransactionType: 'Payment',
              Account: testContext.wallet.classicAddress,
              Destination: destination.classicAddress,
              Amount: '10000000',
            },
          },
        ],
      }
      const autofilled = await testContext.client.autofill(tx)
      await testTransaction(testContext.client, autofilled, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'batch multisign',
    async () => {
      const tx: Batch = {
        TransactionType: 'Batch',
        Account: testContext.wallet.classicAddress,
        Flags: BatchFlags.tfAllOrNothing,
        Fee: '50',
        RawTransactions: [
          {
            RawTransaction: {
              TransactionType: 'Payment',
              Account: testContext.wallet.classicAddress,
              Destination: destination.classicAddress,
              Amount: '10000000',
            },
          },
          {
            RawTransaction: {
              TransactionType: 'Payment',
              Account: wallet2.classicAddress,
              Destination: destination.classicAddress,
              Amount: '10000000',
            },
          },
        ],
      }
      const autofilled = await testContext.client.autofill(tx)
      // signMultiBatch(wallet2, autofilled)
      await testTransaction(testContext.client, autofilled, testContext.wallet)
    },
    TIMEOUT,
  )
})
