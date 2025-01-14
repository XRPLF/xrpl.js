import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import {
  LedgerEntryRequest,
  PermissionedDomainDelete,
  PermissionedDomainSet,
  AuthorizeCredential,
} from '../../../src'
import PermissionedDomain from '../../../src/models/ledger/PermissionedDomain'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('PermissionedDomainSet', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'Lifecycle of PermissionedDomain ledger object',
    async () => {
      const sampleCredential: AuthorizeCredential = {
        Credential: {
          CredentialType: stringToHex('Passport'),
          Issuer: testContext.wallet.classicAddress,
        },
      }

      // Step-1: Test the PermissionedDomainSet transaction
      const tx_pd_set: PermissionedDomainSet = {
        TransactionType: 'PermissionedDomainSet',
        Account: testContext.wallet.classicAddress,
        AcceptedCredentials: [sampleCredential],
      }

      await testTransaction(testContext.client, tx_pd_set, testContext.wallet)

      // Step-2: Validate the ledger_entry, account_objects RPC methods
      // validate the account_objects RPC
      const result = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'permissioned_domain',
      })

      assert.equal(result.result.account_objects.length, 1)
      const pd = result.result.account_objects[0] as PermissionedDomain

      assert.equal(pd.Flags, 0)
      expect(pd.AcceptedCredentials).toEqual([sampleCredential])

      // validate the ledger_entry RPC
      const ledger_entry_request: LedgerEntryRequest = {
        command: 'ledger_entry',
        // fetch the PD `index` from the previous account_objects RPC response
        index: pd.index,
      }
      const ledger_entry_result = await testContext.client.request(
        ledger_entry_request,
      )
      assert.deepEqual(pd, ledger_entry_result.result.node)

      // Step-3: Test the PDDelete transaction
      const tx_pd_delete: PermissionedDomainDelete = {
        TransactionType: 'PermissionedDomainDelete',
        Account: testContext.wallet.classicAddress,
        // fetch the PD `index` from the previous account_objects RPC response
        DomainID: pd.index,
      }

      await testTransaction(
        testContext.client,
        tx_pd_delete,
        testContext.wallet,
      )
    },
    TIMEOUT,
  )
})
