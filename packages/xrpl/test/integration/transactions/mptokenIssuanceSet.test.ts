import { assert } from 'chai'

import {
  MPTokenIssuanceCreate,
  MPTokenIssuanceSet,
  MPTokenIssuanceCreateFlags,
  MPTokenIssuanceSetFlags,
  TransactionMetadata,
  MPTokenIssuanceCreateMutableFlags,
  MPTokenIssuanceSetMutableFlags,
  parseMPTokenIssuanceFlags,
  parseMPTokenIssuanceMutableFlags,
} from '../../../src'
import type { MPTokenIssuance } from '../../../src/models/ledger/MPTokenIssuance'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('MPTokenIssuanceDestroy', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        Flags: MPTokenIssuanceCreateFlags.tfMPTCanLock,
      }

      const mptCreateRes = await testTransaction(
        testContext.client,
        createTx,
        testContext.wallet,
      )

      const txHash = mptCreateRes.result.tx_json.hash

      const txResponse = await testContext.client.request({
        command: 'tx',
        transaction: txHash,
      })

      const meta = txResponse.result
        .meta as TransactionMetadata<MPTokenIssuanceCreate>

      const mptID = meta.mpt_issuance_id

      const accountObjectsResponse = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'mpt_issuance',
      })
      assert.lengthOf(
        accountObjectsResponse.result.account_objects,
        1,
        'Should be exactly one issuance on the ledger',
      )

      const setTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: mptID!,
        Flags: MPTokenIssuanceSetFlags.tfMPTLock,
      }

      await testTransaction(testContext.client, setTx, testContext.wallet)
    },
    TIMEOUT,
  )

  it(
    'Test Mutability of Flags as per Dynamic MPT (XLS-94D) amendment',
    async () => {
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        Flags: MPTokenIssuanceCreateFlags.tfMPTCanTransfer,
        MutableFlags:
          MPTokenIssuanceCreateMutableFlags.tmfMPTCanMutateTransferFee +
          MPTokenIssuanceCreateMutableFlags.tmfMPTCanMutateCanTransfer,
      }

      const mptCreateRes = await testTransaction(
        testContext.client,
        createTx,
        testContext.wallet,
      )

      const txHash = mptCreateRes.result.tx_json.hash

      const txResponse = await testContext.client.request({
        command: 'tx',
        transaction: txHash,
      })

      const meta = txResponse.result
        .meta as TransactionMetadata<MPTokenIssuanceCreate>

      const mptID = meta.mpt_issuance_id

      const setTransferFeeTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: mptID!,
        // set the transfer fee to a non-zero value
        TransferFee: 200,
      }

      await testTransaction(
        testContext.client,
        setTransferFeeTx,
        testContext.wallet,
      )

      // remove the ability to transfer the MPT
      const clearTransferFlagTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: mptID!,
        MutableFlags: MPTokenIssuanceSetMutableFlags.tmfMPTClearCanTransfer,
      }

      await testTransaction(
        testContext.client,
        clearTransferFlagTx,
        testContext.wallet,
      )
    },
    TIMEOUT,
  )

  it(
    'parsed lsf*/lsmf* flag views reflect mutations applied via MPTokenIssuanceSet',
    async () => {
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        MutableFlags: MPTokenIssuanceCreateMutableFlags.tmfMPTCanMutateCanLock,
      }

      const createSubmitResponse = await testTransaction(
        testContext.client,
        createTx,
        testContext.wallet,
      )
      const createTxResponse = await testContext.client.request({
        command: 'tx',
        transaction: createSubmitResponse.result.tx_json.hash,
      })
      const createMeta = createTxResponse.result
        .meta as TransactionMetadata<MPTokenIssuanceCreate>
      const issuanceId = createMeta.mpt_issuance_id
      assert.isString(issuanceId, 'Create did not return an mpt_issuance_id')

      const issuanceBeforeSet = await readMPTokenIssuance(
        testContext,
        issuanceId!,
      )
      const parsedReadOnlyFlagsBeforeSet = parseMPTokenIssuanceFlags(
        issuanceBeforeSet.Flags,
      )
      const parsedMutableFlagsBeforeSet = parseMPTokenIssuanceMutableFlags(
        issuanceBeforeSet.MutableFlags,
      )

      assert.isUndefined(
        parsedReadOnlyFlagsBeforeSet.lsfMPTCanLock,
        'lsfMPTCanLock should not be set on a freshly-created MPT issuance',
      )
      assert.isTrue(
        parsedMutableFlagsBeforeSet.lsmfMPTCanMutateCanLock,
        'lsmfMPTCanMutateCanLock should reflect the create-time tmfMPTCanMutateCanLock',
      )

      const enableCanLockTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId!,
        MutableFlags: MPTokenIssuanceSetMutableFlags.tmfMPTSetCanLock,
      }
      await testTransaction(
        testContext.client,
        enableCanLockTx,
        testContext.wallet,
      )

      const issuanceAfterEnable = await readMPTokenIssuance(
        testContext,
        issuanceId!,
      )
      const parsedReadOnlyFlagsAfterEnable = parseMPTokenIssuanceFlags(
        issuanceAfterEnable.Flags,
      )
      const parsedMutableFlagsAfterEnable = parseMPTokenIssuanceMutableFlags(
        issuanceAfterEnable.MutableFlags,
      )

      assert.isTrue(
        parsedReadOnlyFlagsAfterEnable.lsfMPTCanLock,
        'lsfMPTCanLock should be set after applying tmfMPTSetCanLock',
      )
      assert.isTrue(
        parsedMutableFlagsAfterEnable.lsmfMPTCanMutateCanLock,
        'lsmfMPTCanMutateCanLock should remain set; mutability is not consumed by toggling',
      )

      const disableCanLockTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId!,
        MutableFlags: MPTokenIssuanceSetMutableFlags.tmfMPTClearCanLock,
      }
      await testTransaction(
        testContext.client,
        disableCanLockTx,
        testContext.wallet,
      )

      const issuanceAfterDisable = await readMPTokenIssuance(
        testContext,
        issuanceId!,
      )
      const parsedReadOnlyFlagsAfterDisable = parseMPTokenIssuanceFlags(
        issuanceAfterDisable.Flags,
      )

      assert.isUndefined(
        parsedReadOnlyFlagsAfterDisable.lsfMPTCanLock,
        'lsfMPTCanLock should be cleared after applying tmfMPTClearCanLock',
      )
    },
    TIMEOUT,
  )
})

async function readMPTokenIssuance(
  testContext: XrplIntegrationTestContext,
  issuanceId: string,
): Promise<MPTokenIssuance> {
  const accountObjectsResponse = await testContext.client.request({
    command: 'account_objects',
    account: testContext.wallet.classicAddress,
    type: 'mpt_issuance',
  })
  const issuanceNode = accountObjectsResponse.result.account_objects.find(
    (node) =>
      (node as { mpt_issuance_id?: string }).mpt_issuance_id === issuanceId,
  ) as MPTokenIssuance | undefined
  assert.exists(
    issuanceNode,
    `MPTokenIssuance with id ${issuanceId} not found in account_objects`,
  )
  return issuanceNode
}
