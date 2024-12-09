import { assert } from 'chai'

import {
  AccountSet,
  AccountSetAsfFlags,
  TrustSet,
  Payment,
  Clawback,
  MPTokenIssuanceCreate,
  MPTokenIssuanceCreateFlags,
  MPTokenAuthorize,
  TransactionMetadata,
  LedgerEntryResponse,
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

describe('Clawback', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)

      const setupAccountSetTx: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        SetFlag: AccountSetAsfFlags.asfAllowTrustLineClawback,
      }
      await testTransaction(
        testContext.client,
        setupAccountSetTx,
        testContext.wallet,
      )

      const setupTrustSetTx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: wallet2.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '1000',
        },
      }
      await testTransaction(testContext.client, setupTrustSetTx, wallet2)

      const setupPaymentTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Destination: wallet2.classicAddress,
        Amount: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '1000',
        },
      }
      await testTransaction(
        testContext.client,
        setupPaymentTx,
        testContext.wallet,
      )

      // verify that line is created
      const objectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: wallet2.classicAddress,
        type: 'state',
      })
      assert.lengthOf(
        objectsResponse.result.account_objects,
        1,
        'Should be exactly one line on the ledger',
      )

      // actual test - clawback
      const tx: Clawback = {
        TransactionType: 'Clawback',
        Account: testContext.wallet.classicAddress,
        Amount: {
          currency: 'USD',
          issuer: wallet2.classicAddress,
          value: '500',
        },
      }
      await testTransaction(testContext.client, tx, testContext.wallet)

      // verify amount clawed back
      const linesResponse = await testContext.client.request({
        command: 'account_lines',
        account: wallet2.classicAddress,
      })

      assert.lengthOf(
        linesResponse.result.lines,
        1,
        'Should be exactly one line on the ledger',
      )
      assert.equal(
        '500',
        linesResponse.result.lines[0].balance,
        `Holder balance incorrect after Clawback`,
      )
    },
    TIMEOUT,
  )

  it(
    'MPToken',
    async () => {
      const wallet2 = await generateFundedWallet(testContext.client)
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        Flags: MPTokenIssuanceCreateFlags.tfMPTCanClawback,
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

      const holderAuthTx: MPTokenAuthorize = {
        TransactionType: 'MPTokenAuthorize',
        Account: wallet2.classicAddress,
        MPTokenIssuanceID: mptID!,
      }

      await testTransaction(testContext.client, holderAuthTx, wallet2)

      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: testContext.wallet.classicAddress,
        Amount: { mpt_issuance_id: mptID!, value: '9223372036854775807' },
        Destination: wallet2.classicAddress,
      }

      await testTransaction(testContext.client, paymentTx, testContext.wallet)

      let ledgerEntryResponse: LedgerEntryResponse =
        await testContext.client.request({
          command: 'ledger_entry',
          mptoken: {
            mpt_issuance_id: mptID!,
            account: wallet2.classicAddress,
          },
        })

      assert.equal(
        // @ts-expect-error: Known issue with unknown object type
        ledgerEntryResponse.result.node.MPTAmount,
        '9223372036854775807',
      )

      // actual test - clawback
      const clawTx: Clawback = {
        TransactionType: 'Clawback',
        Account: testContext.wallet.classicAddress,
        Amount: {
          mpt_issuance_id: mptID!,
          value: '500',
        },
        Holder: wallet2.classicAddress,
      }
      await testTransaction(testContext.client, clawTx, testContext.wallet)

      ledgerEntryResponse = await testContext.client.request({
        command: 'ledger_entry',
        mptoken: {
          mpt_issuance_id: mptID!,
          account: wallet2.classicAddress,
        },
      })

      assert.equal(
        // @ts-expect-error: Known issue with unknown object type
        ledgerEntryResponse.result.node.MPTAmount,
        '9223372036854775307',
      )
    },
    TIMEOUT,
  )
})
