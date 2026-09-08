import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import {
  MPTokenIssuanceCreate,
  MPTokenIssuanceSet,
  MPTokenIssuanceCreateFlags,
  MPTokenIssuanceSetFlags,
  PermissionedDomainSet,
  TransactionMetadata,
  MPTokenIssuanceCreateImmutableFlags,
  parseMPTokenIssuanceFlags,
  parseMPTokenIssuanceImmutableFlags,
} from '../../../src'
import type {
  MPTokenIssuance,
  MPTokenIssuanceFlagsInterface,
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
 * Each MPTokenIssuanceSet capability-setting flag (`tfMPTSet*`) maps one-way to
 * an MPTokenIssuance capability flag (`lsf*`). Under XLS-94D these are mutable by
 * default and can be enabled after issuance unless the corresponding
 * `ImmutableFlags` bit was set.
 */
const CAPABILITY_FLAG_MAP: Array<{
  setFlag: MPTokenIssuanceSetFlags
  lsfKey: keyof MPTokenIssuanceFlagsInterface
}> = [
  {
    setFlag: MPTokenIssuanceSetFlags.tfMPTSetCanLock,
    lsfKey: 'lsfMPTCanLock',
  },
  {
    setFlag: MPTokenIssuanceSetFlags.tfMPTSetRequireAuth,
    lsfKey: 'lsfMPTRequireAuth',
  },
  {
    setFlag: MPTokenIssuanceSetFlags.tfMPTSetCanEscrow,
    lsfKey: 'lsfMPTCanEscrow',
  },
  {
    setFlag: MPTokenIssuanceSetFlags.tfMPTSetCanTrade,
    lsfKey: 'lsfMPTCanTrade',
  },
  {
    setFlag: MPTokenIssuanceSetFlags.tfMPTSetCanTransfer,
    lsfKey: 'lsfMPTCanTransfer',
  },
  {
    setFlag: MPTokenIssuanceSetFlags.tfMPTSetCanClawback,
    lsfKey: 'lsfMPTCanClawback',
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
      // Create a plain issuance. Under XLS-94D every capability flag is mutable
      // by default (no ImmutableFlags declared), so none are set yet.
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)

      const issuanceBeforeSet = await readMPTokenIssuance(
        testContext,
        issuanceId,
      )
      const lsfBeforeSet = parseMPTokenIssuanceFlags(issuanceBeforeSet.Flags)

      // None of the capability flags are set on a freshly created issuance.
      for (const entry of CAPABILITY_FLAG_MAP) {
        assert.isUndefined(
          lsfBeforeSet[entry.lsfKey],
          `${entry.lsfKey} should not be set on a freshly created issuance`,
        )
      }

      // Enable every capability in a single MPTokenIssuanceSet transaction via
      // the tfMPTSet* Flags.
      const enableAllTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId,
        Flags: CAPABILITY_FLAG_MAP.reduce(
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

      for (const entry of CAPABILITY_FLAG_MAP) {
        assert.isTrue(
          lsfAfterSet[entry.lsfKey],
          `${entry.lsfKey} should be set after applying ${MPTokenIssuanceSetFlags[entry.setFlag]}`,
        )
      }
    },
    TIMEOUT,
  )

  it(
    'rejects enabling a capability that was made immutable at create time',
    async () => {
      // Create an issuance that permanently makes lsfMPTCanLock immutable.
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        ImmutableFlags: MPTokenIssuanceCreateImmutableFlags.tifMPTCanLock,
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)

      const setCanLockTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId,
        Flags: MPTokenIssuanceSetFlags.tfMPTSetCanLock,
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
    'mutates TransferFee via MPTokenIssuanceSet (mutable by default under XLS-94D)',
    async () => {
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        Flags: MPTokenIssuanceCreateFlags.tfMPTCanTransfer,
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)

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
    'rejects TransferFee mutation via MPTokenIssuanceSet when TransferFee was made immutable at create time',
    async () => {
      // tfMPTCanTransfer is required for a non-zero TransferFee; tifMPTTransferFee
      // permanently prevents any further TransferFee modification.
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        Flags: MPTokenIssuanceCreateFlags.tfMPTCanTransfer,
        ImmutableFlags: MPTokenIssuanceCreateImmutableFlags.tifMPTTransferFee,
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
    'makes TransferFee immutable via MPTokenIssuanceSet ImmutableFlags',
    async () => {
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        Flags: MPTokenIssuanceCreateFlags.tfMPTCanTransfer,
      }
      const issuanceId = await submitMPTCreateAndGetId(testContext, createTx)

      // Set a TransferFee, then permanently make it immutable.
      const setTransferFeeTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId,
        TransferFee: 200,
        ImmutableFlags: MPTokenIssuanceCreateImmutableFlags.tifMPTTransferFee,
      }
      await testTransaction(
        testContext.client,
        setTransferFeeTx,
        testContext.wallet,
      )

      const issuance = await readMPTokenIssuance(testContext, issuanceId)
      assert.equal(issuance.TransferFee, 200)
      assert.isTrue(
        parseMPTokenIssuanceImmutableFlags(issuance.ImmutableFlags)
          .lsifMPTTransferFee,
        'lsifMPTTransferFee should be recorded on the ledger object',
      )

      // A subsequent attempt to change TransferFee is now rejected.
      const rejectedTx: MPTokenIssuanceSet = {
        TransactionType: 'MPTokenIssuanceSet',
        Account: testContext.wallet.classicAddress,
        MPTokenIssuanceID: issuanceId,
        TransferFee: 100,
      }
      await testTransaction(
        testContext.client,
        rejectedTx,
        testContext.wallet,
        undefined,
        'tecNO_PERMISSION',
      )
    },
    TIMEOUT,
  )

  it(
    'mutates MPTokenMetadata via MPTokenIssuanceSet (mutable by default under XLS-94D)',
    async () => {
      const initialMetadataHex = stringToHex('initial metadata')
      const updatedMetadataHex = stringToHex('updated metadata')

      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
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
    'rejects MPTokenMetadata mutation via MPTokenIssuanceSet when MPTokenMetadata was made immutable at create time',
    async () => {
      // tifMPTMetadata permanently prevents further metadata changes.
      const createTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        Account: testContext.wallet.classicAddress,
        MPTokenMetadata: stringToHex('initial metadata'),
        ImmutableFlags: MPTokenIssuanceCreateImmutableFlags.tifMPTMetadata,
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
