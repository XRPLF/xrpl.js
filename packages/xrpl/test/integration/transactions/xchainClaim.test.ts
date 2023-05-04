/* eslint-disable max-statements -- necessary because transfers require a lot of steps */
import { assert } from 'chai'
import { encode } from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import {
  SignerListSet,
  Wallet,
  XChainAddClaimAttestation,
  XChainBridge,
  XChainClaim,
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
  getXRPBalance,
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
      const signatureReward = '1000000'
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

      const witnessWallet = await generateFundedWallet(testContext.client)

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

      const initialBalance = Number(
        await getXRPBalance(testContext.client, destination),
      )

      const attestationToSign = {
        XChainBridge: xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: amount,
        AttestationRewardAccount: witnessWallet.classicAddress,
        WasLockingChainSend: 0,
        XChainClaimID: 1,
      }
      const encodedAttestation = encode(attestationToSign)
      const attestationSignature = sign(
        encodedAttestation,
        witnessWallet.privateKey,
      )

      const claimTx: XChainAddClaimAttestation = {
        TransactionType: 'XChainAddClaimAttestation',
        Account: witnessWallet.classicAddress,
        XChainBridge: xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: amount,
        WasLockingChainSend: 0,
        XChainClaimID: 1,
        PublicKey: witnessWallet.publicKey,
        Signature: attestationSignature,
        AttestationRewardAccount: witnessWallet.classicAddress,
        AttestationSignerAccount: witnessWallet.classicAddress,
      }
      await testTransaction(testContext.client, claimTx, witnessWallet)

      const intermediateBalance = Number(
        await getXRPBalance(testContext.client, destination),
      )
      assert.equal(
        initialBalance,
        intermediateBalance,
        "The destination's balance should not change yet",
      )

      const tx: XChainClaim = {
        TransactionType: 'XChainClaim',
        Account: destination.classicAddress,
        XChainBridge: xchainBridge,
        Destination: destination.classicAddress,
        XChainClaimID: 1,
        Amount: amount,
      }
      await testTransaction(testContext.client, tx, destination)

      const finalBalance = Number(
        await getXRPBalance(testContext.client, destination),
      )
      assert.equal(
        finalBalance,
        initialBalance + Number(amount) - Number(signatureReward) - 12,
        "The destination's balance should not change yet",
      )
    },
    TIMEOUT,
  )
})
