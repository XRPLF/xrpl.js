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
import type {
  MPTokenIssuance,
  MPTokenIssuanceFlagsInterface,
  MPTokenIssuanceMutableFlagsInterface,
} from '../../../src/models/ledger/MPTokenIssuance'
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

/**
 * Each MPTokenIssuanceSet "set" MutableFlag maps one-way to an MPTokenIssuance
 * capability flag. The corresponding create-time "can enable" MutableFlag must
 * have granted permission for the change to be applied (XLS-94D).
 */
const MUTABILITY_FLAG_MAP: Array<{
  createEnableFlag: MPTokenIssuanceCreateMutableFlags
  setFlag: MPTokenIssuanceSetMutableFlags
  lsfKey: keyof MPTokenIssuanceFlagsInterface
  lsmfKey: keyof MPTokenIssuanceMutableFlagsInterface
}> = [
  {
    createEnableFlag: MPTokenIssuanceCreateMutableFlags.tmfMPTCanEnableCanLock,
    setFlag: MPTokenIssuanceSetMutableFlags.tmfMPTSetCanLock,
    lsfKey: 'lsfMPTCanLock',
    lsmfKey: 'lsmfMPTCanEnableCanLock',
  },
  {
    createEnableFlag:
      MPTokenIssuanceCreateMutableFlags.tmfMPTCanEnableRequireAuth,
    setFlag: MPTokenIssuanceSetMutableFlags.tmfMPTSetRequireAuth,
    lsfKey: 'lsfMPTRequireAuth',
    lsmfKey: 'lsmfMPTCanEnableRequireAuth',
  },
  {
    createEnableFlag:
      MPTokenIssuanceCreateMutableFlags.tmfMPTCanEnableCanEscrow,
    setFlag: MPTokenIssuanceSetMutableFlags.tmfMPTSetCanEscrow,
    lsfKey: 'lsfMPTCanEscrow',
    lsmfKey: 'lsmfMPTCanEnableCanEscrow',
  },
  {
    createEnableFlag: MPTokenIssuanceCreateMutableFlags.tmfMPTCanEnableCanTrade,
    setFlag: MPTokenIssuanceSetMutableFlags.tmfMPTSetCanTrade,
    lsfKey: 'lsfMPTCanTrade',
    lsmfKey: 'lsmfMPTCanEnableCanTrade',
  },
  {
    createEnableFlag:
      MPTokenIssuanceCreateMutableFlags.tmfMPTCanEnableCanTransfer,
    setFlag: MPTokenIssuanceSetMutableFlags.tmfMPTSetCanTransfer,
    lsfKey: 'lsfMPTCanTransfer',
    lsmfKey: 'lsmfMPTCanEnableCanTransfer',
  },
  {
    createEnableFlag:
      MPTokenIssuanceCreateMutableFlags.tmfMPTCanEnableCanClawback,
    setFlag: MPTokenIssuanceSetMutableFlags.tmfMPTSetCanClawback,
    lsfKey: 'lsfMPTCanClawback',
    lsmfKey: 'lsmfMPTCanEnableCanClawback',
  },
]

describe('MPTokenIssuanceSet', function () {
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
    'enables every capability flag one-way via MPTokenIssuanceSet (XLS-94D)',
    async () => {
      // Create an issuance that grants the "can enable" permission for every
      // mutable capability, but with none of the lsf capabilities set yet.
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        MutableFlags: MUTABILITY_FLAG_MAP.reduce(
          // eslint-disable-next-line no-bitwise -- combine the flags
          (acc, entry) => acc | entry.createEnableFlag,
          0,
        ),
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)

      const issuanceBeforeSet = await readMPTokenIssuance(
        testContext,
        issuanceId,
      )
      const lsmfBeforeSet = parseMPTokenIssuanceMutableFlags(
        issuanceBeforeSet.MutableFlags,
      )
      const lsfBeforeSet = parseMPTokenIssuanceFlags(issuanceBeforeSet.Flags)

      // Every create-time "can enable" flag is reflected on the ledger object,
      // while none of the capability flags themselves are set yet.
      for (const entry of MUTABILITY_FLAG_MAP) {
        assert.isTrue(
          lsmfBeforeSet[entry.lsmfKey],
          `${entry.lsmfKey} should be set from the create-time mutable flag`,
        )
        assert.isUndefined(
          lsfBeforeSet[entry.lsfKey],
          `${entry.lsfKey} should not be set on a freshly created issuance`,
        )
      }

      // Enable every capability in a single MPTokenIssuanceSet transaction.
      const enableAllTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId,
        MutableFlags: MUTABILITY_FLAG_MAP.reduce(
          // eslint-disable-next-line no-bitwise -- combine the flags
          (acc, entry) => acc | entry.setFlag,
          0,
        ),
      }
      await testTransaction(testContext.client, enableAllTx, testContext.wallet)

      const issuanceAfterSet = await readMPTokenIssuance(
        testContext,
        issuanceId,
      )
      const lsfAfterSet = parseMPTokenIssuanceFlags(issuanceAfterSet.Flags)
      const lsmfAfterSet = parseMPTokenIssuanceMutableFlags(
        issuanceAfterSet.MutableFlags,
      )

      for (const entry of MUTABILITY_FLAG_MAP) {
        assert.isTrue(
          lsfAfterSet[entry.lsfKey],
          `${entry.lsfKey} should be set after applying ${MPTokenIssuanceSetMutableFlags[entry.setFlag]}`,
        )
        // Mutability is not consumed: the "can enable" grant remains.
        assert.isTrue(
          lsmfAfterSet[entry.lsmfKey],
          `${entry.lsmfKey} should remain set after enabling the capability`,
        )
      }
    },
    TIMEOUT,
  )

  it(
    'rejects enabling a capability that was not granted at create time',
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
    'mutates TransferFee via MPTokenIssuanceSet when tmfMPTCanMutateTransferFee was set at create time',
    async () => {
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        Flags: MPTokenIssuanceCreateFlags.tfMPTCanTransfer,
        MutableFlags:
          MPTokenIssuanceCreateMutableFlags.tmfMPTCanMutateTransferFee,
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)

      const issuanceBeforeSet = await readMPTokenIssuance(
        testContext,
        issuanceId,
      )
      assert.isTrue(
        parseMPTokenIssuanceMutableFlags(issuanceBeforeSet.MutableFlags)
          .lsmfMPTCanMutateTransferFee,
        'lsmfMPTCanMutateTransferFee should be set from the create-time mutable flag',
      )

      const setTransferFeeTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId,
        TransferFee: 200,
      }
      await testTransaction(
        testContext.client,
        setTransferFeeTx,
        testContext.wallet,
      )

      const issuanceAfterSet = await readMPTokenIssuance(
        testContext,
        issuanceId,
      )
      assert.equal(issuanceAfterSet.TransferFee, 200)
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

      const issuanceBeforeSet = await readMPTokenIssuance(
        testContext,
        issuanceId,
      )
      assert.isTrue(
        parseMPTokenIssuanceMutableFlags(issuanceBeforeSet.MutableFlags)
          .lsmfMPTCanMutateMetadata,
        'lsmfMPTCanMutateMetadata should be set from the create-time mutable flag',
      )

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
      // CanEnableCanLock permission, so the issuance cannot have its
      // metadata mutated.
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        MutableFlags: MPTokenIssuanceCreateMutableFlags.tmfMPTCanEnableCanLock,
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
