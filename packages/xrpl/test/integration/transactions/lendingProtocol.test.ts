/* eslint-disable max-statements -- required to test entire flow */

import { assert } from 'chai'
import { decode } from 'ripple-binary-codec'
import { sign } from 'ripple-keypairs/src'

import {
  type MPTokenAuthorize,
  type MPTokenIssuanceCreate,
  type Payment,
  type TxResponse,
  type VaultCreate,
  type VaultDeposit,
  type LoanBrokerSet,
  Wallet,
  type LoanSet,
  verifySignature,
  SignerListSet,
  encodeForMultiSigning,
} from '../../../src'
import { type Loan, type LoanBroker } from '../../../src/models/ledger'
import { type MPTokenIssuanceCreateMetadata } from '../../../src/models/transactions/MPTokenIssuanceCreate'
import { hashLoan, hashLoanBroker, hashVault } from '../../../src/utils/hashes'
import { compareSigners } from '../../../src/Wallet/utils'
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

  afterEach(() => {
    teardownClient(testContext)
  }, TIMEOUT)

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
        Fee: '5000000',
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

      // Assert LoanBroker object exists in objects tracked by Lender.
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

      assert.equal(loanBrokerObject.index, loanBrokerObjectId)
      assert.equal(loanBrokerObject.DebtMaximum, loanBrokerSetTx.DebtMaximum)

      // Create a Loan object
      let loanSetTx: LoanSet = {
        TransactionType: 'LoanSet',
        Account: loanBrokerWallet.address,
        LoanBrokerID: loanBrokerObjectId,
        PrincipalRequested: '100000',
        Counterparty: borrowerWallet.address,
        InterestRate: 0.1,
        Fee: '5000000',
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
      loanSetTx = decode(tx_blob) as LoanSet

      // Borrower first verifies the TxnSignature for to make sure that it came from the loan broker.
      assert.isTrue(verifySignature(loanSetTx, loanSetTx.SigningPubKey))

      // Borrower signs the transaction and fills in the CounterpartySignature to confirm the
      // loan terms.
      const sign1 = sign(
        encodeForMultiSigning(loanSetTx, signer1.address),
        signer1.privateKey,
      )
      const sign2 = sign(
        encodeForMultiSigning(loanSetTx, signer2.address),
        signer2.privateKey,
      )

      loanSetTx.CounterpartySignature = {}
      loanSetTx.CounterpartySignature.Signers = []
      const signers = [
        {
          Signer: {
            Account: signer1.address,
            SigningPubKey: signer1.publicKey,
            TxnSignature: sign1,
          },
        },
        {
          Signer: {
            Account: signer2.address,
            SigningPubKey: signer2.publicKey,
            TxnSignature: sign2,
          },
        },
      ]

      signers.sort((s1, s2) => compareSigners(s1.Signer, s2.Signer))
      loanSetTx.CounterpartySignature.Signers = signers

      await testTransaction(testContext.client, loanSetTx, borrowerWallet)

      const loanObjectId = hashLoan(
        borrowerWallet.address,
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

      assert.equal(loanObject.index, loanObjectId)
      assert.equal(loanObject.InterestRate, loanSetTx.InterestRate)
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
    Fee: '5000000',
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
  singer1: Wallet,
  singer2: Wallet,
): Promise<void> {
  const transaction: SignerListSet = {
    TransactionType: 'SignerListSet',
    Account: wallet.address,
    SignerQuorum: 2,
    SignerEntries: [
      { SignerEntry: { Account: singer1.address, SignerWeight: 1 } },
      { SignerEntry: { Account: singer2.address, SignerWeight: 1 } },
    ],
  }

  await testTransaction(testContext.client, transaction, wallet)
}
