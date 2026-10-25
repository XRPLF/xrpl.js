import { FirewallDelete } from '../../src/models/transactions'
import { validateFirewallDelete } from '../../src/models/transactions/firewallDelete'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateFirewallDelete)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateFirewallDelete, message)

const SIGNING_PUB_KEY =
  '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020'

/**
 * FirewallDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('FirewallDelete', function () {
  let tx: FirewallDelete

  beforeEach(function () {
    tx = {
      TransactionType: 'FirewallDelete',
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      FirewallID:
        'E6DBAFC99223B42257915A63DFC6B0C032D4070F9A574B255AD97466726FC321',
      CounterpartySignature: {
        SigningPubKey: SIGNING_PUB_KEY,
        TxnSignature: 'DEADBEEF',
      },
    }
  })

  it('verifies valid FirewallDelete', function () {
    assertValid(tx)
  })

  it('throws w/ an unknown flag', function () {
    tx.Flags = 0x00010000
    assertInvalid(tx, 'FirewallDelete: invalid Flags')
  })

  it('throws w/ missing FirewallID', function () {
    // @ts-expect-error for test
    delete tx.FirewallID
    assertInvalid(tx, 'FirewallDelete: missing field FirewallID')
  })

  it('throws w/ invalid FirewallID', function () {
    tx.FirewallID = 'ABCD'
    assertInvalid(tx, 'FirewallDelete: invalid field FirewallID')
  })

  it('throws w/ missing CounterpartySignature', function () {
    // @ts-expect-error for test
    delete tx.CounterpartySignature
    assertInvalid(tx, 'FirewallDelete: missing field CounterpartySignature')
  })

  it('throws w/ invalid CounterpartySignature', function () {
    // @ts-expect-error for test
    tx.CounterpartySignature = []
    assertInvalid(tx, 'FirewallDelete: invalid field CounterpartySignature')
  })

  it('throws w/ a counterparty SigningPubKey that is not a public key', function () {
    tx.CounterpartySignature = { SigningPubKey: 'ED00' }
    assertInvalid(
      tx,
      'FirewallDelete: CounterpartySignature.SigningPubKey is not a valid public key',
    )
  })
})
