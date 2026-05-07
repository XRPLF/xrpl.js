/* eslint-disable max-statements -- required to test entire flow */

import { assert } from 'chai'

import {
  type MPTokenAuthorize,
  type MPTokenIssuanceCreate,
  type Payment,
  type TxResponse,
  type VaultCreate,
  type VaultDeposit,
  type LoanBrokerSet,
  type LoanBrokerDelete,
  type LoanBrokerCoverDeposit,
  type LoanBrokerCoverWithdraw,
  type LoanBrokerCoverClawback,
  Wallet,
  type LoanSet,
  type LoanDelete,
  type LoanManage,
  type LoanPay,
  verifySignature,
  type SignerListSet,
  LoanManageFlags,
  type MPTAmount,
  signLoanSetByCounterparty,
  combineLoanSetCounterpartySigners,
} from '../../../src'
import {
  LoanFlags,
  type Loan,
  type LoanBroker,
} from '../../../src/models/ledger'
import { type MPTokenIssuanceCreateMetadata } from '../../../src/models/transactions/MPTokenIssuanceCreate'
import { hashLoan, hashLoanBroker, hashVault } from '../../../src/utils/hashes'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

interface VaultObject {
  mptIssuanceId: string
  vaultObjectId: string
}

// how long before each test case times out
const TIMEOUT = 20000

