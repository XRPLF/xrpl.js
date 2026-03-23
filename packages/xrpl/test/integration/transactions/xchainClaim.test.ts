import { assert } from 'chai'
import { encode } from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import {
  Wallet,
  XChainAddClaimAttestation,
  XChainClaim,
  XChainCreateClaimID,
  xrpToDrops,
} from '../../../src'
import getFeeXrp from '../../../src/sugar/getFeeXrp'
import serverUrl from '../serverUrl'
import {
  setupBridge,
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, getXRPBalance, testTransaction } from '../utils'

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

      const destination = await generateFundedWallet(testContext.client)
      const otherChainSource = Wallet.generate()
      const amount = xrpToDrops(10)
      const netFee = xrpToDrops(await getFeeXrp(testContext.client))

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
        AttestationRewardAccount: witness.classicAddress,
        WasLockingChainSend: 0,
        XChainClaimID: 1,
      }
      const encodedAttestation = encode(attestationToSign)
      const attestationSignature = sign(encodedAttestation, witness.privateKey)

      const claimTx: XChainAddClaimAttestation = {
        TransactionType: 'XChainAddClaimAttestation',
        Account: witness.classicAddress,
        XChainBridge: xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: amount,
        WasLockingChainSend: 0,
        XChainClaimID: 1,
        PublicKey: witness.publicKey,
        Signature: attestationSignature,
        AttestationRewardAccount: witness.classicAddress,
        AttestationSignerAccount: witness.classicAddress,
      }
      await testTransaction(testContext.client, claimTx, witness)

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
        initialBalance +
          Number(amount) -
          Number(signatureReward) -
          Number(netFee),
        "The destination's balance should not change yet",
      )
    },
    TIMEOUT,
  )
})
