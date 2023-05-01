import { assert } from 'chai'
import { encode } from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import {
  SignerListSet,
  Wallet,
  XChainAddAccountCreateAttestation,
  XChainBridge,
  XChainCreateBridge,
  xrpToDrops,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { GENESIS_ACCOUNT, testTransaction } from '../utils'

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

      const destination = Wallet.generate()
      const otherChainSource = Wallet.generate()

      const attestationToSign = {
        XChainBridge: xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: xrpToDrops(300),
        AttestationRewardAccount: witnessWallet.classicAddress,
        WasLockingChainSend: 0,
        XChainAccountCreateCount: 1,
        Destination: destination.classicAddress,
        SignatureReward: signatureReward,
      }
      const encodedAttestation = encode(attestationToSign)
      const attestationSignature = sign(
        encodedAttestation,
        witnessWallet.privateKey,
      )

      const tx: XChainAddAccountCreateAttestation = {
        TransactionType: 'XChainAddAccountCreateAttestation',
        Account: testContext.wallet.classicAddress,
        XChainBridge: xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: xrpToDrops(300),
        WasLockingChainSend: 0,
        XChainAccountCreateCount: 1,
        Destination: destination.classicAddress,
        SignatureReward: signatureReward,
        PublicKey: witnessWallet.publicKey,
        Signature: attestationSignature,
        AttestationRewardAccount: witnessWallet.classicAddress,
        AttestationSignerAccount: witnessWallet.classicAddress,
      }
      await testTransaction(testContext.client, tx, testContext.wallet)

      // should not throw
      await testContext.client.request({
        command: 'account_info',
        account: destination.classicAddress,
      })
    },
    TIMEOUT,
  )
})
