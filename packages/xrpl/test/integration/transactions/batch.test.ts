import { Batch, Payment, Wallet } from '../../../src'
import { BatchFlags } from '../../../src/models/transactions/batch'
import { signMultiBatch } from '../../../src/Wallet/batchSigner'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import {
  generateFundedWallet,
  testTransaction,
  verifySubmittedTransaction,
} from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Batch', function () {
  let testContext: XrplIntegrationTestContext
  let destination: Wallet
  let wallet2: Wallet

  async function testBatchTransaction(
    batch: Batch,
    wallet: Wallet,
    retry?: {
      count: number
      delayMs: number
    },
  ): Promise<void> {
    await testTransaction(testContext.client, batch, wallet, retry)
    const promises: Array<Promise<void>> = []
    for (const rawTx of batch.RawTransactions) {
      promises.push(
        verifySubmittedTransaction(testContext.client, rawTx.RawTransaction),
      )
    }
    await Promise.all(promises)
  }

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    wallet2 = await generateFundedWallet(testContext.client)
    destination = await generateFundedWallet(testContext.client)
  }, TIMEOUT)
  afterAll(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const payment: Payment = {
        TransactionType: 'Payment',
        Flags: 0x40000000,
        Account: testContext.wallet.classicAddress,
        Destination: destination.classicAddress,
        Amount: '10000000',
      }
      const tx: Batch = {
        TransactionType: 'Batch',
        Account: testContext.wallet.classicAddress,
        Flags: BatchFlags.tfAllOrNothing,
        RawTransactions: [payment, { ...payment }, { ...payment }].map(
          (rawTx) => ({
            RawTransaction: rawTx,
          }),
        ),
      }
      const autofilled = await testContext.client.autofill(tx)
      await testBatchTransaction(autofilled, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'batch multisign',
    async () => {
      const payment: Payment = {
        TransactionType: 'Payment',
        Flags: 0x40000000,
        Account: testContext.wallet.classicAddress,
        Destination: destination.classicAddress,
        Amount: '10000000',
      }
      const payment2: Payment = { ...payment, Account: wallet2.classicAddress }
      const tx: Batch = {
        TransactionType: 'Batch',
        Account: testContext.wallet.classicAddress,
        Flags: BatchFlags.tfAllOrNothing,
        RawTransactions: [payment, payment2].map((rawTx) => ({
          RawTransaction: rawTx,
        })),
      }
      const autofilled = await testContext.client.autofill(tx, 1)
      signMultiBatch(wallet2, autofilled)
      await testBatchTransaction(autofilled, testContext.wallet)
    },
    TIMEOUT,
  )
})
