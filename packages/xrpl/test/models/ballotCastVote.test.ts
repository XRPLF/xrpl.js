import { BallotCastVote } from '../../src/models/transactions'
import { validateBallotCastVote } from '../../src/models/transactions/ballotCastVote'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateBallotCastVote)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateBallotCastVote, message)

const BALLOT_ID =
  '983F536DBB46D5BBF43A0B5890576874EE1CF48CE31CA508A529EC17CD1A90EF'
const CREDENTIAL_ID =
  'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A'
// 33-byte compressed EC point.
const EC_POINT = `02${'AB'.repeat(32)}`
// 66-byte ElGamal ciphertext (two compressed points).
const CIPHERTEXT = `02${'AB'.repeat(32)}03${'CD'.repeat(32)}`
// 192-byte per-option linkage proof.
const LINKAGE_PROOF = 'EF'.repeat(192)
const BLINDING_FACTOR = '11'.repeat(32)

function castOption(): {
  BallotOption: {
    EncryptedVote: string
    AmountCommitment?: string
    ZKProof?: string
  }
} {
  return {
    BallotOption: {
      EncryptedVote: CIPHERTEXT,
      AmountCommitment: EC_POINT,
      ZKProof: LINKAGE_PROOF,
    },
  }
}

function mirrorOption(): { BallotOption: { EncryptedVote: string } } {
  return { BallotOption: { EncryptedVote: CIPHERTEXT } }
}

