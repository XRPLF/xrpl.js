import { validateConfidentialMPTClawback } from '../../src/models/transactions/ConfidentialMPTClawback'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateConfidentialMPTClawback)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateConfidentialMPTClawback, message)

const ACCOUNT = 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm'
const HOLDER = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
const MPT_ISSUANCE_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
const PROOF = 'AB'.repeat(64)

/**
 * ConfidentialMPTClawback Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ConfidentialMPTClawback', function () {
  it(`verifies valid ConfidentialMPTClawback`, function () {
    assertValid({
      TransactionType: 'ConfidentialMPTClawback',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      Holder: HOLDER,
      MPTAmount: '100',
      ZKProof: PROOF,
    })
  })

  it(`throws w/ missing MPTokenIssuanceID`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTClawback',
        Account: ACCOUNT,
        Holder: HOLDER,
        MPTAmount: '100',
        ZKProof: PROOF,
      },
      'ConfidentialMPTClawback: missing field MPTokenIssuanceID',
    )
  })

  it(`throws w/ missing Holder`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTClawback',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        ZKProof: PROOF,
      },
      'ConfidentialMPTClawback: missing field Holder',
    )
  })

  it(`throws w/ missing MPTAmount`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTClawback',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Holder: HOLDER,
        ZKProof: PROOF,
      },
      'ConfidentialMPTClawback: missing field MPTAmount',
    )
  })

  it(`throws w/ missing ZKProof`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTClawback',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Holder: HOLDER,
        MPTAmount: '100',
      },
      'ConfidentialMPTClawback: missing field ZKProof',
    )
  })

  it(`throws w/ invalid Holder`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTClawback',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Holder: 'not-an-address',
        MPTAmount: '100',
        ZKProof: PROOF,
      },
      'ConfidentialMPTClawback: invalid field Holder',
    )
  })

  it(`throws w/ non-hex ZKProof`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTClawback',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Holder: HOLDER,
        MPTAmount: '100',
        ZKProof: 'nothex',
      },
      'ConfidentialMPTClawback: invalid field ZKProof',
    )
  })

  it(`throws w/ zero MPTAmount (clawback forbids zero)`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTClawback',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Holder: HOLDER,
        MPTAmount: '0',
        ZKProof: PROOF,
      },
      'ConfidentialMPTClawback: MPTAmount out of range',
    )
  })

  it(`throws w/ out-of-range MPTAmount`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTClawback',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Holder: HOLDER,
        // One past the max uint64 MPT amount (9223372036854775807).
        MPTAmount: '9223372036854775808',
        ZKProof: PROOF,
      },
      'ConfidentialMPTClawback: MPTAmount out of range',
    )
  })

  it(`throws w/ non-numeric MPTAmount`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTClawback',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Holder: HOLDER,
        MPTAmount: '1.5',
        ZKProof: PROOF,
      },
      'ConfidentialMPTClawback: Invalid MPTAmount',
    )
  })
})
