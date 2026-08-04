import { stringToHex } from '@xrplf/isomorphic/utils'
import { decryptAmount } from '@xrplf/mpt-crypto'
import { assert } from 'chai'

import { AccountSetAsfFlags, type Payment, Wallet } from '../../../src'
import {
  deriveConfidentialKeypair,
  fetchMPToken,
  prepareConfidentialConvert,
  prepareConfidentialMergeInbox,
  prepareConfidentialSend,
  type ConfidentialKeypair,
} from '../../../src/confidential'
import {
  authorizeHolder,
  createConfidentialIssuance,
  getSpendable,
  holderWithBalance,
  lockHolder,
  registerHolderKey,
  setupConfidentialClient,
  setupHolder,
  teardownConfidential,
  type ConfidentialContext,
} from '../confidentialMPTUtils'
import serverUrl from '../serverUrl'
import { generateFundedWallet, testTransaction } from '../utils'

const SETUP_TIMEOUT = 60000
const TIMEOUT = 120000

describe('ConfidentialMPTSend', function () {
  let testContext: ConfidentialContext
  let issuer: Wallet
  let issuerKey: ConfidentialKeypair
  let mptID: string

  beforeAll(async () => {
    testContext = await setupConfidentialClient(serverUrl)
    issuer = await generateFundedWallet(testContext.client)
    issuerKey = deriveConfidentialKeypair()
    mptID = await createConfidentialIssuance(
      testContext.client,
      issuer,
      issuerKey,
    )
  }, SETUP_TIMEOUT)

  afterAll(async () => teardownConfidential(testContext))

  it(
    'transfers a confidential amount into the destination inbox',
    async () => {
      const sender = await holderWithBalance(
        testContext.client,
        issuer,
        mptID,
        1000n,
      )
      const dest = await registerHolderKey(testContext.client, mptID)

      await testTransaction(
        testContext.client,
        await prepareConfidentialSend(testContext.client, {
          account: sender.wallet.classicAddress,
          destination: dest.wallet.classicAddress,
          amount: 300n,
          senderKeypair: sender.key,
          mptIssuanceID: mptID,
        }),
        sender.wallet,
      )

      assert.strictEqual(
        await getSpendable(testContext.client, sender, mptID),
        700n,
        'sender balance is reduced by the sent amount',
      )

      const destToken = await fetchMPToken(
        testContext.client,
        dest.wallet.classicAddress,
        mptID,
      )
      assert.isString(destToken.ConfidentialBalanceInbox)
      assert.strictEqual(
        await decryptAmount(
          destToken.ConfidentialBalanceInbox as string,
          dest.key.privateKey,
        ),
        300n,
        'destination inbox received the sent amount',
      )
    },
    TIMEOUT,
  )

  it(
    'sends confidentially to a deposit-auth destination using CredentialIDs',
    async () => {
      const credentialType = stringToHex('confidential-mpt-kyc')
      const sender = await holderWithBalance(
        testContext.client,
        issuer,
        mptID,
        1000n,
      )
      const dest = await registerHolderKey(testContext.client, mptID)

      // The destination only accepts deposits backed by an issuer-granted
      // credential — a send without a matching CredentialIDs would be rejected.
      await testTransaction(
        testContext.client,
        {
          TransactionType: 'AccountSet',
          Account: dest.wallet.classicAddress,
          SetFlag: AccountSetAsfFlags.asfDepositAuth,
        },
        dest.wallet,
      )
      await testTransaction(
        testContext.client,
        {
          TransactionType: 'CredentialCreate',
          Account: issuer.classicAddress,
          Subject: sender.wallet.classicAddress,
          CredentialType: credentialType,
        },
        issuer,
      )
      await testTransaction(
        testContext.client,
        {
          TransactionType: 'CredentialAccept',
          Account: sender.wallet.classicAddress,
          Issuer: issuer.classicAddress,
          CredentialType: credentialType,
        },
        sender.wallet,
      )
      await testTransaction(
        testContext.client,
        {
          TransactionType: 'DepositPreauth',
          Account: dest.wallet.classicAddress,
          AuthorizeCredentials: [
            {
              Credential: {
                Issuer: issuer.classicAddress,
                CredentialType: credentialType,
              },
            },
          ],
        },
        dest.wallet,
      )

      const credentials = await testContext.client.request({
        command: 'account_objects',
        account: sender.wallet.classicAddress,
        type: 'credential',
      })
      const credentialID = credentials.result.account_objects[0].index

      await testTransaction(
        testContext.client,
        await prepareConfidentialSend(testContext.client, {
          account: sender.wallet.classicAddress,
          destination: dest.wallet.classicAddress,
          amount: 200n,
          senderKeypair: sender.key,
          mptIssuanceID: mptID,
          credentialIDs: [credentialID],
        }),
        sender.wallet,
      )

      const destToken = await fetchMPToken(
        testContext.client,
        dest.wallet.classicAddress,
        mptID,
      )
      assert.strictEqual(
        await decryptAmount(
          destToken.ConfidentialBalanceInbox as string,
          dest.key.privateKey,
        ),
        200n,
        'credentialed send reached the destination inbox',
      )
    },
    TIMEOUT,
  )

  it(
    'rejects a confidential send to an unauthorized destination (RequireAuth)',
    async () => {
      const authMptID = await createConfidentialIssuance(
        testContext.client,
        issuer,
        issuerKey,
        undefined,
        true,
      )

      // The sender must be issuer-authorized before it can hold a balance.
      const sender = await setupHolder(testContext.client, authMptID)
      await authorizeHolder(
        testContext.client,
        issuer,
        sender.wallet.classicAddress,
        authMptID,
      )
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: issuer.classicAddress,
        Destination: sender.wallet.classicAddress,
        Amount: { mpt_issuance_id: authMptID, value: '1000' },
      }
      await testTransaction(testContext.client, payment, issuer)
      await testTransaction(
        testContext.client,
        await prepareConfidentialConvert(testContext.client, {
          account: sender.wallet.classicAddress,
          amount: 1000n,
          holderKeypair: sender.key,
          mptIssuanceID: authMptID,
        }),
        sender.wallet,
      )
      await testTransaction(
        testContext.client,
        await prepareConfidentialMergeInbox(testContext.client, {
          account: sender.wallet.classicAddress,
          mptIssuanceID: authMptID,
        }),
        sender.wallet,
      )

      // A holder must be authorized to register its key, so authorize the
      // destination, let it register, then have the issuer revoke authorization
      // — leaving a registered-but-unauthorized destination for the send.
      const dest = await setupHolder(testContext.client, authMptID)
      await authorizeHolder(
        testContext.client,
        issuer,
        dest.wallet.classicAddress,
        authMptID,
      )
      await testTransaction(
        testContext.client,
        await prepareConfidentialConvert(testContext.client, {
          account: dest.wallet.classicAddress,
          amount: 0n,
          holderKeypair: dest.key,
          mptIssuanceID: authMptID,
        }),
        dest.wallet,
      )
      await testTransaction(
        testContext.client,
        {
          TransactionType: 'MPTokenAuthorize',
          Account: issuer.classicAddress,
          MPTokenIssuanceID: authMptID,
          Holder: dest.wallet.classicAddress,
          Flags: { tfMPTUnauthorize: true },
        },
        issuer,
      )

      await testTransaction(
        testContext.client,
        await prepareConfidentialSend(testContext.client, {
          account: sender.wallet.classicAddress,
          destination: dest.wallet.classicAddress,
          amount: 100n,
          senderKeypair: sender.key,
          mptIssuanceID: authMptID,
        }),
        sender.wallet,
        undefined,
        'tecNO_AUTH',
      )
    },
    TIMEOUT,
  )

  it(
    'rejects a confidential send from a locked holder (tecLOCKED)',
    async () => {
      const sender = await holderWithBalance(
        testContext.client,
        issuer,
        mptID,
        1000n,
      )
      const dest = await registerHolderKey(testContext.client, mptID)
      await lockHolder(
        testContext.client,
        issuer,
        sender.wallet.classicAddress,
        mptID,
      )

      await testTransaction(
        testContext.client,
        await prepareConfidentialSend(testContext.client, {
          account: sender.wallet.classicAddress,
          destination: dest.wallet.classicAddress,
          amount: 100n,
          senderKeypair: sender.key,
          mptIssuanceID: mptID,
        }),
        sender.wallet,
        undefined,
        'tecLOCKED',
      )
    },
    TIMEOUT,
  )
})
