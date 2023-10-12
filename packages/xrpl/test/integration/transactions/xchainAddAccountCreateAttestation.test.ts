import { encode } from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs'

import {
  Wallet,
  XChainAddAccountCreateAttestation,
  xrpToDrops,
} from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

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
      const destination = Wallet.generate()
      const otherChainSource = Wallet.generate()

      const attestationToSign = {
        XChainBridge: testContext.bridge.xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: xrpToDrops(300),
        AttestationRewardAccount: testContext.bridge.witness.classicAddress,
        WasLockingChainSend: 0,
        XChainAccountCreateCount: 1,
        Destination: destination.classicAddress,
        SignatureReward: testContext.bridge.signatureReward,
      }
      const encodedAttestation = encode(attestationToSign)
      const attestationSignature = sign(
        encodedAttestation,
        testContext.bridge.witness.privateKey,
      )

      const tx: XChainAddAccountCreateAttestation = {
        TransactionType: 'XChainAddAccountCreateAttestation',
        Account: testContext.wallet.classicAddress,
        XChainBridge: testContext.bridge.xchainBridge,
        OtherChainSource: otherChainSource.classicAddress,
        Amount: xrpToDrops(300),
        WasLockingChainSend: 0,
        XChainAccountCreateCount: 1,
        Destination: destination.classicAddress,
        SignatureReward: testContext.bridge.signatureReward,
        PublicKey: testContext.bridge.witness.publicKey,
        Signature: attestationSignature,
        AttestationRewardAccount: testContext.bridge.witness.classicAddress,
        AttestationSignerAccount: testContext.bridge.witness.classicAddress,
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
