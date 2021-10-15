import { assert } from 'chai'
import _ from 'lodash'

import { AccountTxRequest } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('account_tx', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const request: AccountTxRequest = {
      command: 'account_tx',
      account: this.wallet.classicAddress,
      ledger_index: 'validated',
    }
    const response = await this.client.request(request)
    const expected = {
      result: {
        account: this.wallet.classicAddress,
        limit: 400,
        transactions: [
          {
            tx: {
              Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
              Amount: '400000000',
              Destination: this.wallet.classicAddress,
              Fee: '12',
              Flags: 0,
              LastLedgerSequence: 1753,
              Sequence: 843,
              SigningPubKey:
                '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020',
              TransactionType: 'Payment',
              TxnSignature:
                '30440220693D244BC13967E3DA67BDC974096784ED03DD4ACE6F36645E5176988452AFCF02200F8AB172432913899F27EC5523829AEDAD00CC2445690400E294EDF652A85945',
              date: 685747005,
              hash: '2E68BC15813B4A836FAC4D80E42E6FDA6410E99AB973937DEA5E6C2E9A116BAB',
              inLedger: 1734,
              ledger_index: 1734,
            },
          },
        ],
      },
      type: 'response',
    }
    assert.equal(response.type, expected.type)
    assert.equal(response.result.account, expected.result.account)
    assert.equal(
      response.result.transactions[0].meta.TransactionResult,
      'tesSUCCESS',
    )
    assert.equal(
      typeof response.result.transactions[0].tx.LastLedgerSequence,
      'number',
    )
    assert.equal(typeof response.result.transactions[0].tx.Sequence, 'number')
    assert.equal(
      typeof response.result.transactions[0].tx.SigningPubKey,
      'string',
    )
    assert.equal(
      typeof response.result.transactions[0].tx.TxnSignature,
      'string',
    )
    assert.equal(typeof response.result.transactions[0].tx.Fee, 'string')
    assert.equal(typeof response.result.transactions[0].tx.hash, 'string')
    assert.equal(typeof response.result.transactions[0].tx.inLedger, 'number')
    assert.equal(
      typeof response.result.transactions[0].tx.ledger_index,
      'number',
    )

    const responseTx = response.result.transactions[0].tx
    const expectedTx = expected.result.transactions[0].tx
    assert.deepEqual(
      [
        responseTx.Flags,
        responseTx.TransactionType,
        responseTx.Account,
        responseTx.Amount,
        responseTx.Destination,
      ],
      [
        expectedTx.Flags,
        expectedTx.TransactionType,
        expectedTx.Account,
        expectedTx.Amount,
        expectedTx.Destination,
      ],
    )
  })
})
