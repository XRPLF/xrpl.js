import { assert } from 'chai'

import { ValidationError, validate } from '../../src'
import { validateTransactionProposalCreate } from '../../src/models/transactions/transactionProposalCreate'
import { registerTransactionTypes } from '../registerTransactionTypes'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateTransactionProposalCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateTransactionProposalCreate, message)

const PROPOSER = 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm'
const TARGET = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'

const NOT_SUBMITTABLE =
  'TransactionProposalCreate: ProposedTransaction must be independently submittable'

/**
 * TransactionProposalCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('TransactionProposalCreate', function () {
  registerTransactionTypes([
    'TransactionProposalCreate',
    'TransactionProposalCancel',
  ])

  let tx: any

  beforeEach(function () {
    tx = {
      TransactionType: 'TransactionProposalCreate',
      Account: PROPOSER,
      Expiration: 820000000,
      ProposedTransaction: {
        TransactionType: 'Payment',
        Account: TARGET,
        Destination: PROPOSER,
        Amount: '1000000',
        Fee: '12',
        Sequence: 0,
        TicketSequence: 5,
        SigningPubKey: '',
      },
    }
  })

  it('verifies valid TransactionProposalCreate', function () {
    assertValid(tx)
  })

  it('throws w/ missing ProposedTransaction', function () {
    delete tx.ProposedTransaction
    assertInvalid(
      tx,
      'TransactionProposalCreate: missing field ProposedTransaction',
    )
  })

  it('throws w/ non-object ProposedTransaction', function () {
    tx.ProposedTransaction = 'Payment'
    assertInvalid(
      tx,
      'TransactionProposalCreate: invalid field ProposedTransaction',
    )
  })

  it('throws w/ missing Expiration', function () {
    delete tx.Expiration
    assertInvalid(tx, 'TransactionProposalCreate: missing field Expiration')
  })

  it('throws w/ zero Expiration', function () {
    tx.Expiration = 0
    assertInvalid(tx, 'TransactionProposalCreate: Expiration must not be 0')
  })

  it('throws w/ a ProposedTransaction without a TransactionType', function () {
    delete tx.ProposedTransaction.TransactionType
    assertInvalid(tx, NOT_SUBMITTABLE)
  })

  it('throws w/ a nested proposal', function () {
    tx.ProposedTransaction.TransactionType = 'TransactionProposalCancel'
    assertInvalid(tx, NOT_SUBMITTABLE)
  })

  it('throws w/ a pseudo-transaction', function () {
    tx.ProposedTransaction.TransactionType = 'EnableAmendment'
    assertInvalid(tx, NOT_SUBMITTABLE)
  })

  it('throws w/ a Batch inner transaction', function () {
    tx.ProposedTransaction.Flags = 0x40000000
    assertInvalid(tx, NOT_SUBMITTABLE)
  })

  it('throws w/ a Batch holding a nested proposal', function () {
    tx.ProposedTransaction = {
      TransactionType: 'Batch',
      Account: TARGET,
      Fee: '12',
      Sequence: 0,
      TicketSequence: 5,
      SigningPubKey: '',
      RawTransactions: [
        {
          RawTransaction: {
            TransactionType: 'TransactionProposalCancel',
            Account: TARGET,
            ProposalID: 'AB'.repeat(32),
            Fee: '0',
            Sequence: 0,
            SigningPubKey: '',
            Flags: 0x40000000,
          },
        },
      ],
    }
    assertInvalid(tx, NOT_SUBMITTABLE)
  })

  it.each([
    'TxnSignature',
    'Signers',
    'BatchSigners',
    'CounterpartySignature',
    'SponsorSignature',
  ])('throws w/ %s in the ProposedTransaction', function (field) {
    tx.ProposedTransaction[field] = field === 'TxnSignature' ? 'AB' : []
    assertInvalid(
      tx,
      'TransactionProposalCreate: ProposedTransaction must not carry signature fields',
    )
  })

  it('throws w/ no SigningPubKey in the ProposedTransaction', function () {
    delete tx.ProposedTransaction.SigningPubKey
    assertInvalid(
      tx,
      'TransactionProposalCreate: ProposedTransaction SigningPubKey must be present and empty',
    )
  })

  it('throws w/ a non-empty SigningPubKey in the ProposedTransaction', function () {
    tx.ProposedTransaction.SigningPubKey = '02'.repeat(33)
    assertInvalid(
      tx,
      'TransactionProposalCreate: ProposedTransaction SigningPubKey must be present and empty',
    )
  })

  it('throws w/ no TicketSequence in the ProposedTransaction', function () {
    delete tx.ProposedTransaction.TicketSequence
    assertInvalid(
      tx,
      'TransactionProposalCreate: ProposedTransaction must use a TicketSequence with Sequence 0',
    )
  })

  it('throws w/ a non-zero Sequence in the ProposedTransaction', function () {
    tx.ProposedTransaction.Sequence = 7
    assertInvalid(
      tx,
      'TransactionProposalCreate: ProposedTransaction must use a TicketSequence with Sequence 0',
    )
  })

  it('throws w/ the ProposedTransaction on the Ticket this transaction consumes', function () {
    tx.ProposedTransaction.Account = PROPOSER
    tx.Sequence = 0
    tx.TicketSequence = 5
    assertInvalid(
      tx,
      'TransactionProposalCreate: ProposedTransaction uses the Ticket this transaction consumes',
    )
  })

  it('validates the ProposedTransaction as a transaction', function () {
    delete tx.ProposedTransaction.Amount
    assert.doesNotThrow(() => validateTransactionProposalCreate(tx))
    assert.throws(
      () => validate(tx),
      ValidationError,
      'PaymentTransaction: missing field Amount',
    )
  })
})
