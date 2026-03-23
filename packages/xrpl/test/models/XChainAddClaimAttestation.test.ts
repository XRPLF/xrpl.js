import { validateXChainAddClaimAttestation } from '../../src/models/transactions/XChainAddClaimAttestation'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateXChainAddClaimAttestation)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateXChainAddClaimAttestation, message)

/**
 * XChainAddClaimAttestation Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('XChainAddClaimAttestation', function () {
  let tx: any

  beforeEach(function () {
    tx = {
      Account: 'rsqvD8WFFEBBv4nztpoW9YYXJ7eRzLrtc3',
      Amount: '10000000',
      AttestationRewardAccount: 'rsqvD8WFFEBBv4nztpoW9YYXJ7eRzLrtc3',
      AttestationSignerAccount: 'rsqvD8WFFEBBv4nztpoW9YYXJ7eRzLrtc3',
      Destination: 'rJdTJRJZ6GXCCRaamHJgEqVzB7Zy4557Pi',
      Fee: '20',
      LastLedgerSequence: 19,
      OtherChainSource: 'raFcdz1g8LWJDJWJE2ZKLRGdmUmsTyxaym',
      PublicKey:
        'ED7541DEC700470F54276C90C333A13CDBB5D341FD43C60CEA12170F6D6D4E1136',
      Sequence: 9,
      Signature:
        '7C175050B08000AD35EEB2D87E16CD3F95A0AEEBF2A049474275153D9D4DD44528FE99AA50E71660A15B0B768E1B90E609BBD5DC7AFAFD45D9705D72D40EA10C',
      TransactionType: 'XChainAddClaimAttestation',
      WasLockingChainSend: 1,
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
      XChainClaimID: '0000000000000001',
    } as any
  })

  it('verifies valid XChainAddClaimAttestation', function () {
    assertValid(tx)
  })

  it('throws w/ missing Amount', function () {
    delete tx.Amount

    assertInvalid(tx, 'XChainAddClaimAttestation: missing field Amount')
  })

  it('throws w/ invalid Amount', function () {
    tx.Amount = { currency: 'ETH' }

    assertInvalid(tx, 'XChainAddClaimAttestation: invalid field Amount')
  })

  it('throws w/ missing AttestationRewardAccount', function () {
    delete tx.AttestationRewardAccount

    assertInvalid(
      tx,
      'XChainAddClaimAttestation: missing field AttestationRewardAccount',
    )
  })

  it('throws w/ invalid AttestationRewardAccount', function () {
    tx.AttestationRewardAccount = 123

    assertInvalid(
      tx,
      'XChainAddClaimAttestation: invalid field AttestationRewardAccount',
    )
  })

  it('throws w/ missing AttestationSignerAccount', function () {
    delete tx.AttestationSignerAccount

    assertInvalid(
      tx,
      'XChainAddClaimAttestation: missing field AttestationSignerAccount',
    )
  })

  it('throws w/ invalid AttestationSignerAccount', function () {
    tx.AttestationSignerAccount = 123

    assertInvalid(
      tx,
      'XChainAddClaimAttestation: invalid field AttestationSignerAccount',
    )
  })

  it('throws w/ invalid Destination', function () {
    tx.Destination = 123

    assertInvalid(tx, 'XChainAddClaimAttestation: invalid field Destination')
  })

  it('throws w/ missing OtherChainSource', function () {
    delete tx.OtherChainSource

    assertInvalid(
      tx,
      'XChainAddClaimAttestation: missing field OtherChainSource',
    )
  })

  it('throws w/ invalid OtherChainSource', function () {
    tx.OtherChainSource = 123

    assertInvalid(
      tx,
      'XChainAddClaimAttestation: invalid field OtherChainSource',
    )
  })

  it('throws w/ missing PublicKey', function () {
    delete tx.PublicKey

    assertInvalid(tx, 'XChainAddClaimAttestation: missing field PublicKey')
  })

  it('throws w/ invalid PublicKey', function () {
    tx.PublicKey = 123

    assertInvalid(tx, 'XChainAddClaimAttestation: invalid field PublicKey')
  })

  it('throws w/ missing Signature', function () {
    delete tx.Signature

    assertInvalid(tx, 'XChainAddClaimAttestation: missing field Signature')
  })

  it('throws w/ invalid Signature', function () {
    tx.Signature = 123

    assertInvalid(tx, 'XChainAddClaimAttestation: invalid field Signature')
  })

  it('throws w/ missing WasLockingChainSend', function () {
    delete tx.WasLockingChainSend

    assertInvalid(
      tx,
      'XChainAddClaimAttestation: missing field WasLockingChainSend',
    )
  })

  it('throws w/ invalid WasLockingChainSend', function () {
    tx.WasLockingChainSend = 2

    assertInvalid(
      tx,
      'XChainAddClaimAttestation: invalid field WasLockingChainSend',
    )
  })

  it('throws w/ missing XChainBridge', function () {
    delete tx.XChainBridge

    assertInvalid(tx, 'XChainAddClaimAttestation: missing field XChainBridge')
  })

  it('throws w/ invalid XChainBridge', function () {
    tx.XChainBridge = { XChainDoor: 'test' }

    assertInvalid(tx, 'XChainAddClaimAttestation: invalid field XChainBridge')
  })

  it('throws w/ missing XChainClaimID', function () {
    delete tx.XChainClaimID

    assertInvalid(tx, 'XChainAddClaimAttestation: missing field XChainClaimID')
  })

  it('throws w/ invalid XChainClaimID', function () {
    tx.XChainClaimID = { currency: 'ETH' }

    assertInvalid(tx, 'XChainAddClaimAttestation: invalid field XChainClaimID')
  })
})
