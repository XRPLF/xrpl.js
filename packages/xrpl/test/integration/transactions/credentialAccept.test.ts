import { hexToString } from '@xrplf/isomorphic/dist/utils'
import { assert } from 'chai'

import { AccountObjectsResponse } from '../../../src'
import { CredentialCreate } from '../../../src/models/transactions/CredentialCreate'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'
import { CredentialAccept } from '../../../src/models/transactions/CredentialAccept'

describe('CredentialCreate', function () {
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
      CredentialType: hexToString('Test Credential Type'),
    }

    const credentialCreateResponse = await testTransaction(
      testContext.client,
      credentialCreateTx,
      testContext.wallet,
    )

    console.log('credentialCreateResponse', credentialCreateResponse)

    const credentialAcceptTx: CredentialAccept = {
      TransactionType: 'CredentialAccept',
      Account: subjectWallet.classicAddress,
      Issuer: testContext.wallet.classicAddress,
      CredentialType: hexToString('Test Credential Type'),
    }

    const credentialAcceptResponse = await testTransaction(
      testContext.client,
      credentialAcceptTx,
      subjectWallet,
    )

    console.log('credentialAcceptResponse', credentialAcceptResponse)

    const accountObjectsResponse: AccountObjectsResponse =
      await testContext.client.request({
        command: 'account_objects',
        account: subjectWallet.classicAddress,
      })
    const { account_objects } = accountObjectsResponse.result

    assert.equal(account_objects.length, 1)
  })
})
