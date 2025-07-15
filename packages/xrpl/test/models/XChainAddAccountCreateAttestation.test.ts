import { validateXChainAddAccountCreateAttestation } from '../../src/models/transactions/XChainAddAccountCreateAttestation'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateXChainAddAccountCreateAttestation)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(
    tx,
    validateXChainAddAccountCreateAttestation,
    message,
  )

/**
 * XChainAddAccountCreateAttestation Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainAddAccountCreateAttestation', function () {
  let tx: any

  beforeEach(function () {
    tx = {
      Account: 'r9cYxdjQsoXAEz3qQJc961SNLaXRkWXCvT',
      Amount: '10000000',
      AttestationRewardAccount: 'r9cYxdjQsoXAEz3qQJc961SNLaXRkWXCvT',
      AttestationSignerAccount: 'r9cYxdjQsoXAEz3qQJc961SNLaXRkWXCvT',
      Destination: 'rJdTJRJZ6GXCCRaamHJgEqVzB7Zy4557Pi',
      Fee: '20',
      LastLedgerSequence: 13,
      OtherChainSource: 'raFcdz1g8LWJDJWJE2ZKLRGdmUmsTyxaym',
      PublicKey:
        'ED1F4A024ACFEBDB6C7AA88DEDE3364E060487EA31B14CC9E0D610D152B31AADC2',
      Sequence: 5,
      Signature:
        'EEFCFA3DC2AB4AB7C4D2EBBC168CB621A11B82BABD86534DFC8EFA72439A496' +
        '62D744073CD848E7A587A95B35162CDF9A69BB237E72C9537A987F5B8C394F30D',
      SignatureReward: '100',
      TransactionType: 'XChainAddAccountCreateAttestation',
      WasLockingChainSend: 1,
      XChainAccountCreateCount: '0000000000000006',
      XChainBridge: {
        IssuingChainDoor: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        IssuingChainIssue: {
          currency: 'XRP',
        },
        LockingChainDoor: 'rDJVtEuDKr4rj1B3qtW7R5TVWdXV2DY7Qg',
        LockingChainIssue: {
          currency: 'XRP',
        },
      },
    } as any
  })

  it('verifies valid XChainAddAccountCreateAttestation', function () {
    assertValid(tx)
  })

  it('throws w/ missing Amount', function () {
    delete tx.Amount

    assertInvalid(tx, 'XChainAddAccountCreateAttestation: missing field Amount')
  })

  it('throws w/ invalid Amount', function () {
    tx.Amount = { currency: 'ETH' }

    assertInvalid(tx, 'XChainAddAccountCreateAttestation: invalid field Amount')
  })

  it('throws w/ missing AttestationRewardAccount', function () {
    delete tx.AttestationRewardAccount

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: missing field AttestationRewardAccount',
    )
  })

  it('throws w/ invalid AttestationRewardAccount', function () {
    tx.AttestationRewardAccount = 123

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: invalid field AttestationRewardAccount',
    )
  })

  it('throws w/ missing AttestationSignerAccount', function () {
    delete tx.AttestationSignerAccount

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: missing field AttestationSignerAccount',
    )
  })

  it('throws w/ invalid AttestationSignerAccount', function () {
    tx.AttestationSignerAccount = 123

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: invalid field AttestationSignerAccount',
    )
  })

  it('throws w/ missing Destination', function () {
    delete tx.Destination

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: missing field Destination',
    )
  })

  it('throws w/ invalid Destination', function () {
    tx.Destination = 123

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: invalid field Destination',
    )
  })

  it('throws w/ missing OtherChainSource', function () {
    delete tx.OtherChainSource

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: missing field OtherChainSource',
    )
  })

  it('throws w/ invalid OtherChainSource', function () {
    tx.OtherChainSource = 123

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: invalid field OtherChainSource',
    )
  })

  it('throws w/ missing PublicKey', function () {
    delete tx.PublicKey

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: missing field PublicKey',
    )
  })

  it('throws w/ invalid PublicKey', function () {
    tx.PublicKey = 123

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: invalid field PublicKey',
    )
  })

  it('throws w/ missing Signature', function () {
    delete tx.Signature

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: missing field Signature',
    )
  })

  it('throws w/ invalid Signature', function () {
    tx.Signature = 123

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: invalid field Signature',
    )
  })

  it('throws w/ missing SignatureReward', function () {
    delete tx.SignatureReward

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: missing field SignatureReward',
    )
  })

  it('throws w/ invalid SignatureReward', function () {
    tx.SignatureReward = { currency: 'ETH' }

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: invalid field SignatureReward',
    )
  })

  it('throws w/ missing WasLockingChainSend', function () {
    delete tx.WasLockingChainSend

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: missing field WasLockingChainSend',
    )
  })

  it('throws w/ invalid WasLockingChainSend', function () {
    tx.WasLockingChainSend = 2

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: invalid field WasLockingChainSend',
    )
  })

  it('throws w/ missing XChainAccountCreateCount', function () {
    delete tx.XChainAccountCreateCount

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: missing field XChainAccountCreateCount',
    )
  })

  it('throws w/ invalid XChainAccountCreateCount', function () {
    tx.XChainAccountCreateCount = { currency: 'ETH' }

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: invalid field XChainAccountCreateCount',
    )
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: missing field XChainBridge',
    )
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assertInvalid(
      tx,
      'XChainAddAccountCreateAttestation: invalid field XChainBridge',
    )
  })
})
