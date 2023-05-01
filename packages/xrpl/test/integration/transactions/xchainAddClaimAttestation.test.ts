/* eslint-disable max-statements -- necessary because transfers require a lot of steps */
import { assert } from 'chai'
import { encode } from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import {
  SignerListSet,
  Wallet,
  XChainAddClaimAttestation,
  XChainBridge,
  XChainCreateBridge,
  XChainCreateClaimID,
  xrpToDrops,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import {
  generateFundedWallet,
  GENESIS_ACCOUNT,
  testTransaction,
} from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('XChainCreateBridge', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const signatureReward = '200'
      const xchainBridge: XChainBridge = {
        LockingChainDoor: testContext.wallet.classicAddress,
        LockingChainIssue: { currency: 'XRP' },
        IssuingChainDoor: GENESIS_ACCOUNT,
        IssuingChainIssue: { currency: 'XRP' },
      }
      const setupTx: XChainCreateBridge = {
        TransactionType: 'XChainCreateBridge',
        Account: testContext.wallet.classicAddress,
        XChainBridge: xchainBridge,
        SignatureReward: signatureReward,
        MinAccountCreateAmount: '10000000',
      }

      await testTransaction(testContext.client, setupTx, testContext.wallet)

      // confirm that the transaction actually went through
      const accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'bridge',
      })
      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        1,
        'Should be exactly one bridge owned by the account',
      )

      const witnessWallet = Wallet.generate()

      const signerTx: SignerListSet = {
        TransactionType: 'SignerListSet',
        Account: testContext.wallet.classicAddress,
        SignerEntries: [
          {
            SignerEntry: {
              Account: witnessWallet.classicAddress,
              SignerWeight: 1,
            },
          },
        ],
        SignerQuorum: 1,
      }
      await testTransaction(testContext.client, signerTx, testContext.wallet)

      const signerAccountInfoResponse = await testContext.client.request({
        command: 'account_info',
        account: testContext.wallet.classicAddress,
        signer_lists: true,
      })
      const signerListInfo =
        signerAccountInfoResponse.result.account_data.signer_lists?.[0]
      assert.deepEqual(
        signerListInfo?.SignerEntries,
        signerTx.SignerEntries,
        'SignerEntries were not set properly',
      )
      assert.equal(
        signerListInfo?.SignerQuorum,
        signerTx.SignerQuorum,
        'SignerQuorum was not set properly',
      )

      const destination = await generateFundedWallet(testContext.client)
      const otherChainSource = Wallet.generate()
      const amount = xrpToDrops(10)

      const claimIdTx: XChainCreateClaimID = {
        TransactionType: 'XChainCreateClaimID',
        Account: destination.classicAddress,
        XChainBridge: xchainBridge,
        SignatureReward: signatureReward,
        OtherChainSource: otherChainSource.classicAddress,
      }
      await testTransaction(testContext.client, claimIdTx, destination)
      const accountInfoResponse = await testContext.client.request({
        command: 'account_info',
        account: destination.classicAddress,
      })
      const initialBalance = Number(
        accountInfoResponse.result.account_data.Balance,
      )

      const attestationToSign = {
        XChainBridge: xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: amount,
        AttestationRewardAccount: witnessWallet.classicAddress,
        WasLockingChainSend: 0,
        XChainClaimID: 1,
        Destination: destination.classicAddress,
      }
      const encodedAttestation = encode(attestationToSign)
      const attestationSignature = sign(
        encodedAttestation,
        witnessWallet.privateKey,
      )

      const tx: XChainAddClaimAttestation = {
        TransactionType: 'XChainAddClaimAttestation',
        Account: testContext.wallet.classicAddress,
        XChainBridge: xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: amount,
        WasLockingChainSend: 0,
        XChainClaimID: 1,
        Destination: destination.classicAddress,
        PublicKey: witnessWallet.publicKey,
        Signature: attestationSignature,
        AttestationRewardAccount: witnessWallet.classicAddress,
        AttestationSignerAccount: witnessWallet.classicAddress,
      }
      await testTransaction(testContext.client, tx, testContext.wallet)

      const accountInfoResponse2 = await testContext.client.request({
        command: 'account_info',
        account: destination.classicAddress,
      })
      const finalBalance = Number(
        accountInfoResponse2.result.account_data.Balance,
      )
      assert.equal(
        initialBalance + Number(amount),
        finalBalance,
        "The bridge door's balance should go up by the amount committed",
      )
    },
    TIMEOUT,
  )
})
