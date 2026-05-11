import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import {
  MPTokenIssuanceCreate,
  MPTokenIssuanceSet,
  MPTokenIssuanceCreateFlags,
  MPTokenIssuanceSetFlags,
  PermissionedDomainSet,
  TransactionMetadata,
  MPTokenIssuanceCreateMutableFlags,
  MPTokenIssuanceSetMutableFlags,
  parseMPTokenIssuanceFlags,
  parseMPTokenIssuanceMutableFlags,
} from '../../../src'
import type { MPTokenIssuance } from '../../../src/models/ledger/MPTokenIssuance'
import type PermissionedDomain from '../../../src/models/ledger/PermissionedDomain'
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

  it(
    'persists DomainID on the MPTokenIssuance ledger object when set at create time',
    async () => {
      const domainId = await createPermissionedDomain(testContext)

      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        Flags: MPTokenIssuanceCreateFlags.tfMPTRequireAuth,
        DomainID: domainId,
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)
      const issuance = await readMPTokenIssuance(testContext, issuanceId)

      assert.equal(issuance.DomainID, domainId)
    },
    TIMEOUT,
  )

  it(
    'updates DomainID on the MPTokenIssuance ledger object via MPTokenIssuanceSet',
    async () => {
      const firstDomainId = await createPermissionedDomain(testContext)
      const secondDomainId = await createPermissionedDomain(testContext)

      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        Flags: MPTokenIssuanceCreateFlags.tfMPTRequireAuth,
        DomainID: firstDomainId,
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)

      const changeDomainTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId,
        DomainID: secondDomainId,
      }
      await testTransaction(
        testContext.client,
        changeDomainTx,
        testContext.wallet,
      )

      const issuanceAfterChange = await readMPTokenIssuance(
        testContext,
        issuanceId,
      )
      assert.equal(issuanceAfterChange.DomainID, secondDomainId)
    },
    TIMEOUT,
  )

  it(
    'mutates MPTokenMetadata via MPTokenIssuanceSet when tmfMPTCanMutateMetadata was set at create time',
    async () => {
      const initialMetadataHex = stringToHex('initial metadata')
      const updatedMetadataHex = stringToHex('updated metadata')

      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        MutableFlags: MPTokenIssuanceCreateMutableFlags.tmfMPTCanMutateMetadata,
        MPTokenMetadata: initialMetadataHex,
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)

      const updateMetadataTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId,
        MPTokenMetadata: updatedMetadataHex,
      }
      await testTransaction(
        testContext.client,
        updateMetadataTx,
        testContext.wallet,
      )

      const issuanceAfterUpdate = await readMPTokenIssuance(
        testContext,
        issuanceId,
      )
      assert.equal(issuanceAfterUpdate.MPTokenMetadata, updatedMetadataHex)
    },
    TIMEOUT,
  )

  it(
    'rejects MPTokenMetadata mutation via MPTokenIssuanceSet when tmfMPTCanMutateMetadata was not set at create time',
    async () => {
      // Create an issuance whose MutableFlags grant only the unrelated
      // CanMutateCanLock permission, so the issuance cannot have its
      // metadata mutated.
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        MutableFlags: MPTokenIssuanceCreateMutableFlags.tmfMPTCanMutateCanLock,
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)

      const updateMetadataTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId,
        MPTokenMetadata: stringToHex('updated metadata'),
      }
      await testTransaction(
        testContext.client,
        updateMetadataTx,
        testContext.wallet,
        undefined,
        'tecNO_PERMISSION',
      )
    },
    TIMEOUT,
  )

  it(
    'rejects toggling an lsf flag via MPTokenIssuanceSet when the corresponding mutate flag was not set at create time',
    async () => {
      // Create an issuance with no MutableFlags, so no lsf* flag is mutable.
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)

      const setCanLockTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId,
        MutableFlags: MPTokenIssuanceSetMutableFlags.tmfMPTSetCanLock,
      }
      await testTransaction(
        testContext.client,
        setCanLockTx,
        testContext.wallet,
        undefined,
        'tecNO_PERMISSION',
      )
    },
    TIMEOUT,
  )

  it(
    'rejects TransferFee mutation via MPTokenIssuanceSet when tmfMPTCanMutateTransferFee was not set at create time',
    async () => {
      // tfMPTCanTransfer is required for TransferFee to be accepted by the
      // validator; mutability for TransferFee is intentionally omitted.
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        Flags: MPTokenIssuanceCreateFlags.tfMPTCanTransfer,
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)

      const updateTransferFeeTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId,
        TransferFee: 100,
      }
      await testTransaction(
        testContext.client,
        updateTransferFeeTx,
        testContext.wallet,
        undefined,
        'tecNO_PERMISSION',
      )
    },
    TIMEOUT,
  )

  it(
    'rejects DomainID mutation via MPTokenIssuanceSet on an issuance created without tfMPTRequireAuth',
    async () => {
      const domainId = await createPermissionedDomain(testContext)

      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)

      const setDomainTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId,
        DomainID: domainId,
      }
      await testTransaction(
        testContext.client,
        setDomainTx,
        testContext.wallet,
        undefined,
        'tecNO_PERMISSION',
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

async function submitMPTCreateAndGetId(
  testContext: XrplIntegrationTestContext,
  createTx: MPTokenIssuanceCreate,
): Promise<string> {
  const submitResponse = await testTransaction(
    testContext.client,
    createTx,
    testContext.wallet,
  )
  const txResponse = await testContext.client.request({
    command: 'tx',
    transaction: submitResponse.result.tx_json.hash,
  })
  const meta = txResponse.result
    .meta as TransactionMetadata<MPTokenIssuanceCreate>
  assert.isString(
    meta.mpt_issuance_id,
    'MPTokenIssuanceCreate did not return an mpt_issuance_id',
  )
  return meta.mpt_issuance_id!
}

async function createPermissionedDomain(
  testContext: XrplIntegrationTestContext,
): Promise<string> {
  const sampleCredential = {
    Credential: {
      CredentialType: stringToHex('Passport'),
      Issuer: testContext.wallet.classicAddress,
    },
  }
  const pdSet: PermissionedDomainSet = {
    TransactionType: 'PermissionedDomainSet',
    Account: testContext.wallet.classicAddress,
    AcceptedCredentials: [sampleCredential],
  }
  await testTransaction(testContext.client, pdSet, testContext.wallet)

  const accountObjects = await testContext.client.request({
    command: 'account_objects',
    account: testContext.wallet.classicAddress,
    type: 'permissioned_domain',
  })
  const newestDomain = accountObjects.result.account_objects[
    accountObjects.result.account_objects.length - 1
  ] as PermissionedDomain
  return newestDomain.index
}
