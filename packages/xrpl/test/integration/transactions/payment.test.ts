import { assert } from 'chai'

import {
  Payment,
  Wallet,
  MPTokenIssuanceCreate,
  MPTokenAuthorize,
  TransactionMetadata,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Payment', function () {
  let testContext: XrplIntegrationTestContext
  let paymentTx: Payment
  const AMOUNT = '10000000'
  // This wallet is used for DeliverMax related tests
  let senderWallet: Wallet

  beforeEach(async () => {
    // this payment transaction JSON needs to be refreshed before every test.
    // Because, we tinker with Amount and DeliverMax fields in the API v2 tests
    paymentTx = {
      TransactionType: 'Payment',
      Account: senderWallet.classicAddress,
      Amount: AMOUNT,
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
    }
  })

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    senderWallet = await generateFundedWallet(testContext.client)
  })
  afterAll(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const tx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: senderWallet.classicAddress,
        Amount: '1000',
      }
      await testTransaction(testContext.client, tx, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction API v2: Payment Transaction: Specify Only Amount field',
    async () => {
      const result = await testTransaction(
        testContext.client,
        paymentTx,
        senderWallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, AMOUNT)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction API v2: Payment Transaction: Specify Only DeliverMax field',
    async () => {
      // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
      paymentTx.DeliverMax = paymentTx.Amount
      // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
      delete paymentTx.Amount

      const result = await testTransaction(
        testContext.client,
        paymentTx,
        senderWallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, AMOUNT)
    },
    TIMEOUT,
  )

  it(
    'Validate Payment transaction API v2: Payment Transaction: identical DeliverMax and Amount fields',
    async () => {
      // @ts-expect-error -- DeliverMax is a non-protocol, RPC level field in Payment transactions
      paymentTx.DeliverMax = paymentTx.Amount

      const result = await testTransaction(
        testContext.client,
        paymentTx,
        senderWallet,
      )

      assert.equal(result.result.engine_result_code, 0)
      assert.equal((result.result.tx_json as Payment).Amount, AMOUNT)
    },
    TIMEOUT,
  )

  it(
    'Validate MPT Payment ',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)

      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
      }

      const mptCreateRes = await testTransaction(
        testContext.client,
        createTx,
        testContext.wallet,
      )

      const txHash = mptCreateRes.result.tx_json.hash

      const txResponse = await testContext.client.request({
        command: 'tx',
        transaction: txHash,
      })

      const meta = txResponse.result
        .meta as TransactionMetadata<MPTokenIssuanceCreate>

      const mptID = meta.mpt_issuance_id

      let accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'mpt_issuance',
      })
      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        1,
        'Should be exactly one issuance on the ledger',
      )

      const authTx: MPTokenAuthorize = {
        TransactionType: 'MPTokenAuthorize',
        Account: wallet2.classicAddress,
        MPTokenIssuanceID: mptID!,
      }

      await testTransaction(testContext.client, authTx, wallet2)

      accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: wallet2.classicAddress,
        type: 'mptoken',
      })

      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        1,
        'Holder owns 1 MPToken on the ledger',
      )

      const payTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: wallet2.classicAddress,
        Amount: {
          mpt_issuance_id: mptID!,
          value: '100',
        },
      }

      await testTransaction(testContext.client, payTx, testContext.wallet)

      accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'mpt_issuance',
      })
      assert.equal(
        // @ts-expect-error -- Object type not known
        accountObjectsResponse.result.account_objects[0].OutstandingAmount,
        `100`,
      )
    },
    TIMEOUT,
  )
})
