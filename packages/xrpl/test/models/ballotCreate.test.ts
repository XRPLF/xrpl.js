import { BallotCreate, BallotCreateFlags } from '../../src/models/transactions'
import { validateBallotCreate } from '../../src/models/transactions/ballotCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateBallotCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateBallotCreate, message)

const MPT_ISSUANCE_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
const DOMAIN_ID =
  'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A'
const DIGEST =
  '983F536DBB46D5BBF43A0B5890576874EE1CF48CE31CA508A529EC17CD1A90EF'
// 33-byte compressed EC point.
const EC_POINT = `02${'AB'.repeat(32)}`
// 64-byte Schnorr proof of possession.
const SCHNORR_PROOF = 'CD'.repeat(64)

/**
 * BallotCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('BallotCreate', function () {
  let tx: BallotCreate

  beforeEach(function () {
    tx = {
      TransactionType: 'BallotCreate',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      Digest: DIGEST,
      OptionCount: 3,
      TallyPublicKey: EC_POINT,
      OpenTime: 800000000,
      CloseTime: 800086400,
      ZKProof: SCHNORR_PROOF,
    }
  })

  describe('valid transactions', function () {
    it('verifies valid BallotCreate in token mode', function () {
      assertValid(tx)
    })

    it('verifies valid BallotCreate in credential mode', function () {
      delete tx.MPTokenIssuanceID
      tx.DomainID = DOMAIN_ID
      assertValid(tx)
    })

    it('verifies valid BallotCreate with all optional fields', function () {
      tx.URI = 'AB'.repeat(256)
      tx.AuditorEncryptionKey = `03${'EF'.repeat(32)}`
      tx.Flags = BallotCreateFlags.tfVoterRecoverable
      assertValid(tx)
    })

    it('verifies valid BallotCreate with the option count bounds', function () {
      tx.OptionCount = 2
      assertValid(tx)
      tx.OptionCount = 8
      assertValid(tx)
    })

    it('verifies valid BallotCreate with object flags', function () {
      tx.Flags = { tfVoterRecoverable: true }
      assertValid(tx)
    })
  })

  describe('flags and eligibility source', function () {
    it('throws w/ unknown flags', function () {
      tx.Flags = 0x00010000
      assertInvalid(tx, 'BallotCreate: invalid Flags')
    })

    it('throws w/ neither MPTokenIssuanceID nor DomainID', function () {
      delete tx.MPTokenIssuanceID
      assertInvalid(
        tx,
        'BallotCreate: exactly one of MPTokenIssuanceID and DomainID must be set',
      )
    })

    it('throws w/ both MPTokenIssuanceID and DomainID', function () {
      tx.DomainID = DOMAIN_ID
      assertInvalid(
        tx,
        'BallotCreate: exactly one of MPTokenIssuanceID and DomainID must be set',
      )
    })

    it('throws w/ invalid MPTokenIssuanceID', function () {
      tx.MPTokenIssuanceID = 'ABCD'
      assertInvalid(tx, 'BallotCreate: invalid field MPTokenIssuanceID')
    })

    it('throws w/ a zero DomainID', function () {
      delete tx.MPTokenIssuanceID
      tx.DomainID = '0'.repeat(64)
      assertInvalid(tx, 'BallotCreate: invalid field DomainID')
    })
  })

  describe('fields', function () {
    it('throws w/ missing Digest', function () {
      // @ts-expect-error for test
      tx.Digest = undefined
      assertInvalid(tx, 'BallotCreate: missing field Digest')
    })

    it('throws w/ invalid Digest', function () {
      tx.Digest = 'ABCD'
      assertInvalid(tx, 'BallotCreate: invalid field Digest')
    })

    it('throws w/ missing OptionCount', function () {
      // @ts-expect-error for test
      tx.OptionCount = undefined
      assertInvalid(tx, 'BallotCreate: missing field OptionCount')
    })

    it('throws w/ invalid OptionCount', function () {
      // @ts-expect-error for test
      tx.OptionCount = '3'
      assertInvalid(tx, 'BallotCreate: invalid field OptionCount')
    })

    it('throws w/ OptionCount below 2', function () {
      tx.OptionCount = 1
      assertInvalid(tx, 'BallotCreate: OptionCount must be between 2 and 8')
    })

    it('throws w/ OptionCount above 8', function () {
      tx.OptionCount = 9
      assertInvalid(tx, 'BallotCreate: OptionCount must be between 2 and 8')
    })

    it('throws w/ missing OpenTime', function () {
      // @ts-expect-error for test
      tx.OpenTime = undefined
      assertInvalid(tx, 'BallotCreate: missing field OpenTime')
    })

    it('throws w/ invalid CloseTime', function () {
      // @ts-expect-error for test
      tx.CloseTime = 'tomorrow'
      assertInvalid(tx, 'BallotCreate: invalid field CloseTime')
    })

    it('throws w/ OpenTime equal to CloseTime', function () {
      tx.CloseTime = tx.OpenTime
      assertInvalid(tx, 'BallotCreate: OpenTime must be before CloseTime')
    })

    it('throws w/ OpenTime after CloseTime', function () {
      tx.OpenTime = tx.CloseTime + 1
      assertInvalid(tx, 'BallotCreate: OpenTime must be before CloseTime')
    })

    it('throws w/ missing TallyPublicKey', function () {
      // @ts-expect-error for test
      tx.TallyPublicKey = undefined
      assertInvalid(tx, 'BallotCreate: missing field TallyPublicKey')
    })

    it('throws w/ TallyPublicKey of the wrong length', function () {
      tx.TallyPublicKey = `02${'AB'.repeat(31)}`
      assertInvalid(tx, 'BallotCreate: invalid field TallyPublicKey')
    })

    it('throws w/ TallyPublicKey without a compressed point prefix', function () {
      tx.TallyPublicKey = `04${'AB'.repeat(32)}`
      assertInvalid(tx, 'BallotCreate: invalid field TallyPublicKey')
    })

    it('throws w/ invalid AuditorEncryptionKey', function () {
      tx.AuditorEncryptionKey = `05${'AB'.repeat(32)}`
      assertInvalid(tx, 'BallotCreate: invalid field AuditorEncryptionKey')
    })

    it('throws w/ missing ZKProof', function () {
      // @ts-expect-error for test
      tx.ZKProof = undefined
      assertInvalid(tx, 'BallotCreate: missing field ZKProof')
    })

    it('throws w/ ZKProof of the wrong length', function () {
      tx.ZKProof = 'CD'.repeat(65)
      assertInvalid(tx, 'BallotCreate: invalid field ZKProof')
    })
  })

  describe('URI', function () {
    it('throws w/ non-hex URI', function () {
      tx.URI = 'not hex'
      assertInvalid(tx, 'BallotCreate: invalid field URI')
    })

    it('throws w/ empty URI', function () {
      tx.URI = ''
      assertInvalid(tx, 'BallotCreate: URI must be between 1 and 256 bytes')
    })

    it('throws w/ URI over 256 bytes', function () {
      tx.URI = 'AB'.repeat(257)
      assertInvalid(tx, 'BallotCreate: URI must be between 1 and 256 bytes')
    })
  })
})