/**
 * BallotCastVote Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('BallotCastVote', function () {
  let tx: BallotCastVote

  beforeEach(function () {
    tx = {
      TransactionType: 'BallotCastVote',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      BallotID: BALLOT_ID,
      EncryptedVotes: [castOption(), castOption()],
      ZKProof: 'AB'.repeat(100),
      BlindingFactor: BLINDING_FACTOR,
    }
  })

  describe('valid transactions', function () {
    it('verifies valid BallotCastVote', function () {
      assertValid(tx)
    })

    it('verifies valid BallotCastVote with all optional fields', function () {
      tx.AuditorEncryptedVotes = [mirrorOption(), mirrorOption()]
      tx.VoterPublicKey = EC_POINT
      tx.VoterEncryptedVotes = [mirrorOption(), mirrorOption()]
      tx.CredentialIDs = [CREDENTIAL_ID]
      assertValid(tx)
    })

    it('verifies valid BallotCastVote with a mirror ZKProof', function () {
      tx.AuditorEncryptedVotes = [
        { BallotOption: { EncryptedVote: CIPHERTEXT, ZKProof: 'AB' } },
        mirrorOption(),
      ]
      assertValid(tx)
    })
  })

  describe('flags, BallotID and EncryptedVotes', function () {
    it('throws w/ unknown flags', function () {
      tx.Flags = 0x00010000
      assertInvalid(tx, 'BallotCastVote: invalid Flags')
    })

    it('throws w/ missing BallotID', function () {
      // @ts-expect-error for test
      tx.BallotID = undefined
      assertInvalid(tx, 'BallotCastVote: missing field BallotID')
    })

    it('throws w/ invalid BallotID', function () {
      tx.BallotID = 'ABCD'
      assertInvalid(tx, 'BallotCastVote: invalid field BallotID')
    })

    it('throws w/ missing EncryptedVotes', function () {
      // @ts-expect-error for test
      tx.EncryptedVotes = undefined
      assertInvalid(tx, 'BallotCastVote: missing field EncryptedVotes')
    })

    it('throws w/ non-array EncryptedVotes', function () {
      // @ts-expect-error for test
      tx.EncryptedVotes = castOption()
      assertInvalid(tx, 'BallotCastVote: invalid field EncryptedVotes')
    })

    it('throws w/ empty EncryptedVotes', function () {
      tx.EncryptedVotes = []
      assertInvalid(
        tx,
        'BallotCastVote: EncryptedVotes must have between 1 and 8 entries',
      )
    })

    it('throws w/ more than 8 EncryptedVotes', function () {
      tx.EncryptedVotes = Array.from({ length: 9 }, castOption)
      assertInvalid(
        tx,
        'BallotCastVote: EncryptedVotes must have between 1 and 8 entries',
      )
    })

    it('throws w/ an EncryptedVotes entry that is not a BallotOption', function () {
      // @ts-expect-error for test
      tx.EncryptedVotes = [{ EncryptedVote: CIPHERTEXT }]
      assertInvalid(tx, 'BallotCastVote: invalid field EncryptedVotes')
    })

    it('throws w/ an EncryptedVote of the wrong length', function () {
      tx.EncryptedVotes[0].BallotOption.EncryptedVote = EC_POINT
      assertInvalid(tx, 'BallotCastVote: invalid field EncryptedVotes')
    })

    it('throws w/ an EncryptedVote that is not two compressed points', function () {
      tx.EncryptedVotes[0].BallotOption.EncryptedVote = `04${'AB'.repeat(65)}`
      assertInvalid(tx, 'BallotCastVote: invalid field EncryptedVotes')
    })

    it('throws w/ an EncryptedVotes entry without AmountCommitment', function () {
      delete tx.EncryptedVotes[0].BallotOption.AmountCommitment
      assertInvalid(tx, 'BallotCastVote: invalid field EncryptedVotes')
    })

    it('throws w/ an invalid AmountCommitment', function () {
      tx.EncryptedVotes[0].BallotOption.AmountCommitment = `05${'AB'.repeat(32)}`
      assertInvalid(tx, 'BallotCastVote: invalid field EncryptedVotes')
    })

    it('throws w/ an EncryptedVotes entry without ZKProof', function () {
      delete tx.EncryptedVotes[0].BallotOption.ZKProof
      assertInvalid(tx, 'BallotCastVote: invalid field EncryptedVotes')
    })

    it('throws w/ an EncryptedVotes ZKProof of the wrong length', function () {
      tx.EncryptedVotes[0].BallotOption.ZKProof = 'EF'.repeat(191)
      assertInvalid(tx, 'BallotCastVote: invalid field EncryptedVotes')
    })
  })

  describe('mirror vote vectors', function () {
    it('throws w/ AuditorEncryptedVotes of a different size', function () {
      tx.AuditorEncryptedVotes = [mirrorOption()]
      assertInvalid(tx, 'BallotCastVote: invalid field AuditorEncryptedVotes')
    })

    it('throws w/ an AuditorEncryptedVotes entry carrying AmountCommitment', function () {
      tx.AuditorEncryptedVotes = [castOption(), castOption()]
      assertInvalid(tx, 'BallotCastVote: invalid field AuditorEncryptedVotes')
    })

    it('throws w/ an invalid AuditorEncryptedVotes ciphertext', function () {
      tx.AuditorEncryptedVotes = [
        { BallotOption: { EncryptedVote: 'AB' } },
        mirrorOption(),
      ]
      assertInvalid(tx, 'BallotCastVote: invalid field AuditorEncryptedVotes')
    })

    it('throws w/ VoterPublicKey without VoterEncryptedVotes', function () {
      tx.VoterPublicKey = EC_POINT
      assertInvalid(
        tx,
        'BallotCastVote: VoterPublicKey and VoterEncryptedVotes must be set together',
      )
    })

    it('throws w/ VoterEncryptedVotes without VoterPublicKey', function () {
      tx.VoterEncryptedVotes = [mirrorOption(), mirrorOption()]
      assertInvalid(
        tx,
        'BallotCastVote: VoterPublicKey and VoterEncryptedVotes must be set together',
      )
    })

    it('throws w/ invalid VoterPublicKey', function () {
      tx.VoterPublicKey = `04${'AB'.repeat(32)}`
      tx.VoterEncryptedVotes = [mirrorOption(), mirrorOption()]
      assertInvalid(tx, 'BallotCastVote: invalid field VoterPublicKey')
    })

    it('throws w/ VoterEncryptedVotes of a different size', function () {
      tx.VoterPublicKey = EC_POINT
      tx.VoterEncryptedVotes = [mirrorOption(), mirrorOption(), mirrorOption()]
      assertInvalid(tx, 'BallotCastVote: invalid field VoterEncryptedVotes')
    })

    it('throws w/ a VoterEncryptedVotes entry carrying AmountCommitment', function () {
      tx.VoterPublicKey = EC_POINT
      tx.VoterEncryptedVotes = [mirrorOption(), castOption()]
      assertInvalid(tx, 'BallotCastVote: invalid field VoterEncryptedVotes')
    })
  })

  describe('proofs and credentials', function () {
    it('throws w/ missing ZKProof', function () {
      // @ts-expect-error for test
      tx.ZKProof = undefined
      assertInvalid(tx, 'BallotCastVote: missing field ZKProof')
    })

    it('throws w/ empty ZKProof', function () {
      tx.ZKProof = ''
      assertInvalid(tx, 'BallotCastVote: invalid field ZKProof')
    })

    it('throws w/ non-hex ZKProof', function () {
      tx.ZKProof = 'proof'
      assertInvalid(tx, 'BallotCastVote: invalid field ZKProof')
    })

    it('throws w/ missing BlindingFactor', function () {
      // @ts-expect-error for test
      tx.BlindingFactor = undefined
      assertInvalid(tx, 'BallotCastVote: missing field BlindingFactor')
    })

    it('throws w/ BlindingFactor of the wrong length', function () {
      tx.BlindingFactor = '11'.repeat(31)
      assertInvalid(tx, 'BallotCastVote: invalid field BlindingFactor')
    })

    it('throws w/ empty CredentialIDs', function () {
      tx.CredentialIDs = []
      assertInvalid(tx, 'BallotCastVote: Credentials cannot be an empty array')
    })

    it('throws w/ duplicate CredentialIDs', function () {
      tx.CredentialIDs = [CREDENTIAL_ID, CREDENTIAL_ID]
      assertInvalid(
        tx,
        'BallotCastVote: Credentials cannot contain duplicate elements',
      )
    })

    it('throws w/ more than 8 CredentialIDs', function () {
      tx.CredentialIDs = Array.from({ length: 9 }, (_, index) =>
        index.toString(16).padStart(64, '0'),
      )
      assertInvalid(
        tx,
        'BallotCastVote: Credentials length cannot exceed 8 elements',
      )
    })
  })
})
