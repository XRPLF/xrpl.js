import assert from 'assert'

import _ from 'lodash'
import { XrplDefinitions } from 'ripple-binary-codec'

import { Amount, Client, RippledError, SubmitResponse } from '../../src'
import {
  AccountSet,
  BaseTransaction,
  Payment,
  SignerListSet,
} from '../../src/models/transactions'
import { convertStringToHex } from '../../src/utils'
import { multisign } from '../../src/Wallet/signer'
import * as newPaymentDefinitions from '../fixtures/rippled/definitions-with-massively-diff-payment.json'
import * as newTxDefinitions from '../fixtures/rippled/definitions-with-new-tx-type.json'
import { assertRejects } from '../testUtils'

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

  it('submitting an invalid transaction with proper custom types should send, but be rejected by rippled', async function () {
    const client: Client = this.client
    const wallet1 = await generateFundedWallet(client)
    const tx: Payment = {
      TransactionType: 'Payment',
      Account: wallet1.address,
      Destination: 'rQ3PTWGLCbPz8ZCicV5tCX3xuymojTng5r',
      Amount: '20000000',
      Sequence: 1,
      Fee: '12',
    }

    const newDefs = new XrplDefinitions(newPaymentDefinitions)

    // It should successfully submit, but fail once rippled sees it since the new type definition is not on-ledger.
    await assertRejects(
      client.submit(tx, {
        wallet: wallet1,
        definitions: newDefs,
      }),
      RippledError,
      'invalidTransaction',
    )

    // Same for submitAndWait
    await assertRejects(
      client.submitAndWait(tx, {
        wallet: wallet1,
        definitions: newDefs,
      }),
      RippledError,
      'invalidTransaction',
    )
  })

  it('Defining a new TransactionType should compile and run', async function () {
    const newDefs = new XrplDefinitions(newTxDefinitions)

    const client: Client = this.client
    const wallet1 = await generateFundedWallet(client)

    interface NewTx extends BaseTransaction {
      Amount: Amount
    }

    const tx: NewTx = {
      TransactionType: 'NewTx',
      Account: wallet1.address,
      Amount: '100',
    }

    client.fundWallet()

    await assertRejects(
      client.submitAndWait(tx, {
        wallet: wallet1,
        definitions: newDefs,
      }),
      RippledError,
      'invalidTransaction',
    )
  })
})
