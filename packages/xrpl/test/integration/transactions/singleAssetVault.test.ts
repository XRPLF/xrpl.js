import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import {
  AccountSet,
  AccountSetAsfFlags,
  MPTCurrency,
  MPTokenAuthorize,
  MPTokenIssuanceCreate,
  Payment,
  TrustSet,
  TrustSetFlags,
  TxResponse,
  VaultClawback,
  VaultCreate,
  VaultCreateFlags,
  VaultDelete,
  VaultDeposit,
  VaultSet,
  VaultWithdraw,
  VaultWithdrawalPolicy,
  Wallet,
  XRP,
} from '../../../src'
import { Vault, VaultFlags } from '../../../src/models/ledger'
import { MPTokenIssuanceCreateMetadata } from '../../../src/models/transactions/MPTokenIssuanceCreate'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('Single Asset Vault', function () {
  let testContext: XrplIntegrationTestContext
  let issuerWallet: Wallet
  let vaultOwnerWallet: Wallet
  let holderWallet: Wallet

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
    issuerWallet = await generateFundedWallet(testContext.client)
    vaultOwnerWallet = await generateFundedWallet(testContext.client)
    holderWallet = await generateFundedWallet(testContext.client)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    // eslint-disable-next-line max-statements -- needed to test all Vault transactions in one sequence flow
    async () => {
      // --- Issue an IOU ---
      const currencyCode = 'USD'
      const accountSetTx: AccountSet = {
        TransactionType: 'AccountSet',
        Account: issuerWallet.classicAddress,
        SetFlag: AccountSetAsfFlags.asfDefaultRipple,
      }

      await testTransaction(testContext.client, accountSetTx, issuerWallet)

      const accountSetTx2: AccountSet = {
        TransactionType: 'AccountSet',
        Account: issuerWallet.classicAddress,
        SetFlag: AccountSetAsfFlags.asfAllowTrustLineClawback,
      }

      await testTransaction(testContext.client, accountSetTx2, issuerWallet)

      const trustSetTx: TrustSet = {
        TransactionType: 'TrustSet',
        Flags: TrustSetFlags.tfClearNoRipple,
        Account: holderWallet.classicAddress,
        LimitAmount: {
          currency: currencyCode,
          issuer: issuerWallet.classicAddress,
          value: '1000',
        },
      }

      await testTransaction(testContext.client, trustSetTx, holderWallet)

      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: issuerWallet.classicAddress,
        Destination: holderWallet.classicAddress,
        Amount: {
          currency: currencyCode,
          issuer: issuerWallet.classicAddress,
          value: '1000',
        },
      }

      await testTransaction(testContext.client, paymentTx, issuerWallet)

      // --- VaultCreate ---
      const tx: VaultCreate = {
        TransactionType: 'VaultCreate',
        Account: vaultOwnerWallet.classicAddress,
        Asset: {
          currency: currencyCode,
          issuer: issuerWallet.classicAddress,
        },
        WithdrawalPolicy:
          VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
        Data: stringToHex('vault metadata'),
        MPTokenMetadata: stringToHex('share metadata'),
        AssetsMaximum: '500',
        // This covers owner reserve fee with potentially high open_ledger_cost
        Fee: '5000000',
      }

      await testTransaction(testContext.client, tx, vaultOwnerWallet)

      const result = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })
      const vault = result.result.account_objects[0] as Vault
      const vaultId = vault.index
      const asset = vault.Asset as XRP
      const assetsMaximum = vault.AssetsMaximum as string

      // confirm that the Vault was actually created
      assert.equal(result.result.account_objects.length, 1)
      assert.isDefined(vault, 'Vault ledger object should exist')
      assert.equal(vault.Owner, vaultOwnerWallet.classicAddress)
      assert.equal(asset.currency, currencyCode)
      assert.equal(asset.issuer, issuerWallet.classicAddress)
      assert.equal(
        vault.WithdrawalPolicy,
        VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
      )
      assert.equal(vault.Data, tx.Data)
      assert.equal(assetsMaximum, '500')

      // --- VaultSet Transaction ---
      // Increase the AssetsMaximum to 1000 and update Data
      const vaultSetTx: VaultSet = {
        TransactionType: 'VaultSet',
        Account: vaultOwnerWallet.classicAddress,
        VaultID: vaultId,
        AssetsMaximum: '1000',
        Data: stringToHex('updated metadata'),
        Fee: '5000000',
      }

      await testTransaction(testContext.client, vaultSetTx, vaultOwnerWallet)

      // Fetch the vault again to confirm updates
      const updatedResult = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })
      const updatedVault = updatedResult.result.account_objects[0] as Vault

      assert.equal(updatedVault.AssetsMaximum, '1000')
      assert.equal(updatedVault.Data, stringToHex('updated metadata'))

      // --- VaultDeposit Transaction ---
      // Deposit 10 USD to the vault
      const depositAmount = '10'
      const vaultDepositTx: VaultDeposit = {
        TransactionType: 'VaultDeposit',
        Account: holderWallet.classicAddress,
        VaultID: vaultId,
        Amount: {
          currency: currencyCode,
          issuer: issuerWallet.classicAddress,
          value: depositAmount,
        },
        Fee: '5000000',
      }

      await testTransaction(testContext.client, vaultDepositTx, holderWallet)

      // Fetch the vault again to confirm deposit
      const afterDepositResult = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
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

      // --- VaultWithdraw Transaction ---
      // Withdraw 5 USD from the vault
      const withdrawAmount = '5'
      const vaultWithdrawTx: VaultWithdraw = {
        TransactionType: 'VaultWithdraw',
        Account: holderWallet.classicAddress,
        VaultID: vaultId,
        Amount: {
          currency: currencyCode,
          issuer: issuerWallet.classicAddress,
          value: withdrawAmount,
        },
        Fee: '5000000',
      }

      await testTransaction(testContext.client, vaultWithdrawTx, holderWallet)

      // Fetch the vault again to confirm withdrawal
      const afterWithdrawResult = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })
      const afterWithdrawVault = afterWithdrawResult.result
        .account_objects[0] as Vault

      // Should have reduced balance after withdrawal (should be 0 if all withdrawn)
      assert.equal(
        afterWithdrawVault.AssetsTotal,
        (
          BigInt(afterDepositVault.AssetsTotal) - BigInt(withdrawAmount)
        ).toString(),
        'Vault should reflect withdrawn assets',
      )

      // --- VaultClawback Transaction ---
      // Claw back 5 USD from the vault
      const clawbackAmount = '5'
      const vaultClawbackTx: VaultClawback = {
        TransactionType: 'VaultClawback',
        Account: issuerWallet.classicAddress,
        VaultID: vaultId,
        Holder: holderWallet.classicAddress,
        Amount: {
          currency: currencyCode,
          issuer: issuerWallet.classicAddress,
          value: clawbackAmount,
        },
        Fee: '5000000',
      }

      await testTransaction(testContext.client, vaultClawbackTx, issuerWallet)

      // Fetch the vault again to confirm clawback
      const afterClawbackResult = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })
      const afterClawbackVault = afterClawbackResult.result
        .account_objects[0] as Vault

      assert.equal(
        afterClawbackVault.AssetsTotal,
        (
          BigInt(afterWithdrawVault.AssetsTotal) - BigInt(clawbackAmount)
        ).toString(),
        'Vault should reflect assets after clawback',
      )

      // --- VaultDelete Transaction ---
      const vaultDeleteTx: VaultDelete = {
        TransactionType: 'VaultDelete',
        Account: vaultOwnerWallet.classicAddress,
        VaultID: vaultId,
        Fee: '5000000',
      }

      await testTransaction(testContext.client, vaultDeleteTx, vaultOwnerWallet)

      // Fetch the vault again to confirm deletion (should be empty)
      const afterDeleteResult = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })

      assert.equal(
        afterDeleteResult.result.account_objects.length,
        0,
        'Vault should be deleted from account objects',
      )
    },
    TIMEOUT,
  )

  it(
    'MPT in vault',
    // eslint-disable-next-line max-statements -- needed to test all Vault transactions in one sequence flow
    async () => {
      // --- Issue MPT ---
      const mptCreateTx: MPTokenIssuanceCreate = {
        TransactionType: 'MPTokenIssuanceCreate',
        AssetScale: 2,
        Flags: {
          tfMPTCanTransfer: true,
          tfMPTCanClawback: true,
        },
        Account: issuerWallet.address,
      }

      const response = await testTransaction(
        testContext.client,
        mptCreateTx,
        issuerWallet,
      )

      const txResponse: TxResponse = await testContext.client.request({
        command: 'tx',
        transaction: response.result.tx_json.hash,
      })

      const mptIssuanceId = (
        txResponse.result.meta as MPTokenIssuanceCreateMetadata
      ).mpt_issuance_id as string

      // --- Holder Authorizes to hold MPT ---
      const mptAuthorizeTx: MPTokenAuthorize = {
        TransactionType: 'MPTokenAuthorize',
        MPTokenIssuanceID: mptIssuanceId,
        Account: holderWallet.classicAddress,
      }

      await testTransaction(testContext.client, mptAuthorizeTx, holderWallet)

      // --- Send some MPTs to Holder ---
      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: issuerWallet.classicAddress,
        Destination: holderWallet.classicAddress,
        Amount: {
          mpt_issuance_id: mptIssuanceId,
          value: '1000',
        },
      }

      await testTransaction(testContext.client, paymentTx, issuerWallet)

      // --- VaultCreate ---
      const vaultCreateTx: VaultCreate = {
        TransactionType: 'VaultCreate',
        Account: vaultOwnerWallet.classicAddress,
        Asset: {
          mpt_issuance_id: mptIssuanceId,
        },
        WithdrawalPolicy:
          VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
        Data: stringToHex('vault metadata'),
        MPTokenMetadata: stringToHex('share metadata'),
        AssetsMaximum: '500',
        // This covers owner reserve fee with potentially high open_ledger_cost
        Fee: '5000000',
        Flags: VaultCreateFlags.tfVaultShareNonTransferable,
      }

      await testTransaction(testContext.client, vaultCreateTx, vaultOwnerWallet)

      const result = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })
      const vault = result.result.account_objects[0] as Vault
      const vaultId = vault.index
      const asset = vault.Asset as MPTCurrency
      const assetsMaximum = vault.AssetsMaximum as string
      const vaultFlags = vault.Flags

      // confirm that the Vault was actually created
      assert.equal(result.result.account_objects.length, 1)
      assert.isDefined(vault, 'Vault ledger object should exist')
      assert.equal(vault.Owner, vaultOwnerWallet.classicAddress)
      assert.equal(asset.mpt_issuance_id, mptIssuanceId)
      assert.equal(
        vault.WithdrawalPolicy,
        VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
      )
      assert.equal(vault.Data, vaultCreateTx.Data)
      assert.equal(assetsMaximum, '500')
      assert.notEqual(vaultFlags, VaultFlags.lsfVaultPrivate)

      // --- VaultSet Transaction ---
      // Increase the AssetsMaximum to 1000 and update Data
      const vaultSetTx: VaultSet = {
        TransactionType: 'VaultSet',
        Account: vaultOwnerWallet.classicAddress,
        VaultID: vaultId,
        AssetsMaximum: '1000',
        Data: stringToHex('updated metadata'),
        Fee: '5000000',
      }

      await testTransaction(testContext.client, vaultSetTx, vaultOwnerWallet)

      // Fetch the vault again to confirm updates
      const updatedResult = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })
      const updatedVault = updatedResult.result.account_objects[0] as Vault

      assert.equal(updatedVault.AssetsMaximum, '1000')
      assert.equal(updatedVault.Data, stringToHex('updated metadata'))

      // --- VaultDeposit Transaction ---
      // Deposit 10 MPT to the vault
      const depositAmount = '10'
      const vaultDepositTx: VaultDeposit = {
        TransactionType: 'VaultDeposit',
        Account: holderWallet.classicAddress,
        VaultID: vaultId,
        Amount: {
          mpt_issuance_id: mptIssuanceId,
          value: depositAmount,
        },
        Fee: '5000000',
      }

      await testTransaction(testContext.client, vaultDepositTx, holderWallet)

      // Fetch the vault again to confirm deposit
      const afterDepositResult = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
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

      // --- VaultWithdraw Transaction ---
      // Withdraw 5 MPT from the vault
      const withdrawAmount = '5'
      const vaultWithdrawTx: VaultWithdraw = {
        TransactionType: 'VaultWithdraw',
        Account: holderWallet.classicAddress,
        VaultID: vaultId,
        Amount: {
          mpt_issuance_id: mptIssuanceId,
          value: withdrawAmount,
        },
        Fee: '5000000',
      }

      await testTransaction(testContext.client, vaultWithdrawTx, holderWallet)

      // Fetch the vault again to confirm withdrawal
      const afterWithdrawResult = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })
      const afterWithdrawVault = afterWithdrawResult.result
        .account_objects[0] as Vault

      // Should have reduced balance after withdrawal (should be 0 if all withdrawn)
      assert.equal(
        afterWithdrawVault.AssetsTotal,
        (
          BigInt(afterDepositVault.AssetsTotal) - BigInt(withdrawAmount)
        ).toString(),
        'Vault should reflect withdrawn assets',
      )

      // --- VaultClawback Transaction ---
      // Claw back 5 MPT from the vault
      const clawbackAmount = '5'
      const vaultClawbackTx: VaultClawback = {
        TransactionType: 'VaultClawback',
        Account: issuerWallet.classicAddress,
        VaultID: vaultId,
        Holder: holderWallet.classicAddress,
        Amount: {
          mpt_issuance_id: mptIssuanceId,
          value: clawbackAmount,
        },
        Fee: '5000000',
      }

      await testTransaction(testContext.client, vaultClawbackTx, issuerWallet)

      // Fetch the vault again to confirm clawback
      const afterClawbackResult = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })
      const afterClawbackVault = afterClawbackResult.result
        .account_objects[0] as Vault

      assert.equal(
        afterClawbackVault.AssetsTotal,
        (
          BigInt(afterWithdrawVault.AssetsTotal) - BigInt(clawbackAmount)
        ).toString(),
        'Vault should reflect assets after clawback',
      )

      // --- VaultDelete Transaction ---
      const vaultDeleteTx: VaultDelete = {
        TransactionType: 'VaultDelete',
        Account: vaultOwnerWallet.classicAddress,
        VaultID: vaultId,
        Fee: '5000000',
      }

      await testTransaction(testContext.client, vaultDeleteTx, vaultOwnerWallet)

      // Fetch the vault again to confirm deletion (should be empty)
      const afterDeleteResult = await testContext.client.request({
        command: 'account_objects',
        account: vaultOwnerWallet.classicAddress,
        type: 'vault',
      })

      assert.equal(
        afterDeleteResult.result.account_objects.length,
        0,
        'Vault should be deleted from account objects',
      )
    },
    TIMEOUT,
  )
})
