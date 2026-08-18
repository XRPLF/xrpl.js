import { assert } from 'chai'

import {
  CheckCreate,
  EscrowCreate,
  LedgerEntryResponse,
  Payment,
  SponsorFlags,
  SponsorshipSet,
  SponsorshipSetFlags,
  SponsorshipTransfer,
  SponsorshipTransferFlags,
  Wallet,
  signAsSponsor,
  combineSponsorSigners,
  addPreFundedSponsor,
  validateSponsorship,
} from '../../../src'
import type Sponsorship from '../../../src/models/ledger/Sponsorship'
import type { AccountInfoResponse } from '../../../src/models/methods'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction, ledgerAccept } from '../utils'

// how long before each test case times out
const TIMEOUT = 30000

describe('Sponsorship (XLS-68)', function () {
  let testContext: XrplIntegrationTestContext
  let sponsorWallet: Wallet
  let sponseeWallet: Wallet

  /*
   * rippled runs standalone in CI, so ledgers only close on an explicit
   * ledger_accept. submitAndWait polls until the transaction validates, which
   * never happens on its own -- so every submitAndWait must be raced with a
   * ledger accept, the same way test/integration/submitAndWait.test.ts does it.
   */
  async function delayedLedgerAccept(): Promise<unknown> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1000)
    })
    return ledgerAccept(testContext.client)
  }

  async function submitAndAccept(
    blob: string,
  ): ReturnType<typeof testContext.client.submitAndWait> {
    const submission = testContext.client.submitAndWait(blob)
    const [res] = await Promise.all([submission, delayedLedgerAccept()])
    return res
  }

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    sponsorWallet = await generateFundedWallet(testContext.client)
    sponseeWallet = await generateFundedWallet(testContext.client)
  })

  afterAll(async () => teardownClient(testContext))

  describe('SponsorshipSet', function () {
    it(
      'creates a basic sponsorship with MaxFee',
      async () => {
        const tx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: sponsorWallet.classicAddress,
          Sponsee: sponseeWallet.classicAddress,
          MaxFee: '1000',
          // rippled requires a new Sponsorship to be created with some positive
          // budget (FeeAmountDelta and/or RemainingOwnerCountDelta) -- MaxFee
          // alone is just a cap, not a budget.
          RemainingOwnerCountDelta: 1,
        }

        const result = await testTransaction(
          testContext.client,
          tx,
          sponsorWallet,
        )
        assert.equal(result.result.engine_result, 'tesSUCCESS')

        // Verify sponsorship was created
        const sponsorshipEntry: LedgerEntryResponse =
          await testContext.client.request({
            command: 'ledger_entry',
            sponsorship: {
              sponsor: sponsorWallet.classicAddress,
              sponsee: sponseeWallet.classicAddress,
            },
          })

        const sponsorship = sponsorshipEntry.result.node as Sponsorship
        assert.equal(sponsorship.LedgerEntryType, 'Sponsorship')
        assert.equal(sponsorship.Owner, sponsorWallet.classicAddress)
        assert.equal(sponsorship.Sponsee, sponseeWallet.classicAddress)
        assert.equal(sponsorship.MaxFee, '1000')
      },
      TIMEOUT,
    )

    it(
      'creates sponsorship with FeeAmount',
      async () => {
        const newSponsee = await generateFundedWallet(testContext.client)

        const tx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: sponsorWallet.classicAddress,
          Sponsee: newSponsee.classicAddress,
          FeeAmountDelta: '10000',
          MaxFee: '500',
        }

        const result = await testTransaction(
          testContext.client,
          tx,
          sponsorWallet,
        )
        assert.equal(result.result.engine_result, 'tesSUCCESS')

        // Verify FeeAmount was set
        const sponsorshipEntry: LedgerEntryResponse =
          await testContext.client.request({
            command: 'ledger_entry',
            sponsorship: {
              sponsor: sponsorWallet.classicAddress,
              sponsee: newSponsee.classicAddress,
            },
          })

        const sponsorship = sponsorshipEntry.result.node as Sponsorship
        assert.equal(sponsorship.FeeAmount, '10000')
      },
      TIMEOUT,
    )

    it(
      'modifies existing sponsorship',
      async () => {
        // Update MaxFee
        const tx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: sponsorWallet.classicAddress,
          Sponsee: sponseeWallet.classicAddress,
          // Increase from 1000
          MaxFee: '2000',
        }

        const result = await testTransaction(
          testContext.client,
          tx,
          sponsorWallet,
        )
        assert.equal(result.result.engine_result, 'tesSUCCESS')

        // Verify update
        const sponsorshipEntry: LedgerEntryResponse =
          await testContext.client.request({
            command: 'ledger_entry',
            sponsorship: {
              sponsor: sponsorWallet.classicAddress,
              sponsee: sponseeWallet.classicAddress,
            },
          })

        const sponsorship = sponsorshipEntry.result.node as Sponsorship
        assert.equal(sponsorship.MaxFee, '2000')
      },
      TIMEOUT,
    )

    it(
      'deletes sponsorship with tfDeleteObject flag',
      async () => {
        // Create a temporary sponsorship to delete
        const tempSponsee = await generateFundedWallet(testContext.client)

        const createTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: sponsorWallet.classicAddress,
          Sponsee: tempSponsee.classicAddress,
          MaxFee: '500',
          RemainingOwnerCountDelta: 1,
        }
        await testTransaction(testContext.client, createTx, sponsorWallet)

        // Now delete it
        const deleteTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: sponsorWallet.classicAddress,
          Sponsee: tempSponsee.classicAddress,
          Flags: SponsorshipSetFlags.tfDeleteObject,
        }

        const result = await testTransaction(
          testContext.client,
          deleteTx,
          sponsorWallet,
        )
        assert.equal(result.result.engine_result, 'tesSUCCESS')
      },
      TIMEOUT,
    )
  })

  describe('Pre-funded Sponsorship', function () {
    it(
      'submits sponsored Payment using pre-funded sponsorship',
      async () => {
        // First ensure sponsorship exists with FeeAmount
        const setupTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: sponsorWallet.classicAddress,
          Sponsee: sponseeWallet.classicAddress,
          FeeAmountDelta: '10000',
          MaxFee: '500',
        }
        await testTransaction(testContext.client, setupTx, sponsorWallet)

        // Create payment with sponsor fields
        let payment: Payment = {
          TransactionType: 'Payment',
          Account: sponseeWallet.classicAddress,
          Destination: sponsorWallet.classicAddress,
          Amount: '100',
        }

        // Add pre-funded sponsor fields
        payment = addPreFundedSponsor(
          payment,
          sponsorWallet.classicAddress,
          SponsorFlags.spfSponsorFee,
        ) as Payment

        // Validate sponsorship before submitting
        const prepared = await testContext.client.autofill(payment)
        const validation = await validateSponsorship(
          testContext.client,
          prepared,
          prepared.Fee,
        )

        assert.isTrue(
          validation.valid,
          `Validation failed: ${String(validation.error)}`,
        )

        // Submit the sponsored transaction (only sponsee signs)
        const result = await testTransaction(
          testContext.client,
          prepared,
          sponseeWallet,
        )
        assert.equal(result.result.engine_result, 'tesSUCCESS')

        // Verify sponsor paid the fee (check FeeAmount decreased)
        const sponsorshipAfter: LedgerEntryResponse =
          await testContext.client.request({
            command: 'ledger_entry',
            sponsorship: {
              sponsor: sponsorWallet.classicAddress,
              sponsee: sponseeWallet.classicAddress,
            },
          })

        const sponsorship = sponsorshipAfter.result.node as Sponsorship
        // FeeAmount should have decreased
        assert.isTrue(Number(sponsorship.FeeAmount) < 10000)
      },
      TIMEOUT,
    )

    it(
      'validates sponsorship with insufficient FeeAmount',
      async () => {
        // Create sponsorship with very low FeeAmount
        const lowSponsee = await generateFundedWallet(testContext.client)

        const setupTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: sponsorWallet.classicAddress,
          Sponsee: lowSponsee.classicAddress,
          // Very low amount
          FeeAmountDelta: '5',
          MaxFee: '1000',
        }
        await testTransaction(testContext.client, setupTx, sponsorWallet)

        // Try to create payment with high fee
        let payment: Payment = {
          TransactionType: 'Payment',
          Account: lowSponsee.classicAddress,
          Destination: sponsorWallet.classicAddress,
          Amount: '100',
        }

        payment = addPreFundedSponsor(
          payment,
          sponsorWallet.classicAddress,
          SponsorFlags.spfSponsorFee,
        ) as Payment

        const prepared = await testContext.client.autofill(payment)

        // Validation should fail - requesting higher fee than available
        const validation = await validateSponsorship(
          testContext.client,
          prepared,
          '100',
        )

        assert.isFalse(validation.valid)
        assert.include(validation.error ?? '', 'insufficient')
      },
      TIMEOUT,
    )

    it(
      'validates sponsorship MaxFee enforcement',
      async () => {
        // Create sponsorship with strict MaxFee
        const maxFeeSponsee = await generateFundedWallet(testContext.client)

        // Very low max fee
        const setupTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: sponsorWallet.classicAddress,
          Sponsee: maxFeeSponsee.classicAddress,
          FeeAmountDelta: '10000',
          MaxFee: '20',
        }
        await testTransaction(testContext.client, setupTx, sponsorWallet)

        let payment: Payment = {
          TransactionType: 'Payment',
          Account: maxFeeSponsee.classicAddress,
          Destination: sponsorWallet.classicAddress,
          Amount: '100',
        }

        payment = addPreFundedSponsor(
          payment,
          sponsorWallet.classicAddress,
          SponsorFlags.spfSponsorFee,
        ) as Payment

        const prepared = await testContext.client.autofill(payment)

        // If autofill fee exceeds MaxFee, validation should fail
        if (Number(prepared.Fee) > 20) {
          const validation = await validateSponsorship(
            testContext.client,
            prepared,
            prepared.Fee,
          )

          assert.isFalse(validation.valid)
          assert.include(validation.error ?? '', 'MaxFee')
        }
      },
      TIMEOUT,
    )
  })

  describe('Co-signing Sponsorship', function () {
    it(
      'submits sponsored Payment with sponsor signature',
      async () => {
        const coSignSponsee = await generateFundedWallet(testContext.client)

        // Create payment
        const payment: Payment = {
          TransactionType: 'Payment',
          Account: coSignSponsee.classicAddress,
          Destination: sponsorWallet.classicAddress,
          Amount: '100',
          Sponsor: sponsorWallet.classicAddress,
          SponsorFlags: SponsorFlags.spfSponsorFee,
        }

        // Sponsee signs first
        const prepared = await testContext.client.autofill(payment)
        const sponseeSigned = coSignSponsee.sign(prepared)

        // Sponsor adds signature
        const sponsorSigned = signAsSponsor(
          sponsorWallet,
          sponseeSigned.tx_blob,
        )

        // Submit with both signatures
        const result = await submitAndAccept(sponsorSigned.tx_blob)
        assert.equal(result.result.validated, true)

        // Verify transaction has both signatures
        const tx = result.result.tx_json
        assert.isDefined(tx.TxnSignature, 'Should have sponsee signature')
        assert.isDefined(tx.SponsorSignature, 'Should have sponsor signature')
      },
      TIMEOUT,
    )

    it(
      'combines multiple sponsor signers for multisig sponsorship',
      async () => {
        const multiSigSponsee = await generateFundedWallet(testContext.client)
        const sponsor1 = await generateFundedWallet(testContext.client)
        const sponsor2 = await generateFundedWallet(testContext.client)

        // Create payment with sponsor (using sponsor1's address as the main sponsor)
        const payment: Payment = {
          TransactionType: 'Payment',
          Account: multiSigSponsee.classicAddress,
          Destination: sponsorWallet.classicAddress,
          Amount: '100',
          Sponsor: sponsor1.classicAddress,
          SponsorFlags: SponsorFlags.spfSponsorFee,
        }

        // Sponsee signs first
        const prepared = await testContext.client.autofill(payment)
        const sponseeSigned = multiSigSponsee.sign(prepared)

        // Both sponsors sign as multisig
        const sponsor1Signed = signAsSponsor(sponsor1, sponseeSigned.tx_blob, {
          multisign: true,
        })
        const sponsor2Signed = signAsSponsor(sponsor2, sponseeSigned.tx_blob, {
          multisign: true,
        })

        // Combine sponsor signatures
        const combined = combineSponsorSigners([
          sponsor1Signed.tx_blob,
          sponsor2Signed.tx_blob,
        ])

        // Verify combined transaction has multiple signers in SponsorSignature
        assert.isDefined(combined.tx.SponsorSignature)
        const sponsorSig = combined.tx.SponsorSignature as {
          Signers: Array<{ Signer: unknown }>
        }
        assert.isDefined(sponsorSig.Signers)
        assert.equal(sponsorSig.Signers.length, 2)
      },
      TIMEOUT,
    )
  })

  describe('SponsorshipTransfer', function () {
    it(
      'ends object sponsorship with tfSponsorshipEnd',
      async () => {
        const transferSponsee = await generateFundedWallet(testContext.client)

        // First create a sponsorship
        const setupTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: sponsorWallet.classicAddress,
          Sponsee: transferSponsee.classicAddress,
          MaxFee: '1000',
          RemainingOwnerCountDelta: 1,
        }
        await testTransaction(testContext.client, setupTx, sponsorWallet)

        // Create a Check that will be sponsored (creates a ledger object)
        const checkTx: CheckCreate = {
          TransactionType: 'CheckCreate',
          Account: transferSponsee.classicAddress,
          Destination: sponsorWallet.classicAddress,
          SendMax: '1000000',
          Sponsor: sponsorWallet.classicAddress,
          SponsorFlags: SponsorFlags.spfSponsorReserve,
        }

        // Sponsee signs, then sponsor co-signs
        const preparedCheck = await testContext.client.autofill(checkTx)
        const sponseeSigned = transferSponsee.sign(preparedCheck)
        const sponsorSigned = signAsSponsor(
          sponsorWallet,
          sponseeSigned.tx_blob,
        )

        const checkResult = await submitAndAccept(sponsorSigned.tx_blob)
        assert.equal(checkResult.result.validated, true)

        // Get the Check object ID from account_objects
        const accountObjects = await testContext.client.request({
          command: 'account_objects',
          account: transferSponsee.classicAddress,
          type: 'check',
        })
        assert.isAtLeast(accountObjects.result.account_objects.length, 1)
        const checkObject = accountObjects.result.account_objects[0]
        const objectId = checkObject.index

        // End the sponsorship for this object
        const endTx: SponsorshipTransfer = {
          TransactionType: 'SponsorshipTransfer',
          Account: transferSponsee.classicAddress,
          ObjectID: objectId,
          Flags: SponsorshipTransferFlags.tfSponsorshipEnd,
        }

        const endResult = await testTransaction(
          testContext.client,
          endTx,
          transferSponsee,
        )
        assert.equal(endResult.result.engine_result, 'tesSUCCESS')
      },
      TIMEOUT,
    )

    it(
      'creates sponsorship for existing object with tfSponsorshipCreate',
      async () => {
        const createSponsee = await generateFundedWallet(testContext.client)
        const newSponsor = await generateFundedWallet(testContext.client)

        // Create a Check without sponsorship first
        const checkTx: CheckCreate = {
          TransactionType: 'CheckCreate',
          Account: createSponsee.classicAddress,
          Destination: sponsorWallet.classicAddress,
          SendMax: '1000000',
        }
        await testTransaction(testContext.client, checkTx, createSponsee)

        // Get the Check object ID
        const accountObjects = await testContext.client.request({
          command: 'account_objects',
          account: createSponsee.classicAddress,
          type: 'check',
        })
        assert.isAtLeast(accountObjects.result.account_objects.length, 1)
        const checkObject = accountObjects.result.account_objects[0]
        const objectId = checkObject.index

        // Set up sponsorship relationship first
        const setupTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: newSponsor.classicAddress,
          Sponsee: createSponsee.classicAddress,
          MaxFee: '1000',
          RemainingOwnerCountDelta: 1,
        }
        await testTransaction(testContext.client, setupTx, newSponsor)

        // Create sponsorship for the existing object
        const createSponsorshipTx: SponsorshipTransfer = {
          TransactionType: 'SponsorshipTransfer',
          Account: createSponsee.classicAddress,
          ObjectID: objectId,
          Sponsor: newSponsor.classicAddress,
          // rippled's SponsorshipTransfer::preflight requires
          // spfSponsorReserve alongside Sponsor for this flag.
          SponsorFlags: SponsorFlags.spfSponsorReserve,
          Flags: SponsorshipTransferFlags.tfSponsorshipCreate,
        }

        // Sponsee signs, then new sponsor co-signs
        const prepared = await testContext.client.autofill(createSponsorshipTx)
        const sponseeSigned = createSponsee.sign(prepared)
        const sponsorSigned = signAsSponsor(newSponsor, sponseeSigned.tx_blob)

        const result = await submitAndAccept(sponsorSigned.tx_blob)
        assert.equal(result.result.validated, true)
      },
      TIMEOUT,
    )

    it(
      'reassigns sponsorship to new sponsor with tfSponsorshipReassign',
      async () => {
        const reassignSponsee = await generateFundedWallet(testContext.client)
        const originalSponsor = await generateFundedWallet(testContext.client)
        const newSponsor = await generateFundedWallet(testContext.client)

        // Set up original sponsorship
        const setupTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: originalSponsor.classicAddress,
          Sponsee: reassignSponsee.classicAddress,
          MaxFee: '1000',
          RemainingOwnerCountDelta: 1,
        }
        await testTransaction(testContext.client, setupTx, originalSponsor)

        // Create a Check with original sponsor
        const checkTx: CheckCreate = {
          TransactionType: 'CheckCreate',
          Account: reassignSponsee.classicAddress,
          Destination: sponsorWallet.classicAddress,
          SendMax: '1000000',
          Sponsor: originalSponsor.classicAddress,
          SponsorFlags: SponsorFlags.spfSponsorReserve,
        }
        const preparedCheck = await testContext.client.autofill(checkTx)
        const sponseeSignedCheck = reassignSponsee.sign(preparedCheck)
        const originalSponsorSigned = signAsSponsor(
          originalSponsor,
          sponseeSignedCheck.tx_blob,
        )
        await submitAndAccept(originalSponsorSigned.tx_blob)

        // Get the Check object ID
        const accountObjects = await testContext.client.request({
          command: 'account_objects',
          account: reassignSponsee.classicAddress,
          type: 'check',
        })
        const checkObject = accountObjects.result.account_objects[0]
        const objectId = checkObject.index

        // Set up new sponsorship relationship
        const newSetupTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: newSponsor.classicAddress,
          Sponsee: reassignSponsee.classicAddress,
          MaxFee: '1000',
          RemainingOwnerCountDelta: 1,
        }
        await testTransaction(testContext.client, newSetupTx, newSponsor)

        // Reassign sponsorship to new sponsor
        const reassignTx: SponsorshipTransfer = {
          TransactionType: 'SponsorshipTransfer',
          Account: reassignSponsee.classicAddress,
          ObjectID: objectId,
          Sponsor: newSponsor.classicAddress,
          // rippled's SponsorshipTransfer::preflight requires
          // spfSponsorReserve alongside Sponsor for this flag.
          SponsorFlags: SponsorFlags.spfSponsorReserve,
          Flags: SponsorshipTransferFlags.tfSponsorshipReassign,
        }

        const prepared = await testContext.client.autofill(reassignTx)
        const sponseeSigned = reassignSponsee.sign(prepared)
        const newSponsorSigned = signAsSponsor(
          newSponsor,
          sponseeSigned.tx_blob,
        )

        const result = await submitAndAccept(newSponsorSigned.tx_blob)
        assert.equal(result.result.validated, true)
      },
      TIMEOUT,
    )
  })

  describe('Reserve Sponsorship', function () {
    it(
      'sponsors reserve for CheckCreate with spfSponsorReserve',
      async () => {
        const reserveSponsee = await generateFundedWallet(testContext.client)

        // Set up sponsorship relationship
        const setupTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: sponsorWallet.classicAddress,
          Sponsee: reserveSponsee.classicAddress,
          MaxFee: '1000',
          RemainingOwnerCountDelta: 1,
        }
        await testTransaction(testContext.client, setupTx, sponsorWallet)

        // Get initial account info
        const initialInfo: AccountInfoResponse =
          await testContext.client.request({
            command: 'account_info',
            account: reserveSponsee.classicAddress,
          })
        const initialOwnerCount = initialInfo.result.account_data.OwnerCount

        // Create a Check with reserve sponsorship
        const checkTx: CheckCreate = {
          TransactionType: 'CheckCreate',
          Account: reserveSponsee.classicAddress,
          Destination: sponsorWallet.classicAddress,
          SendMax: '1000000',
          Sponsor: sponsorWallet.classicAddress,
          SponsorFlags: SponsorFlags.spfSponsorReserve,
        }

        const prepared = await testContext.client.autofill(checkTx)
        const sponseeSigned = reserveSponsee.sign(prepared)
        const sponsorSigned = signAsSponsor(
          sponsorWallet,
          sponseeSigned.tx_blob,
        )

        const result = await submitAndAccept(sponsorSigned.tx_blob)
        assert.equal(result.result.validated, true)

        // Verify Check was created
        const accountObjects = await testContext.client.request({
          command: 'account_objects',
          account: reserveSponsee.classicAddress,
          type: 'check',
        })
        assert.isAtLeast(accountObjects.result.account_objects.length, 1)

        // Verify sponsee's OwnerCount did not increase (sponsor pays reserve)
        const finalInfo: AccountInfoResponse = await testContext.client.request(
          {
            command: 'account_info',
            account: reserveSponsee.classicAddress,
          },
        )
        const finalOwnerCount = finalInfo.result.account_data.OwnerCount
        const finalSponsored =
          finalInfo.result.account_data.SponsoredOwnerCount ?? 0

        // rippled increments OwnerCount unconditionally and offsets the reserve
        // through SponsoredOwnerCount -- the reserve requirement is computed as
        // (owner - sponsored + sponsoring), so it is the sponsee's *effective*
        // owner count that must stay flat, not OwnerCount itself.
        assert.equal(
          Number(finalOwnerCount) - Number(finalSponsored),
          Number(initialOwnerCount),
          'effective owner count should not increase when reserve is sponsored',
        )
      },
      TIMEOUT,
    )

    it(
      'sponsors reserve for EscrowCreate with spfSponsorReserve',
      async () => {
        const escrowSponsee = await generateFundedWallet(testContext.client)

        // Set up sponsorship
        const setupTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: sponsorWallet.classicAddress,
          Sponsee: escrowSponsee.classicAddress,
          MaxFee: '1000',
          RemainingOwnerCountDelta: 1,
        }
        await testTransaction(testContext.client, setupTx, sponsorWallet)

        // Get ledger close time for FinishAfter
        const ledgerResponse = await testContext.client.request({
          command: 'ledger',
          ledger_index: 'validated',
        })
        const closeTime = ledgerResponse.result.ledger.close_time

        // Create an Escrow with reserve sponsorship
        const escrowTx: EscrowCreate = {
          TransactionType: 'EscrowCreate',
          Account: escrowSponsee.classicAddress,
          Destination: sponsorWallet.classicAddress,
          Amount: '10000',
          FinishAfter: closeTime + 60,
          Sponsor: sponsorWallet.classicAddress,
          SponsorFlags: SponsorFlags.spfSponsorReserve,
        }

        const prepared = await testContext.client.autofill(escrowTx)
        const sponseeSigned = escrowSponsee.sign(prepared)
        const sponsorSigned = signAsSponsor(
          sponsorWallet,
          sponseeSigned.tx_blob,
        )

        const result = await submitAndAccept(sponsorSigned.tx_blob)
        assert.equal(result.result.validated, true)

        // Verify Escrow was created
        const accountObjects = await testContext.client.request({
          command: 'account_objects',
          account: escrowSponsee.classicAddress,
          type: 'escrow',
        })
        assert.isAtLeast(accountObjects.result.account_objects.length, 1)
      },
      TIMEOUT,
    )

    it(
      'sponsors both fee and reserve with combined flags',
      async () => {
        const combinedSponsee = await generateFundedWallet(testContext.client)

        // Set up sponsorship with FeeAmount
        const setupTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: sponsorWallet.classicAddress,
          Sponsee: combinedSponsee.classicAddress,
          FeeAmountDelta: '10000',
          MaxFee: '1000',
          // Also needed since this sponsorship covers spfSponsorReserve too --
          // checkReserve gates on RemainingOwnerCount independent of FeeAmount.
          RemainingOwnerCountDelta: 1,
        }
        await testTransaction(testContext.client, setupTx, sponsorWallet)

        // Create a Check with both fee and reserve sponsorship
        const checkTx: CheckCreate = {
          TransactionType: 'CheckCreate',
          Account: combinedSponsee.classicAddress,
          Destination: sponsorWallet.classicAddress,
          SendMax: '1000000',
          Sponsor: sponsorWallet.classicAddress,
          /* eslint-disable no-bitwise -- combining sponsor flags */
          SponsorFlags:
            SponsorFlags.spfSponsorFee | SponsorFlags.spfSponsorReserve,
          /* eslint-enable no-bitwise */
        }

        const prepared = await testContext.client.autofill(checkTx)
        const sponseeSigned = combinedSponsee.sign(prepared)
        const sponsorSigned = signAsSponsor(
          sponsorWallet,
          sponseeSigned.tx_blob,
        )

        const result = await submitAndAccept(sponsorSigned.tx_blob)
        assert.equal(result.result.validated, true)

        // Verify Check was created
        const accountObjects = await testContext.client.request({
          command: 'account_objects',
          account: combinedSponsee.classicAddress,
          type: 'check',
        })
        assert.isAtLeast(accountObjects.result.account_objects.length, 1)

        // Verify FeeAmount decreased (sponsor paid fee)
        const sponsorshipAfter: LedgerEntryResponse =
          await testContext.client.request({
            command: 'ledger_entry',
            sponsorship: {
              sponsor: sponsorWallet.classicAddress,
              sponsee: combinedSponsee.classicAddress,
            },
          })
        const sponsorship = sponsorshipAfter.result.node as Sponsorship
        assert.isTrue(
          Number(sponsorship.FeeAmount) < 10000,
          'FeeAmount should decrease after sponsored transaction',
        )
      },
      TIMEOUT,
    )

    it(
      'verifies SponsoredOwnerCount and SponsoringOwnerCount',
      async () => {
        const countSponsee = await generateFundedWallet(testContext.client)
        const countSponsor = await generateFundedWallet(testContext.client)

        // Get initial sponsor account info
        const initialSponsorInfo: AccountInfoResponse =
          await testContext.client.request({
            command: 'account_info',
            account: countSponsor.classicAddress,
          })
        const initialSponsoringCount =
          initialSponsorInfo.result.account_data.SponsoringOwnerCount ?? 0

        // Set up sponsorship
        const setupTx: SponsorshipSet = {
          TransactionType: 'SponsorshipSet',
          Account: countSponsor.classicAddress,
          Sponsee: countSponsee.classicAddress,
          MaxFee: '1000',
          RemainingOwnerCountDelta: 1,
        }
        await testTransaction(testContext.client, setupTx, countSponsor)

        // Create a Check with reserve sponsorship
        const checkTx: CheckCreate = {
          TransactionType: 'CheckCreate',
          Account: countSponsee.classicAddress,
          Destination: sponsorWallet.classicAddress,
          SendMax: '1000000',
          Sponsor: countSponsor.classicAddress,
          SponsorFlags: SponsorFlags.spfSponsorReserve,
        }

        const prepared = await testContext.client.autofill(checkTx)
        const sponseeSigned = countSponsee.sign(prepared)
        const sponsorSigned = signAsSponsor(countSponsor, sponseeSigned.tx_blob)

        await submitAndAccept(sponsorSigned.tx_blob)

        // Verify SponsoredOwnerCount increased on sponsee
        const sponseeInfo: AccountInfoResponse =
          await testContext.client.request({
            command: 'account_info',
            account: countSponsee.classicAddress,
          })
        const sponsoredCount =
          sponseeInfo.result.account_data.SponsoredOwnerCount ?? 0
        assert.isAtLeast(
          Number(sponsoredCount),
          1,
          'SponsoredOwnerCount should be at least 1',
        )

        // Verify SponsoringOwnerCount increased on sponsor
        const sponsorInfo: AccountInfoResponse =
          await testContext.client.request({
            command: 'account_info',
            account: countSponsor.classicAddress,
          })
        const sponsoringCount =
          sponsorInfo.result.account_data.SponsoringOwnerCount ?? 0
        assert.isTrue(
          Number(sponsoringCount) > Number(initialSponsoringCount),
          'SponsoringOwnerCount should increase',
        )
      },
      TIMEOUT,
    )
  })
})