describe('Lending Protocol IT', () => {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  }, TIMEOUT)

  afterEach(async () => {
    await teardownClient(testContext)
  }, TIMEOUT)

  it(
    'Lending protocol integration test with single signing',
    async () => {
      const vaultOwnerWallet = await generateFundedWallet(testContext.client)
      const depositorWallet = await generateFundedWallet(testContext.client)
      const borrowerWallet = await generateFundedWallet(testContext.client)

      // The Vault Owner and Loan Broker must be on the same account.
      const loanBrokerWallet = vaultOwnerWallet

      // ========== STEP 1: Create Vault ==========
      // The vault is the pool of funds that the loan broker will lend from
      const vaultCreateTx: VaultCreate = {
        TransactionType: 'VaultCreate',
        Asset: {
          currency: 'XRP',
        },
        Account: vaultOwnerWallet.address,
        AssetsMaximum: '1e17',
      }

      const vaultCreateResp = await testTransaction(
        testContext.client,
        vaultCreateTx,
        vaultOwnerWallet,
      )

      const vaultObjectId = hashVault(
        vaultCreateResp.result.tx_json.Account,
        vaultCreateResp.result.tx_json.Sequence as number,
      )

      // ========== STEP 2: Deposit Funds into Vault ==========
      // The depositor funds the vault with 10 XRP that will be lent to borrowers
      const vaultDepositTx: VaultDeposit = {
        TransactionType: 'VaultDeposit',
        Account: depositorWallet.address,
        VaultID: vaultObjectId,
        Amount: '10000000',
      }

      await testTransaction(testContext.client, vaultDepositTx, depositorWallet)

      // ========== STEP 3: Create Loan Broker ==========
      // The loan broker manages the lending protocol and sets debt limits
      const loanBrokerSetTx: LoanBrokerSet = {
        TransactionType: 'LoanBrokerSet',
        Account: loanBrokerWallet.address,
        VaultID: vaultObjectId,
        DebtMaximum: '25000000',
        ManagementFeeRate: 10000,
      }

      const loanBrokerTxResp = await testTransaction(
        testContext.client,
        loanBrokerSetTx,
        loanBrokerWallet,
      )

      const loanBrokerObjectId = hashLoanBroker(
        loanBrokerTxResp.result.tx_json.Account,
        loanBrokerTxResp.result.tx_json.Sequence as number,
      )

      // Verify LoanBroker object was created
      const loanBrokerObjects = await testContext.client.request({
        command: 'account_objects',
        account: loanBrokerWallet.address,
        type: 'loan_broker',
      })

      const loanBrokerObject: LoanBroker =
        loanBrokerObjects.result.account_objects.find(
          (obj) => obj.index === loanBrokerObjectId,
        ) as LoanBroker

      assert.equal(loanBrokerObject.index, loanBrokerObjectId)
      assert.equal(loanBrokerObject.DebtMaximum, loanBrokerSetTx.DebtMaximum)

      // ========== STEP 4: Create Loan ==========
      // The loan broker initiates a loan for the borrower
      // This requires dual signatures: broker and borrower
      let loanSetTx: LoanSet = {
        TransactionType: 'LoanSet',
        Account: loanBrokerWallet.address,
        LoanBrokerID: loanBrokerObjectId,
        PrincipalRequested: '5000000',
        Counterparty: borrowerWallet.address,
        PaymentTotal: 3,
        Data: '010203',
      }
      loanSetTx = await testContext.client.autofill(loanSetTx)
      const { tx_blob } = loanBrokerWallet.sign(loanSetTx)

      assert.isTrue(verifySignature(tx_blob))

      const { tx: borrowerSignedTx } = signLoanSetByCounterparty(
        borrowerWallet,
        tx_blob,
      )

      await testTransaction(
        testContext.client,
        borrowerSignedTx,
        loanBrokerWallet,
      )

      const loanObjectId = hashLoan(
        loanBrokerObjectId,
        loanBrokerObject.LoanSequence,
      )
      const loanObjects = await testContext.client.request({
        command: 'account_objects',
        account: borrowerWallet.address,
        type: 'loan',
      })

      const loanObject: Loan = loanObjects.result.account_objects.find(
        (obj) => obj.index === loanObjectId,
      ) as Loan

      // Verify Loan object was created with correct fields
      assert.equal(loanObject.index, loanObjectId)
      assert.equal(
        loanObject.PrincipalOutstanding,
        loanSetTx.PrincipalRequested,
      )
      assert.equal(loanObject.LoanBrokerID, loanBrokerObject.index)
      assert.equal(loanObject.Borrower, borrowerWallet.address)
      assert.equal(loanObject.PaymentRemaining, loanSetTx.PaymentTotal)

      // ========== STEP 5: Make Loan Payment ==========
      // Borrower makes a periodic payment on the loan
      const paymentAmount = '2500000'
      const loanPayTx: LoanPay = {
        TransactionType: 'LoanPay',
        Account: borrowerWallet.address,
        LoanID: loanObjectId,
        Amount: paymentAmount,
      }

      await testTransaction(testContext.client, loanPayTx, borrowerWallet)

      // Verify loan state after payment
      const updatedLoanObjects = await testContext.client.request({
        command: 'account_objects',
        account: borrowerWallet.address,
        type: 'loan',
      })

      const paidLoan: Loan = updatedLoanObjects.result.account_objects.find(
        (obj) => obj.index === loanObjectId,
      ) as Loan

      // After payment, the principal outstanding should be reduced
      assert.isTrue(
        parseInt(paidLoan.PrincipalOutstanding, 10) <
          parseInt(loanObject.PrincipalOutstanding, 10),
        'Principal should decrease after payment',
      )
      // Payment remaining should be decremented
      assert.equal(
        paidLoan.PaymentRemaining,
        loanObject.PaymentRemaining - 1,
        'Payment remaining should decrease by 1',
      )

      // assert principal outstanding is not zero
      assert.isTrue(
        parseInt(paidLoan.PrincipalOutstanding, 10) > 0,
        'Principal should not be zero',
      )

      assert.equal(
        paidLoan.PrincipalOutstanding,
        paidLoan.TotalValueOutstanding,
        'Principal should equal TotalValueOutstanding',
      )

      // ManagementFeeOutstanding = (TotalValueOutstanding - PrincipalOutstanding) * ManagementFeeRate
      // In this case, ManagementFeeOutstanding should be zero, thus unspecified
      assert.isUndefined(paidLoan.ManagementFeeOutstanding)

      // ========== STEP 5B: Make Second Payment with tfLoanFullPayment Flag ==========
      // Borrower makes the final payment with tfLoanFullPayment flag
      // This flag indicates the borrower is making a full early repayment
      const finalPaymentAmount = paidLoan.PrincipalOutstanding
      const fullPaymentTx: LoanPay = {
        TransactionType: 'LoanPay',
        Account: borrowerWallet.address,
        LoanID: loanObjectId,
        Amount: finalPaymentAmount,
        Flags: {
          tfLoanFullPayment: true,
        },
      }

      await testTransaction(testContext.client, fullPaymentTx, borrowerWallet)

      // Verify loan state after full payment
      const finalLoanObjects = await testContext.client.request({
        command: 'account_objects',
        account: borrowerWallet.address,
        type: 'loan',
      })

      const finalLoan: Loan = finalLoanObjects.result.account_objects.find(
        (obj) => obj.index === loanObjectId,
      ) as Loan

      assert.isUndefined(finalLoan.PrincipalOutstanding)
      assert.isUndefined(finalLoan.PaymentRemaining)
    },
    TIMEOUT,
  )

  it(
    'Lending protocol integration test with multi-signing',
    async () => {
      const vaultOwnerWallet = await generateFundedWallet(testContext.client)
      const mptIssuerWallet = await generateFundedWallet(testContext.client)
      const depositorWallet = await generateFundedWallet(testContext.client)
      const borrowerWallet = await generateFundedWallet(testContext.client)
      const signer1 = await generateFundedWallet(testContext.client)
      const signer2 = await generateFundedWallet(testContext.client)

      // Setup Multi-Signing
      await setupMultiSigning(testContext, borrowerWallet, signer1, signer2)

      // The Vault Owner and Loan Broker must be on the same account.
      const loanBrokerWallet = vaultOwnerWallet

      // Create a vault
      const vaultObj: VaultObject = await createSingleAssetVault(
        testContext,
        vaultOwnerWallet,
        mptIssuerWallet,
      )

      // Depositor Authorizes to hold MPT
      const mptAuthorizeTx: MPTokenAuthorize = {
        TransactionType: 'MPTokenAuthorize',
        MPTokenIssuanceID: vaultObj.mptIssuanceId,
        Account: depositorWallet.address,
      }
      await testTransaction(testContext.client, mptAuthorizeTx, depositorWallet)

      // Transfer some MPTs from the issuer to depositor
      const paymentTx: Payment = {
        TransactionType: 'Payment',
        Account: mptIssuerWallet.address,
        Destination: depositorWallet.address,
        Amount: {
          mpt_issuance_id: vaultObj.mptIssuanceId,
          value: '500000',
        },
      }
      await testTransaction(testContext.client, paymentTx, mptIssuerWallet)

      // Loan Broker Authorizes to hold MPT
      const loanBrokerMptAuthorizeTx: MPTokenAuthorize = {
        TransactionType: 'MPTokenAuthorize',
        MPTokenIssuanceID: vaultObj.mptIssuanceId,
        Account: loanBrokerWallet.address,
      }
      await testTransaction(
        testContext.client,
        loanBrokerMptAuthorizeTx,
        loanBrokerWallet,
      )

      // Transfer some MPTs from the issuer to Loan Broker
      const loanBrokerPaymentTx: Payment = {
        TransactionType: 'Payment',
        Account: mptIssuerWallet.address,
        Destination: loanBrokerWallet.address,
        Amount: {
          mpt_issuance_id: vaultObj.mptIssuanceId,
          value: '500000',
        },
      }
      await testTransaction(
        testContext.client,
        loanBrokerPaymentTx,
        mptIssuerWallet,
      )

      // Depositor deposits 200000 MPTs into the vault
      const depositAmount = '200000'
      const vaultDepositTx: VaultDeposit = {
        TransactionType: 'VaultDeposit',
        Account: depositorWallet.address,
        VaultID: vaultObj.vaultObjectId,
        Amount: {
          mpt_issuance_id: vaultObj.mptIssuanceId,
          value: depositAmount,
        },
      }
      await testTransaction(testContext.client, vaultDepositTx, depositorWallet)

      // Create LoanBroker ledger object to capture attributes of the Lending Protocol
      const loanBrokerSetTx: LoanBrokerSet = {
        TransactionType: 'LoanBrokerSet',
        Account: loanBrokerWallet.address,
        VaultID: vaultObj.vaultObjectId,
        DebtMaximum: '100000',
      }

      const loanBrokerTxResp = await testTransaction(
        testContext.client,
        loanBrokerSetTx,
        loanBrokerWallet,
      )

      const loanBrokerObjectId = hashLoanBroker(
        loanBrokerTxResp.result.tx_json.Account,
        loanBrokerTxResp.result.tx_json.Sequence as number,
      )

      const loanBrokerObjects = await testContext.client.request({
        command: 'account_objects',
        account: loanBrokerWallet.address,
        type: 'loan_broker',
      })

      const loanBrokerObject: LoanBroker =
        loanBrokerObjects.result.account_objects.find(
          (obj) => obj.index === loanBrokerObjectId,
        ) as LoanBroker

      // Assert LoanBroker object exists in objects tracked by Lender.
      assert.equal(loanBrokerObject.index, loanBrokerObjectId)
      assert.equal(loanBrokerObject.DebtMaximum, loanBrokerSetTx.DebtMaximum)

      // Create a Loan object
      let loanSetTx: LoanSet = {
        TransactionType: 'LoanSet',
        Account: loanBrokerWallet.address,
        LoanBrokerID: loanBrokerObjectId,
        PrincipalRequested: '100000',
        InterestRate: 0,
        Counterparty: borrowerWallet.address,
        PaymentTotal: 1,
      }

      // Fails as loan borrower has not signed yet.
      await testTransaction(
        testContext.client,
        loanSetTx,
        loanBrokerWallet,
        undefined,
        'temBAD_SIGNER',
      )

      // Loan broker signs the transaction and sends it to the borrower
      loanSetTx = await testContext.client.autofill(loanSetTx)
      const { tx_blob } = loanBrokerWallet.sign(loanSetTx)

      // Borrower first verifies the TxnSignature for to make sure that it came from the loan broker.
      assert.isTrue(verifySignature(tx_blob))

      // Borrower signs the transaction and fills in the CounterpartySignature to confirm the
      // loan terms.
      const { tx: signer1SignedTx } = signLoanSetByCounterparty(
        signer1,
        tx_blob,
        { multisign: true },
      )

      const { tx: signer2SignedTx } = signLoanSetByCounterparty(
        signer2,
        tx_blob,
        { multisign: true },
      )

      const { tx: combinedSignedTx } = combineLoanSetCounterpartySigners([
        signer1SignedTx,
        signer2SignedTx,
      ])

      await testTransaction(
        testContext.client,
        combinedSignedTx,
        borrowerWallet,
      )

      // Assert Loan object exists in objects tracked by Borrower.
      const loanObjectId = hashLoan(
        loanBrokerObjectId,
        loanBrokerObject.LoanSequence,
      )
      const loanObjects = await testContext.client.request({
        command: 'account_objects',
        account: borrowerWallet.address,
        type: 'loan',
      })

      let loanObject: Loan = loanObjects.result.account_objects.find(
        (obj) => obj.index === loanObjectId,
      ) as Loan

      assert.equal(loanObject.index, loanObjectId)
      assert.equal(
        loanObject.PrincipalOutstanding,
        loanSetTx.PrincipalRequested,
      )
      assert.equal(loanObject.LoanBrokerID, loanBrokerObject.index)
      assert.equal(loanObject.Borrower, borrowerWallet.address)
      assert.equal(loanObject.PaymentRemaining, loanSetTx.PaymentTotal)

      // Test LoanBrokerCoverDeposit
      const loanBrokerCoverDepositTx: LoanBrokerCoverDeposit = {
        TransactionType: 'LoanBrokerCoverDeposit',
        Account: loanBrokerWallet.address,
        LoanBrokerID: loanBrokerObjectId,
        Amount: {
          mpt_issuance_id: vaultObj.mptIssuanceId,
          value: '50000',
        },
      }
      await testTransaction(
        testContext.client,
        loanBrokerCoverDepositTx,
        loanBrokerWallet,
      )

      // Assert LoanBroker object has updated CoverAvailable
      const loanBrokerCoverDepositResult = await testContext.client.request({
        command: 'ledger_entry',
        index: loanBrokerObjectId,
      })
      const loanBrokerCoverDepositObject = loanBrokerCoverDepositResult.result
        .node as LoanBroker
      assert.equal(
        loanBrokerCoverDepositObject.CoverAvailable,
        (loanBrokerCoverDepositTx.Amount as MPTAmount).value,
      )

      // Test LoanBrokerCoverWithdraw
      const loanBrokerCoverWithdrawTx: LoanBrokerCoverWithdraw = {
        TransactionType: 'LoanBrokerCoverWithdraw',
        Account: loanBrokerWallet.address,
        LoanBrokerID: loanBrokerObjectId,
        Amount: {
          mpt_issuance_id: vaultObj.mptIssuanceId,
          value: '25000',
        },
        Destination: loanBrokerWallet.address,
        DestinationTag: 10,
      }
      await testTransaction(
        testContext.client,
        loanBrokerCoverWithdrawTx,
        loanBrokerWallet,
      )

      // Assert LoanBroker object has updated CoverAvailable
      const loanBrokerCoverWithdrawResult = await testContext.client.request({
        command: 'ledger_entry',
        index: loanBrokerObjectId,
      })
      const loanBrokerCoverWithdrawObject = loanBrokerCoverWithdrawResult.result
        .node as LoanBroker
      assert.equal(
        loanBrokerCoverWithdrawObject.CoverAvailable,
        (
          BigInt(loanBrokerCoverDepositObject.CoverAvailable as string) -
          BigInt((loanBrokerCoverWithdrawTx.Amount as MPTAmount).value)
        ).toString(),
      )

      // Test LoanManage - Mark loan as impaired
      const loanManageTx: LoanManage = {
        TransactionType: 'LoanManage',
        Account: loanBrokerWallet.address,
        LoanID: loanObjectId,
        Flags: LoanManageFlags.tfLoanImpair,
      }
      await testTransaction(testContext.client, loanManageTx, loanBrokerWallet)

      // Assert Loan object is impaired
      const loanManageResult = await testContext.client.request({
        command: 'account_objects',
        account: borrowerWallet.address,
        type: 'loan',
      })
      loanObject = loanManageResult.result.account_objects.find(
        (obj) => obj.index === loanObjectId,
      ) as Loan
      assert.equal(loanObject.Flags, LoanFlags.lsfLoanImpaired)

      // Test LoanPay
      const loanPayTx: LoanPay = {
        TransactionType: 'LoanPay',
        Account: borrowerWallet.address,
        LoanID: loanObjectId,
        Amount: {
          mpt_issuance_id: vaultObj.mptIssuanceId,
          value: '100000',
        },
      }
      await testTransaction(testContext.client, loanPayTx, borrowerWallet)

      loanObject = (
        await testContext.client.request({
          command: 'ledger_entry',
          index: loanObjectId,
        })
      ).result.node as Loan
      // Loan gets un-impaired when a payment is made
      assert.equal(loanObject.Flags, 0)
      // Entire loan is paid off
      assert.isUndefined(loanObject.TotalValueOutstanding)

      // Test LoanDelete
      const loanDeleteTx: LoanDelete = {
        TransactionType: 'LoanDelete',
        Account: borrowerWallet.address,
        LoanID: loanObjectId,
      }
      await testTransaction(testContext.client, loanDeleteTx, borrowerWallet)

      // Assert Loan object is deleted
      const loanDeleteResult = await testContext.client.request({
        command: 'account_objects',
        account: borrowerWallet.address,
        type: 'loan',
      })
      assert.equal(loanDeleteResult.result.account_objects.length, 0)

      // Test LoanBrokerCoverClawback
      const loanBrokerCoverClawbackTx: LoanBrokerCoverClawback = {
        TransactionType: 'LoanBrokerCoverClawback',
        Account: mptIssuerWallet.address,
        LoanBrokerID: loanBrokerObjectId,
        Amount: {
          mpt_issuance_id: vaultObj.mptIssuanceId,
          value: '10000',
        },
      }
      await testTransaction(
        testContext.client,
        loanBrokerCoverClawbackTx,
        mptIssuerWallet,
      )
      const loanBrokerCoverClawbackResult = await testContext.client.request({
        command: 'ledger_entry',
        index: loanBrokerObjectId,
      })

      const loanBrokerCoverClawbackObject = loanBrokerCoverClawbackResult.result
        .node as LoanBroker
      assert.equal(
        loanBrokerCoverClawbackObject.CoverAvailable,
        (
          BigInt(loanBrokerCoverWithdrawObject.CoverAvailable as string) -
          BigInt((loanBrokerCoverClawbackTx.Amount as MPTAmount).value)
        ).toString(),
      )

      // Test LoanBrokerDelete
      const loanBrokerDeleteTx: LoanBrokerDelete = {
        TransactionType: 'LoanBrokerDelete',
        Account: loanBrokerWallet.address,
        LoanBrokerID: loanBrokerObjectId,
      }
      await testTransaction(
        testContext.client,
        loanBrokerDeleteTx,
        loanBrokerWallet,
      )
      const loanBrokerDeleteResult = await testContext.client.request({
        command: 'account_objects',
        account: loanBrokerWallet.address,
        type: 'loan_broker',
      })
      assert.equal(loanBrokerDeleteResult.result.account_objects.length, 0)
    },
    TIMEOUT,
  )
})

