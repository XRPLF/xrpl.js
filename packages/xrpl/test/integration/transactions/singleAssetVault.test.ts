import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import { VaultCreate, VaultWithdrawalPolicy, XRP } from '../../../src'
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
    async () => {
      const tx: VaultCreate = {
        TransactionType: 'VaultCreate',
        Account: testContext.wallet.classicAddress,
        Asset: { currency: 'XRP' },
        WithdrawalPolicy:
          VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
        Data: stringToHex('vault metadata'),
        MPTokenMetadata: stringToHex('share metadata'),
        AssetsMaximum: BigInt(1000000000),
      }

      await testTransaction(testContext.client, tx, testContext.wallet)

      const result = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'vault',
      })
      const vault = result.result.account_objects[0] as Vault
      const asset = vault.Asset as XRP
      const assetsMaximum = vault.AssetsMaximum as bigint

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
      assert.equal(BigInt(assetsMaximum), BigInt(1000000000))
    },
    TIMEOUT,
  )
})
