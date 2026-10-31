import { validateConfidentialMPTMirrorUpdate } from '../../src/models/transactions/confidentialMPTMirrorUpdate'
import { registerTransactionTypes } from '../registerTransactionTypes'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateConfidentialMPTMirrorUpdate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateConfidentialMPTMirrorUpdate, message)

const ACCOUNT = 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm'
const HOLDER = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
// An issuance whose embedded issuer is not ACCOUNT
const MPT_ISSUANCE_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
// An issuance whose embedded issuer is ACCOUNT
const ISSUER_MPT_ID = '000004C40596915CFDEEE3A695B3EFD6BDA9AC788A368B7B'
const CIPHERTEXT = 'AB'.repeat(66)
const EQUALITY_PROOF = 'CD'.repeat(128)

/**
 * ConfidentialMPTMirrorUpdate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ConfidentialMPTMirrorUpdate', function () {
  registerTransactionTypes(['ConfidentialMPTMirrorUpdate'])

  let tx: any

  beforeEach(function () {
    tx = {
      TransactionType: 'ConfidentialMPTMirrorUpdate',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      IssuerEncryptedAmount: CIPHERTEXT,
      ZKProof: EQUALITY_PROOF,
    }
  })

  it('verifies a valid holder self-migration', function () {
    assertValid(tx)
  })

  it('verifies a valid issuer update of a holder', function () {
    tx.MPTokenIssuanceID = ISSUER_MPT_ID
    tx.Holder = HOLDER
    delete tx.IssuerEncryptedAmount
    tx.AuditorEncryptedAmount = CIPHERTEXT
    assertValid(tx)
  })

  it('throws w/ missing MPTokenIssuanceID', function () {
    delete tx.MPTokenIssuanceID
    assertInvalid(
      tx,
      'ConfidentialMPTMirrorUpdate: missing field MPTokenIssuanceID',
    )
  })

  it('throws w/ missing ZKProof', function () {
    delete tx.ZKProof
    assertInvalid(tx, 'ConfidentialMPTMirrorUpdate: missing field ZKProof')
  })

  it('throws w/ a ZKProof that is not 128 bytes', function () {
    tx.ZKProof = 'CD'.repeat(64)
    assertInvalid(tx, 'ConfidentialMPTMirrorUpdate: invalid field ZKProof')
  })

  it('throws w/ an invalid Holder', function () {
    tx.MPTokenIssuanceID = ISSUER_MPT_ID
    tx.Holder = 'not an address'
    assertInvalid(tx, 'ConfidentialMPTMirrorUpdate: invalid field Holder')
  })

  it('throws w/ a Holder set by an account that is not the issuer', function () {
    tx.Holder = HOLDER
    assertInvalid(
      tx,
      'ConfidentialMPTMirrorUpdate: only the issuer may set Holder',
    )
  })

  it('throws w/ the issuer as its own Holder', function () {
    tx.MPTokenIssuanceID = ISSUER_MPT_ID
    tx.Holder = ACCOUNT
    assertInvalid(
      tx,
      'ConfidentialMPTMirrorUpdate: Holder must not be the issuer',
    )
  })

  it('throws w/ the issuer and no Holder', function () {
    tx.MPTokenIssuanceID = ISSUER_MPT_ID
    assertInvalid(
      tx,
      'ConfidentialMPTMirrorUpdate: the issuer must name a Holder',
    )
  })

  it('throws w/ neither encrypted amount', function () {
    delete tx.IssuerEncryptedAmount
    assertInvalid(
      tx,
      'ConfidentialMPTMirrorUpdate: set IssuerEncryptedAmount or AuditorEncryptedAmount',
    )
  })

  it('throws w/ an IssuerEncryptedAmount that is not 66 bytes', function () {
    tx.IssuerEncryptedAmount = 'AB'.repeat(65)
    assertInvalid(
      tx,
      'ConfidentialMPTMirrorUpdate: invalid field IssuerEncryptedAmount',
    )
  })

  it('throws w/ an AuditorEncryptedAmount that is not 66 bytes', function () {
    tx.AuditorEncryptedAmount = 'AB'.repeat(65)
    assertInvalid(
      tx,
      'ConfidentialMPTMirrorUpdate: invalid field AuditorEncryptedAmount',
    )
  })
})
