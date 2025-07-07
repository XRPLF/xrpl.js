import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import {
  VaultCreate,
  VaultInfoResponse,
  VaultWithdrawalPolicy,
} from '../../../src'
import { Vault } from '../../../src/models/ledger'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

describe('Single Asset Vault', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it('base', async function () {
    const tx: VaultCreate = {
      TransactionType: 'VaultCreate',
      Account: testContext.wallet.classicAddress,
      Asset: { currency: 'XRP' },
      WithdrawalPolicy: VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
      Data: stringToHex('vault metadata'),
      MPTokenMetadata: stringToHex('share metadata'),
      AssetsMaximum: '1000000000',
      // This covers owner reserve fee with potentially high open_ledger_cost
      Fee: '5000000',
    }

    await testTransaction(testContext.client, tx, testContext.wallet)

    // Fetch the vault ledger entry to get its ID
    const result = await testContext.client.request({
      command: 'account_objects',
      account: testContext.wallet.classicAddress,
      type: 'vault',
    })
    assert.equal(
      result.result.account_objects.length,
      1,
      'Should find one vault',
    )
    const vaultObj = result.result.account_objects[0] as Vault
    const vaultId = vaultObj.index

    // Fetch vault_info using vault_id
    const vaultInfoRes: VaultInfoResponse = await testContext.client.request({
      command: 'vault_info',
      vault_id: vaultId,
    })
    const { vault } = vaultInfoRes.result

    assert.isDefined(
      vault,
      'vault_info (vault_id) response should include a vault',
    )
    assert.isDefined(vault.Account)
    assert.equal(
      vault.Owner,
      testContext.wallet.classicAddress,
      'Vault Owner should match',
    )
    assert.equal(vault.LedgerEntryType, 'Vault')
    assert.deepEqual(
      vault.Asset,
      { currency: 'XRP' },
      'Vault Asset should be XRP',
    )
    assert.equal(
      vault.WithdrawalPolicy,
      VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
    )
    assert.equal(
      vault.AssetsTotal,
      '0',
      'New Vault should have zero total assets',
    )
    assert.equal(
      vault.AssetsAvailable,
      '0',
      'New Vault should have zero available assets',
    )
    assert.equal(
      vault.ShareMPTID,
      vault.shares.mpt_issuance_id,
      'ShareMPTID should match mpt_issuance_id',
    )
    assert.isDefined(vault.shares, 'Shares subobject should be present')
    assert.equal(
      vault.shares.Issuer,
      vault.Account,
      'shares.Issuer should match vault account',
    )
    assert.equal(
      vault.shares.LedgerEntryType,
      'MPTokenIssuance',
      'shares entry type should be MPTokenIssuance',
    )
    assert.equal(
      vault.shares.OutstandingAmount,
      '0',
      'New Vault should have zero shares outstanding',
    )
    assert.equal(
      vault.shares.mpt_issuance_id,
      vault.ShareMPTID,
      'mpt_issuance_id should match ShareMPTID',
    )

    // Fetch vault_info using owner and seq
    const vaultInfoRes2: VaultInfoResponse = await testContext.client.request({
      command: 'vault_info',
      owner: vaultObj.Owner,
      seq: vaultObj.Sequence,
    })
    assert.isDefined(
      vaultInfoRes2.result.vault,
      'vault_info (owner, seq) response should include a vault',
    )
    assert.equal(vaultInfoRes2.result.vault.index, vault.index)
  })
})
