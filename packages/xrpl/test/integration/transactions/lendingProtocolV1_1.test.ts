import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import {
  CredentialAccept,
  CredentialCreate,
  PermissionedDomainSet,
  VaultCreate,
  VaultCreateFlags,
  VaultDelete,
  VaultDeposit,
  VaultKind,
  VaultWithdraw,
  VaultWithdrawalPolicy,
  Wallet,
} from '../../../src'
import { Vault } from '../../../src/models/ledger'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import {
  generateFundedWallet,
  getLedgerCloseTime,
  testTransaction,
} from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('LendingProtocolV1_1', function () {
  let testContext: XrplIntegrationTestContext
  let vaultOwnerWallet: Wallet

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
    vaultOwnerWallet = await generateFundedWallet(testContext.client)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'creates a close-ended vault with SubscriptionDate and RedemptionDate',
    async () => {
      // Derive dates from the validated ledger close time rather than system
      // time so the test stays in sync with the standalone node's clock.
      const closeTime = await getLedgerCloseTime(testContext.client)
      const subscriptionDate = closeTime + 300
      const redemptionDate = subscriptionDate + 3600

      const tx: VaultCreate = {
        TransactionType: 'VaultCreate',
        Account: vaultOwnerWallet.classicAddress,
        Asset: { currency: 'XRP' },
        WithdrawalPolicy:
          VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
        AssetsMaximum: '1000',
        VaultKind: VaultKind.vaultKindClosed,
        SubscriptionDate: subscriptionDate,
        RedemptionDate: redemptionDate,
      }

      await testTransaction(testContext.client, tx, vaultOwnerWallet)

      const result = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })
      const vault = result.result.account_objects[0] as Vault

      assert.equal(result.result.account_objects.length, 1)
      assert.equal(vault.Owner, vaultOwnerWallet.classicAddress)
      assert.equal(vault.VaultKind, VaultKind.vaultKindClosed)
      assert.equal(vault.SubscriptionDate, subscriptionDate)
      assert.equal(vault.RedemptionDate, redemptionDate)
    },
    TIMEOUT,
  )

  it(
    'deletes a vault with MemoData',
    async () => {
      const createTx: VaultCreate = {
        TransactionType: 'VaultCreate',
        Account: vaultOwnerWallet.classicAddress,
        Asset: { currency: 'XRP' },
        WithdrawalPolicy:
          VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
      }

      await testTransaction(testContext.client, createTx, vaultOwnerWallet)

      const result = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })
      const vaultId = (result.result.account_objects[0] as Vault).index

      const deleteTx: VaultDelete = {
        TransactionType: 'VaultDelete',
        Account: vaultOwnerWallet.classicAddress,
        VaultID: vaultId,
        MemoData: stringToHex('closing vault'),
      }

      await testTransaction(testContext.client, deleteTx, vaultOwnerWallet)

      const afterDelete = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })

      assert.equal(
        afterDelete.result.account_objects.length,
        0,
        'Vault should be deleted from account objects',
      )
    },
    TIMEOUT,
  )

  it(
    'withdraws from a domain-gated vault using CredentialIDs',
    async () => {
      const depositorWallet = await generateFundedWallet(testContext.client)
      const credentialType = stringToHex('lp-kyc')

      // --- Issuer grants a credential to the depositor ---
      const credentialCreateTx: CredentialCreate = {
        TransactionType: 'CredentialCreate',
        Account: vaultOwnerWallet.classicAddress,
        Subject: depositorWallet.classicAddress,
        CredentialType: credentialType,
      }
      await testTransaction(
        testContext.client,
        credentialCreateTx,
        vaultOwnerWallet,
      )

      const credentialAcceptTx: CredentialAccept = {
        TransactionType: 'CredentialAccept',
        Account: depositorWallet.classicAddress,
        Issuer: vaultOwnerWallet.classicAddress,
        CredentialType: credentialType,
      }
      await testTransaction(
        testContext.client,
        credentialAcceptTx,
        depositorWallet,
      )

      // --- Owner sets up a permissioned domain accepting that credential ---
      const pdSetTx: PermissionedDomainSet = {
        TransactionType: 'PermissionedDomainSet',
        Account: vaultOwnerWallet.classicAddress,
        AcceptedCredentials: [
          {
            Credential: {
              Issuer: vaultOwnerWallet.classicAddress,
              CredentialType: credentialType,
            },
          },
        ],
      }
      await testTransaction(testContext.client, pdSetTx, vaultOwnerWallet)

      const pdResult = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'permissioned_domain',
      })
      const domainId = pdResult.result.account_objects[0].index

      // --- Create a private, domain-gated vault ---
      const vaultCreateTx: VaultCreate = {
        TransactionType: 'VaultCreate',
        Account: vaultOwnerWallet.classicAddress,
        Asset: { currency: 'XRP' },
        WithdrawalPolicy:
          VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
        Flags: VaultCreateFlags.tfVaultPrivate,
        DomainID: domainId,
      }
      await testTransaction(testContext.client, vaultCreateTx, vaultOwnerWallet)

      const vaultResult = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })
      const vaultId = (vaultResult.result.account_objects[0] as Vault).index

      // --- Fetch the depositor's credential ID ---
      const credentials = await testContext.client.request({
        command: 'account_objects',
        account: depositorWallet.classicAddress,
        type: 'credential',
      })
      const credentialId = credentials.result.account_objects[0].index

      // --- Deposit into the vault (depositor is a domain member) ---
      const depositTx: VaultDeposit = {
        TransactionType: 'VaultDeposit',
        Account: depositorWallet.classicAddress,
        VaultID: vaultId,
        Amount: '1000000',
      }
      await testTransaction(testContext.client, depositTx, depositorWallet)

      // --- Withdraw using CredentialIDs ---
      const withdrawTx: VaultWithdraw = {
        TransactionType: 'VaultWithdraw',
        Account: depositorWallet.classicAddress,
        VaultID: vaultId,
        Amount: '500000',
        CredentialIDs: [credentialId],
      }
      await testTransaction(testContext.client, withdrawTx, depositorWallet)

      const afterWithdraw = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })
      const afterVault = afterWithdraw.result.account_objects[0] as Vault
      assert.equal(afterVault.AssetsTotal ?? '0', '500000')
    },
    TIMEOUT,
  )
})
