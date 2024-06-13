/* eslint-disable max-statements -- necessary because transfers require a lot of steps */
import { assert } from 'chai'
import { encode } from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import {
  AccountSet,
  AccountSetAsfFlags,
  IssuedCurrency,
  IssuedCurrencyAmount,
  SignerListSet,
  TrustSet,
  Wallet,
  XChainAddClaimAttestation,
  XChainBridge,
  XChainCreateBridge,
  XChainCreateClaimID,
  xrpToDrops,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupBridge,
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import {
  generateFundedWallet,
  getIOUBalance,
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
      const { xchainBridge, witness, signatureReward } = await setupBridge(
        testContext.client,
      )
      const otherChainSource = Wallet.generate()
      const amount = xrpToDrops(10)

      const claimIdTx: XChainCreateClaimID = {
        TransactionType: 'XChainCreateClaimID',
        Account: testContext.wallet.classicAddress,
        XChainBridge: xchainBridge,
        SignatureReward: signatureReward,
        OtherChainSource: otherChainSource.classicAddress,
      }
      await testTransaction(testContext.client, claimIdTx, testContext.wallet)

      const initialBalance = Number(
        await getXRPBalance(testContext.client, testContext.wallet),
      )

      const attestationToSign = {
        XChainBridge: xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: amount,
        AttestationRewardAccount: witness.classicAddress,
        WasLockingChainSend: 0,
        XChainClaimID: 1,
        Destination: testContext.wallet.classicAddress,
      }
      const encodedAttestation = encode(attestationToSign)
      const attestationSignature = sign(encodedAttestation, witness.privateKey)

      const tx: XChainAddClaimAttestation = {
        TransactionType: 'XChainAddClaimAttestation',
        Account: witness.classicAddress,
        XChainBridge: xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: amount,
        WasLockingChainSend: 0,
        XChainClaimID: 1,
        Destination: testContext.wallet.classicAddress,
        PublicKey: witness.publicKey,
        Signature: attestationSignature,
        AttestationRewardAccount: witness.classicAddress,
        AttestationSignerAccount: witness.classicAddress,
      }
      await testTransaction(testContext.client, tx, witness)

      const finalBalance = Number(
        await getXRPBalance(testContext.client, testContext.wallet),
      )
      assert.equal(
        finalBalance,
        initialBalance + Number(amount) - Number(signatureReward),
        'The destination balance should go up by the amount transferred',
      )
    },
    TIMEOUT,
  )

  it(
    'IOU',
    async () => {
      const witness = await generateFundedWallet(testContext.client)
      // we are on the "issuing chain" for this test
      const lockingDoor = Wallet.generate()
      const issuer = Wallet.generate()

      // set default rippling
      const defaultRipplingTx: AccountSet = {
        TransactionType: 'AccountSet',
        Account: testContext.wallet.classicAddress,
        SetFlag: AccountSetAsfFlags.asfDefaultRipple,
      }
      await testTransaction(
        testContext.client,
        defaultRipplingTx,
        testContext.wallet,
      )

      const destination = await generateFundedWallet(testContext.client)

      const trustlineTx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: destination.classicAddress,
        LimitAmount: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
          value: '1000000000',
        },
      }
      await testTransaction(testContext.client, trustlineTx, destination)

      const signatureReward = '200'
      const xchainBridge: XChainBridge = {
        LockingChainDoor: lockingDoor.classicAddress,
        LockingChainIssue: {
          currency: 'USD',
          issuer: issuer.classicAddress,
        },
        IssuingChainDoor: testContext.wallet.classicAddress,
        IssuingChainIssue: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
        },
      }
      const setupTx: XChainCreateBridge = {
        TransactionType: 'XChainCreateBridge',
        Account: testContext.wallet.classicAddress,
        XChainBridge: xchainBridge,
        SignatureReward: signatureReward,
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

      const signerTx: SignerListSet = {
        TransactionType: 'SignerListSet',
        Account: testContext.wallet.classicAddress,
        SignerEntries: [
          {
            SignerEntry: {
              Account: witness.classicAddress,
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
      const signerListInfo = signerAccountInfoResponse.result.signer_lists?.[0]
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

      const otherChainSource = Wallet.generate()
      const amount: IssuedCurrencyAmount = {
        currency: 'USD',
        issuer: issuer.classicAddress,
        value: '10',
      }

      const claimIdTx: XChainCreateClaimID = {
        TransactionType: 'XChainCreateClaimID',
        Account: destination.classicAddress,
        XChainBridge: xchainBridge,
        SignatureReward: signatureReward,
        OtherChainSource: otherChainSource.classicAddress,
      }
      await testTransaction(testContext.client, claimIdTx, destination)

      const initialBalance = Number(
        await getIOUBalance(
          testContext.client,
          destination,
          xchainBridge.IssuingChainIssue as IssuedCurrency,
        ),
      )

      const attestationToSign = {
        XChainBridge: xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: amount,
        AttestationRewardAccount: witness.classicAddress,
        WasLockingChainSend: 1,
        XChainClaimID: 1,
        Destination: destination.classicAddress,
      }
      const encodedAttestation = encode(attestationToSign)
      const attestationSignature = sign(encodedAttestation, witness.privateKey)

      const tx: XChainAddClaimAttestation = {
        TransactionType: 'XChainAddClaimAttestation',
        Account: witness.classicAddress,
        XChainBridge: xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: amount,
        WasLockingChainSend: 1,
        XChainClaimID: 1,
        Destination: destination.classicAddress,
        PublicKey: witness.publicKey,
        Signature: attestationSignature,
        AttestationRewardAccount: witness.classicAddress,
        AttestationSignerAccount: witness.classicAddress,
      }
      await testTransaction(testContext.client, tx, witness)

      const finalBalance = Number(
        await getIOUBalance(
          testContext.client,
          destination,
          xchainBridge.IssuingChainIssue as IssuedCurrency,
        ),
      )
      assert.equal(
        finalBalance,
        initialBalance + Number(amount.value),
        'The destination balance should go up by the amount transferred',
      )
    },
    TIMEOUT,
  )
})
