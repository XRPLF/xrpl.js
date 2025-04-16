import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import { AccountObjectsResponse, CredentialCreate } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

describe('CredentialCreate', function () {
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

    // Unaccepted credential still belongs to issuer's account
    const accountObjectsResponse: AccountObjectsResponse =
      await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'credential',
      })
    const { account_objects } = accountObjectsResponse.result

    assert.equal(account_objects.length, 1)
  })
})
