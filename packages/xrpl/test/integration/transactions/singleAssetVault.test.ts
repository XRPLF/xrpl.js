import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import {
  VaultCreate,
  VaultDeposit,
  VaultSet,
  VaultWithdrawalPolicy,
  XRP,
} from '../../../src'
import { Vault } from '../../../src/models/ledger'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Single Asset Vault', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    // eslint-disable-next-line max-statements -- needed to test all Vault transactions in one sequence flow
    async () => {
      const tx: VaultCreate = {
        TransactionType: 'VaultCreate',
        Account: testContext.wallet.classicAddress,
        Asset: { currency: 'XRP' },
        WithdrawalPolicy:
          VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
        Data: stringToHex('vault metadata'),
        MPTokenMetadata: stringToHex('share metadata'),
        AssetsMaximum: '1000000000',
        // This covers owner reserve fee with potentially high open_ledger_cost
        Fee: '5000000',
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      const result = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'vault',
      })
      const vault = result.result.account_objects[0] as Vault
      const vaultId = vault.index
      const asset = vault.Asset as XRP
      const assetsMaximum = vault.AssetsMaximum as string

      // confirm that the Vault was actually created
      assert.equal(result.result.account_objects.length, 1)
      assert.isDefined(vault, 'Vault ledger object should exist')
      assert.equal(vault.Owner, testContext.wallet.classicAddress)
      assert.equal(asset.currency, 'XRP')
      assert.equal(
        vault.WithdrawalPolicy,
        VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
      )
      assert.equal(vault.Data, tx.Data)
      assert.equal(assetsMaximum, '1000000000')

      // --- VaultSet Transaction ---
      // Increase the AssetsMaximum and update Data
      const vaultSetTx: VaultSet = {
        TransactionType: 'VaultSet',
        Account: testContext.wallet.classicAddress,
        VaultID: vaultId,
        AssetsMaximum: '2000000000',
        Data: stringToHex('updated metadata'),
        Fee: '5000000',
      }

      await testTransaction(testContext.client, vaultSetTx, testContext.wallet)

      // Fetch the vault again to confirm updates
      const updatedResult = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'vault',
      })
      const updatedVault = updatedResult.result.account_objects[0] as Vault

      assert.equal(updatedVault.AssetsMaximum, '2000000000')
      assert.equal(updatedVault.Data, stringToHex('updated metadata'))

      // --- VaultDeposit Transaction ---
      // Deposit 123456 XRP to the vault
      const depositAmount = '123456'
      const vaultDepositTx: VaultDeposit = {
        TransactionType: 'VaultDeposit',
        Account: testContext.wallet.classicAddress,
        VaultID: vaultId,
        Amount: depositAmount,
        Fee: '5000000',
      }

      await testTransaction(
        testContext.client,
        vaultDepositTx,
        testContext.wallet,
      )

      // Fetch the vault again to confirm deposit
      const afterDepositResult = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'vault',
      })
      const afterDepositVault = afterDepositResult.result
        .account_objects[0] as Vault

      // Should have new balance after deposit (this assumes AssetsTotal tracks deposits)
      assert.equal(
        afterDepositVault.AssetsTotal,
        depositAmount,
        'Vault should reflect deposited assets',
      )
    },
    TIMEOUT,
  )
})