async function createSingleAssetVault(
  testContext: XrplIntegrationTestContext,
  vaultOwnerWallet: Wallet,
  mptIssuerWallet: Wallet,
): Promise<VaultObject> {
  const mptIssuanceId = await createMPToken(testContext, mptIssuerWallet)

  const vaultCreateTx: VaultCreate = {
    TransactionType: 'VaultCreate',
    Asset: {
      mpt_issuance_id: mptIssuanceId,
    },
    Account: vaultOwnerWallet.address,
  }

  const vaultCreateResp = await testTransaction(
    testContext.client,
    vaultCreateTx,
    vaultOwnerWallet,
  )

  const vaultObjectId = hashVault(
    vaultCreateResp.result.tx_json.Account,
    vaultCreateResp.result.tx_json.Sequence as number,
  )

  return { mptIssuanceId, vaultObjectId }
}

async function createMPToken(
  testContext: XrplIntegrationTestContext,
  mptIssuerWallet: Wallet,
): Promise<string> {
  const mptCreateTx: MPTokenIssuanceCreate = {
    TransactionType: 'MPTokenIssuanceCreate',
    Flags: {
      tfMPTCanTransfer: true,
      tfMPTCanClawback: true,
    },
    Account: mptIssuerWallet.address,
  }

  const response = await testTransaction(
    testContext.client,
    mptCreateTx,
    mptIssuerWallet,
  )

  const txResponse: TxResponse = await testContext.client.request({
    command: 'tx',
    transaction: response.result.tx_json.hash,
  })

  return (txResponse.result.meta as MPTokenIssuanceCreateMetadata)
    .mpt_issuance_id as string
}

// eslint-disable-next-line max-params -- required here for three wallets
async function setupMultiSigning(
  testContext: XrplIntegrationTestContext,
  wallet: Wallet,
  signer1: Wallet,
  signer2: Wallet,
): Promise<void> {
  const transaction: SignerListSet = {
    TransactionType: 'SignerListSet',
    Account: wallet.address,
    SignerQuorum: 2,
    SignerEntries: [
      { SignerEntry: { Account: signer1.address, SignerWeight: 1 } },
      { SignerEntry: { Account: signer2.address, SignerWeight: 1 } },
    ],
  }

  await testTransaction(testContext.client, transaction, wallet)
}
