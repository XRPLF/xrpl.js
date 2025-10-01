/* eslint-disable max-statements -- required to test entire flow */
import { assert } from 'chai'
import { sign } from 'ripple-keypairs'

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
  decode,
  verifySignature,
  encodeForSigning,
  SignerListSet,
} from '../../../src'
import { type LoanBroker } from '../../../src/models/ledger'
import { type MPTokenIssuanceCreateMetadata } from '../../../src/models/transactions/MPTokenIssuanceCreate'
import { hashLoanBroker, hashVault } from '../../../src/utils/hashes'
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
    'Successful LoanBroker creation and loan payment',
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
          value: '1000',
        },
      }
      await testTransaction(testContext.client, paymentTx, mptIssuerWallet)

      // Depositor deposits 500 MPTs into the vault
      const depositAmount = '500'
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
        DebtMaximum: '400',
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
        PrincipalRequested: '100',
        Counterparty: borrowerWallet.address,
        Fee: '100',
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

      // Borrower first verifies the TxnSignature for authenticity
      assert.isTrue(verifySignature(loanSetTx, loanSetTx.SigningPubKey))

      console.log(loanSetTx)
      // Borrower signs the transaction
      const sign1 = sign(encodeForSigning(loanSetTx), signer1.privateKey)
      const sign2 = sign(encodeForSigning(loanSetTx), signer2.privateKey)

      loanSetTx.CounterpartySignature = {}
      loanSetTx.CounterpartySignature.Signers = []
      console.log(`Signer 1: ${signer1.address}`)
      console.log(`Signer 1 public key:${signer1.publicKey}`)
      console.log(`Signer 1 private key:${signer1.privateKey}`)
      console.log(`Signer 2: ${signer2.address}`)
      console.log(`Signer 2 public key:${signer2.publicKey}`)
      console.log(`Signer 2 private key:${signer2.privateKey}`)
      loanSetTx.CounterpartySignature.Signers.push({
        Signer: {
          Account: signer1.address,
          SigningPubKey: signer1.publicKey,
          TxnSignature: sign1,
        },
      })
      loanSetTx.CounterpartySignature.Signers.push({
        Signer: {
          Account: signer2.address,
          SigningPubKey: signer2.publicKey,
          TxnSignature: sign2,
        },
      })

      console.dir(loanSetTx, { depth: null })
      await testTransaction(testContext.client, loanSetTx, borrowerWallet)
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
    AssetScale: 2,
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
