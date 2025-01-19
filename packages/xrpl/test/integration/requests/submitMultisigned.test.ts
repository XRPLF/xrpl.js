import { assert } from 'chai'
import { decode } from 'ripple-binary-codec'

import {
  AccountSet,
  Client,
  SignerListSet,
  Transaction,
  SubmitMultisignedResponse,
  hashes,
  SubmitMultisignedRequest,
  SubmitMultisignedV1Response,
} from '../../../src'
import { convertStringToHex } from '../../../src/utils'
import { multisign } from '../../../src/Wallet/signer'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import {
  generateFundedWallet,
  ledgerAccept,
  testTransaction,
  verifySubmittedTransaction,
} from '../utils'

// how long before each test case times out
const TIMEOUT = 20000
const { hashSignedTx } = hashes

describe('submit_multisigned', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'submit_multisigned transaction',
    async () => {
      const client: Client = testContext.client
      const signerWallet1 = await generateFundedWallet(testContext.client)
      const signerWallet2 = await generateFundedWallet(testContext.client)

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
      const signed1 = signerWallet1.sign(accountSetTx, true)
      const signed2 = signerWallet2.sign(accountSetTx, true)
      const multisigned = multisign([signed1.tx_blob, signed2.tx_blob])
      const submitResponse = await client.request({
        command: 'submit_multisigned',
        tx_json: decode(multisigned) as unknown as Transaction,
      })
      await ledgerAccept(client)
      assert.strictEqual(submitResponse.result.engine_result, 'tesSUCCESS')
      await verifySubmittedTransaction(testContext.client, multisigned)

      const expectedResponse: SubmitMultisignedResponse = {
        api_version: 2,
        id: submitResponse.id,
        type: 'response',
        result: {
          engine_result: 'tesSUCCESS',
          engine_result_code: 0,
          engine_result_message:
            'The transaction was applied. Only final in a validated ledger.',
          tx_blob: multisigned,
          tx_json: {
            ...(decode(multisigned) as unknown as Transaction),
          },
          hash: hashSignedTx(multisigned),
        },
      }

      assert.deepEqual(submitResponse, expectedResponse)
    },
    TIMEOUT,
  )

  it(
    'submit_multisigned transaction using api_version 1',
    async () => {
      const client: Client = testContext.client
      const signerWallet1 = await generateFundedWallet(testContext.client)
      const signerWallet2 = await generateFundedWallet(testContext.client)

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
      const signed1 = signerWallet1.sign(accountSetTx, true)
      const signed2 = signerWallet2.sign(accountSetTx, true)
      const multisigned = multisign([signed1.tx_blob, signed2.tx_blob])
      const submitResponse = await client.request<SubmitMultisignedRequest, 1>({
        command: 'submit_multisigned',
        tx_json: decode(multisigned) as unknown as Transaction,
        api_version: 1,
      })
      await ledgerAccept(client)
      assert.strictEqual(submitResponse.result.engine_result, 'tesSUCCESS')
      await verifySubmittedTransaction(testContext.client, multisigned)

      const expectedResponse: SubmitMultisignedV1Response = {
        api_version: 1,
        id: submitResponse.id,
        type: 'response',
        result: {
          engine_result: 'tesSUCCESS',
          engine_result_code: 0,
          engine_result_message:
            'The transaction was applied. Only final in a validated ledger.',
          tx_blob: multisigned,
          tx_json: {
            ...(decode(multisigned) as unknown as Transaction),
            hash: hashSignedTx(multisigned),
          },
        },
      }

      assert.deepEqual(submitResponse, expectedResponse)
    },
    TIMEOUT,
  )
})
