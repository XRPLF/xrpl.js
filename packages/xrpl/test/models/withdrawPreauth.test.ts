import { WithdrawPreauth } from '../../src/models/transactions'
import { validateWithdrawPreauth } from '../../src/models/transactions/withdrawPreauth'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateWithdrawPreauth)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateWithdrawPreauth, message)

const ACCOUNT = 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn'
const DESTINATION = 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo'
const ZERO_ACCOUNT = 'rrrrrrrrrrrrrrrrrrrrrhoLvTp'

/**
 * WithdrawPreauth Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('WithdrawPreauth', function () {
  let tx: WithdrawPreauth

  beforeEach(function () {
    tx = {
      TransactionType: 'WithdrawPreauth',
      Account: ACCOUNT,
      Authorize: DESTINATION,
      DestinationTag: 42,
      FirewallID:
        'E6DBAFC99223B42257915A63DFC6B0C032D4070F9A574B255AD97466726FC321',
      CounterpartySignature: {
        SigningPubKey:
          '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020',
        TxnSignature: 'DEADBEEF',
      },
    }
  })

  it('verifies a valid WithdrawPreauth that authorizes a destination', function () {
    assertValid(tx)
  })

  it('verifies a valid WithdrawPreauth that unauthorizes a destination', function () {
    delete tx.Authorize
    tx.Unauthorize = DESTINATION
    assertValid(tx)
  })

  it('throws w/ an unknown flag', function () {
    tx.Flags = 0x00010000
    assertInvalid(tx, 'WithdrawPreauth: invalid Flags')
  })

  it('throws w/ invalid Authorize', function () {
    // @ts-expect-error for test
    tx.Authorize = 123
    assertInvalid(tx, 'WithdrawPreauth: invalid field Authorize')
  })

  it('throws w/ invalid Unauthorize', function () {
    delete tx.Authorize
    tx.Unauthorize = 'not-an-account'
    assertInvalid(tx, 'WithdrawPreauth: invalid field Unauthorize')
  })

  it('throws w/ invalid DestinationTag', function () {
    // @ts-expect-error for test
    tx.DestinationTag = '42'
    assertInvalid(tx, 'WithdrawPreauth: invalid field DestinationTag')
  })

  it('throws w/ missing FirewallID', function () {
    // @ts-expect-error for test
    delete tx.FirewallID
    assertInvalid(tx, 'WithdrawPreauth: missing field FirewallID')
  })

  it('throws w/ invalid FirewallID', function () {
    tx.FirewallID = 'ABCD'
    assertInvalid(tx, 'WithdrawPreauth: invalid field FirewallID')
  })

  it('throws w/ missing CounterpartySignature', function () {
    // @ts-expect-error for test
    delete tx.CounterpartySignature
    assertInvalid(tx, 'WithdrawPreauth: missing field CounterpartySignature')
  })

  it('throws w/ invalid CounterpartySignature', function () {
    // @ts-expect-error for test
    tx.CounterpartySignature = 'DEADBEEF'
    assertInvalid(tx, 'WithdrawPreauth: invalid field CounterpartySignature')
  })

  it('throws w/ both Authorize and Unauthorize', function () {
    tx.Unauthorize = DESTINATION
    assertInvalid(
      tx,
      'WithdrawPreauth: exactly one of Authorize and Unauthorize is required',
    )
  })

  it('throws w/ neither Authorize nor Unauthorize', function () {
    delete tx.Authorize
    assertInvalid(
      tx,
      'WithdrawPreauth: exactly one of Authorize and Unauthorize is required',
    )
  })

  it('throws w/ a zero Authorize account', function () {
    tx.Authorize = ZERO_ACCOUNT
    assertInvalid(
      tx,
      'WithdrawPreauth: the authorized account must not be the zero account',
    )
  })

  it('throws w/ a zero Unauthorize account', function () {
    delete tx.Authorize
    tx.Unauthorize = ZERO_ACCOUNT
    assertInvalid(
      tx,
      'WithdrawPreauth: the authorized account must not be the zero account',
    )
  })

  it('throws w/ Authorize equal to the Account', function () {
    tx.Authorize = ACCOUNT
    assertInvalid(tx, 'WithdrawPreauth: Account cannot preauthorize itself')
  })

  it('verifies Unauthorize equal to the Account', function () {
    delete tx.Authorize
    tx.Unauthorize = ACCOUNT
    assertValid(tx)
  })

  it('throws w/ a counterparty SigningPubKey that is not a public key', function () {
    tx.CounterpartySignature = { SigningPubKey: `04${'00'.repeat(32)}` }
    assertInvalid(
      tx,
      'WithdrawPreauth: CounterpartySignature.SigningPubKey is not a valid public key',
    )
  })
})
