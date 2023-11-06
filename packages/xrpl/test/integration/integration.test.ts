import { assert } from 'chai'

import { Client, SubmitResponse } from '../../src'
import { AccountSet, SignerListSet } from '../../src/models/transactions'
import { convertStringToHex } from '../../src/utils'
import { multisign } from '../../src/Wallet/signer'

import serverUrl from './serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from './setup'
import {
  generateFundedWallet,
  ledgerAccept,
  testTransaction,
  verifySubmittedTransaction,
} from './utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('integration tests', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'isConnected',
    () => {
      assert(testContext.client.isConnected())
    },
    TIMEOUT,
  )

  it(
    'submit multisigned transaction',
    async () => {
      const client: Client = testContext.client
      const signerWallet1 = await generateFundedWallet(client)
      const signerWallet2 = await generateFundedWallet(client)

      // set up the multisigners for the account
      const signerListSet: SignerListSet = {
        TransactionType: 'SignerListSet',
        Account: testContext.wallet.classicAddress,
        SignerEntries: [
          {
            SignerEntry: {
              Account: signerWallet1.classicAddress,
              SignerWeight: 1,
            },
          },
          {
            SignerEntry: {
              Account: signerWallet2.classicAddress,
              SignerWeight: 1,
            },
          },
        ],
        SignerQuorum: 2,
      }
      await testTransaction(
        testContext.client,
        signerListSet,
        testContext.wallet,
      )

      // try to multisign
      const accountSet: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        Domain: convertStringToHex('example.com'),
      }
      const accountSetTx = await client.autofill(accountSet, 2)
      const { tx_blob: tx_blob1 } = signerWallet1.sign(accountSetTx, true)
      const { tx_blob: tx_blob2 } = signerWallet2.sign(accountSetTx, true)
      const multisignedTx = multisign([tx_blob1, tx_blob2])

      let response: SubmitResponse = await client.submit(multisignedTx)
      await ledgerAccept(client)
      let retryCount = 20

      // Retry if another transaction finished before this one
      while (
        ['tefPAST_SEQ', 'tefMAX_LEDGER'].includes(
          response.result.engine_result,
        ) &&
        retryCount > 0
      ) {
        retryCount -= 1
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return -- We are waiting on retries
        await new Promise((resolve) => setTimeout(resolve, 1000))
        // eslint-disable-next-line no-await-in-loop -- We are retrying in a loop on purpose
        response = await client.submit(multisignedTx)
        // eslint-disable-next-line no-await-in-loop -- We are retrying in a loop on purpose
        await ledgerAccept(client)
      }

      assert.strictEqual(response.result.engine_result, 'tesSUCCESS')
      await verifySubmittedTransaction(testContext.client, multisignedTx)
    },
    TIMEOUT,
  )
})
