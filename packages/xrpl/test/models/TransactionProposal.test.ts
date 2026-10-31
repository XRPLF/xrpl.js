import { assert } from 'chai'

import {
  LedgerEntry,
  LedgerEntryFilter,
  TransactionProposal,
} from '../../src/models/ledger'
import { LedgerEntryRequest } from '../../src/models/methods/ledgerEntry'

/**
 * TransactionProposal ledger entry model testing.
 */
describe('TransactionProposal', function () {
  it('is a LedgerEntry with the fields the network stores', function () {
    const proposal: TransactionProposal = {
      LedgerEntryType: 'TransactionProposal',
      index: 'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
      Flags: 0,
      Owner: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Expiration: 820000000,
      OwnerNode: '0',
      PreviousTxnID:
        'E3FE6EA3D48F0C2B639448020EA4F03D4F4F8FFDB243A852A0F59177921B4879',
      PreviousTxnLgrSeq: 14,
      ProposedTransaction: {
        TransactionType: 'Payment',
        Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        Destination: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
        Amount: '1000000',
        Fee: '12',
        Sequence: 0,
        TicketSequence: 5,
        SigningPubKey: '',
      },
    }
    const entry: LedgerEntry = proposal
    assert.equal(entry.LedgerEntryType, 'TransactionProposal')
  })

  it('is an account_objects and ledger_data type filter', function () {
    const filter: LedgerEntryFilter = 'transaction_proposal'
    assert.equal(filter, 'transaction_proposal')
  })

  it('is looked up by ledger_entry by ID or by account and ticket', function () {
    const byId: LedgerEntryRequest = {
      command: 'ledger_entry',
      transaction_proposal:
        'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
    }
    const byTicket: LedgerEntryRequest = {
      command: 'ledger_entry',
      transaction_proposal: {
        account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        ticket_seq: 5,
      },
    }
    assert.isDefined(byId.transaction_proposal)
    assert.isDefined(byTicket.transaction_proposal)
  })
})
