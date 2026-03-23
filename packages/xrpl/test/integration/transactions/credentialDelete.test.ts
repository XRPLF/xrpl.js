import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import {
  AccountObjectsResponse,
  CredentialAccept,
  CredentialCreate,
} from '../../../src'
import { CredentialDelete } from '../../../src/models/transactions/CredentialDelete'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

describe('CredentialDelete', function () {
  // testContext wallet acts as issuer in this test
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => teardownClient(testContext))

  it('base', async function () {
    const subjectWallet = await generateFundedWallet(testContext.client)

    const credentialCreateTx: CredentialCreate = {
      TransactionType: 'CredentialCreate',
      Account: testContext.wallet.classicAddress,
      Subject: subjectWallet.classicAddress,
      CredentialType: stringToHex('Test Credential Type'),
    }

    await testTransaction(
      testContext.client,
      credentialCreateTx,
      testContext.wallet,
    )

    const createAccountObjectsResponse: AccountObjectsResponse =
      await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'credential',
      })

    assert.equal(createAccountObjectsResponse.result.account_objects.length, 1)

    const credentialAcceptTx: CredentialAccept = {
      TransactionType: 'CredentialAccept',
      Account: subjectWallet.classicAddress,
      Issuer: testContext.wallet.classicAddress,
      CredentialType: stringToHex('Test Credential Type'),
    }

    await testTransaction(testContext.client, credentialAcceptTx, subjectWallet)

    // Credential is now an object in recipient's wallet after accept
    const acceptAccountObjectsResponse: AccountObjectsResponse =
      await testContext.client.request({
        command: 'account_objects',
        account: subjectWallet.classicAddress,
        type: 'credential',
      })

    assert.equal(acceptAccountObjectsResponse.result.account_objects.length, 1)

    const credentialDeleteTx: CredentialDelete = {
      TransactionType: 'CredentialDelete',
      Account: subjectWallet.classicAddress,
      Issuer: testContext.wallet.classicAddress,
      CredentialType: stringToHex('Test Credential Type'),
    }

    await testTransaction(testContext.client, credentialDeleteTx, subjectWallet)

    // Check both issuer and subject no longer have a credential tied to the account
    const SubjectAccountObjectsDeleteResponse: AccountObjectsResponse =
      await testContext.client.request({
        command: 'account_objects',
        account: subjectWallet.classicAddress,
        type: 'credential',
      })

    assert.equal(
      SubjectAccountObjectsDeleteResponse.result.account_objects.length,
      0,
    )

    const IssuerAccountObjectsDeleteResponse: AccountObjectsResponse =
      await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'credential',
      })

    assert.equal(
      IssuerAccountObjectsDeleteResponse.result.account_objects.length,
      0,
    )
  })
})
