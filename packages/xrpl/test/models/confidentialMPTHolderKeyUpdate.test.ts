import { ConfidentialMPTHolderKeyUpdateFlags } from '../../src'
import { validateConfidentialMPTHolderKeyUpdate } from '../../src/models/transactions/confidentialMPTHolderKeyUpdate'
import { registerTransactionTypes } from '../registerTransactionTypes'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateConfidentialMPTHolderKeyUpdate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateConfidentialMPTHolderKeyUpdate, message)

const ACCOUNT = 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm'
// An issuance whose embedded issuer is not ACCOUNT
const MPT_ISSUANCE_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
// An issuance whose embedded issuer is ACCOUNT
const ISSUER_MPT_ID = '000004C40596915CFDEEE3A695B3EFD6BDA9AC788A368B7B'
const EC_POINT = `02${'AB'.repeat(32)}`
const CIPHERTEXT = 'AB'.repeat(66)
const PROOF = 'CD'.repeat(64)

const { tfHolderKeyRotation, tfHolderKeyRecovery, tfCancelRecovery } =
  ConfidentialMPTHolderKeyUpdateFlags

/**
 * ConfidentialMPTHolderKeyUpdate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ConfidentialMPTHolderKeyUpdate', function () {
  registerTransactionTypes(['ConfidentialMPTHolderKeyUpdate'])

  let tx: any

  beforeEach(function () {
    tx = {
      TransactionType: 'ConfidentialMPTHolderKeyUpdate',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      Flags: tfHolderKeyRotation,
      HolderEncryptionKey: EC_POINT,
      ConfidentialBalanceSpending: CIPHERTEXT,
      ConfidentialBalanceInbox: CIPHERTEXT,
      ZKProof: PROOF,
    }
  })

  it('verifies a valid rotation', function () {
    assertValid(tx)
  })

  it('verifies a valid rotation w/ Flags as an object', function () {
    tx.Flags = { tfHolderKeyRotation: true }
    assertValid(tx)
  })

  it('verifies a valid recovery', function () {
    tx.Flags = tfHolderKeyRecovery
    delete tx.ConfidentialBalanceSpending
    delete tx.ConfidentialBalanceInbox
    assertValid(tx)
  })

  it('verifies a valid recovery cancel', function () {
    tx = {
      TransactionType: 'ConfidentialMPTHolderKeyUpdate',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      Flags: tfCancelRecovery,
    }
    assertValid(tx)
  })

  it('has the network flag values', function () {
    expect([
      tfHolderKeyRotation,
      tfHolderKeyRecovery,
      tfCancelRecovery,
    ]).toEqual([0x00010000, 0x00020000, 0x00040000])
  })

  it('throws w/ missing MPTokenIssuanceID', function () {
    delete tx.MPTokenIssuanceID
    assertInvalid(
      tx,
      'ConfidentialMPTHolderKeyUpdate: missing field MPTokenIssuanceID',
    )
  })

  it('throws w/ no mode flag', function () {
    tx.Flags = 0
    assertInvalid(
      tx,
      'ConfidentialMPTHolderKeyUpdate: set exactly one of tfHolderKeyRotation, tfHolderKeyRecovery and tfCancelRecovery',
    )
  })

  it('throws w/ two mode flags', function () {
    tx.Flags = { tfHolderKeyRotation: true, tfHolderKeyRecovery: true }
    assertInvalid(
      tx,
      'ConfidentialMPTHolderKeyUpdate: set exactly one of tfHolderKeyRotation, tfHolderKeyRecovery and tfCancelRecovery',
    )
  })

  it('throws w/ the issuer as Account', function () {
    tx.MPTokenIssuanceID = ISSUER_MPT_ID
    assertInvalid(
      tx,
      'ConfidentialMPTHolderKeyUpdate: the issuer cannot hold confidential balances',
    )
  })

  it('throws w/ a recovery cancel carrying a ZKProof', function () {
    tx = {
      TransactionType: 'ConfidentialMPTHolderKeyUpdate',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      Flags: tfCancelRecovery,
      ZKProof: PROOF,
    }
    assertInvalid(
      tx,
      'ConfidentialMPTHolderKeyUpdate: tfCancelRecovery carries no HolderEncryptionKey, balances or ZKProof',
    )
  })

  it('throws w/ a rotation without HolderEncryptionKey', function () {
    delete tx.HolderEncryptionKey
    assertInvalid(
      tx,
      'ConfidentialMPTHolderKeyUpdate: tfHolderKeyRotation and tfHolderKeyRecovery require HolderEncryptionKey and ZKProof',
    )
  })

  it('throws w/ a recovery without ZKProof', function () {
    tx.Flags = tfHolderKeyRecovery
    delete tx.ConfidentialBalanceSpending
    delete tx.ConfidentialBalanceInbox
    delete tx.ZKProof
    assertInvalid(
      tx,
      'ConfidentialMPTHolderKeyUpdate: tfHolderKeyRotation and tfHolderKeyRecovery require HolderEncryptionKey and ZKProof',
    )
  })

  it('throws w/ a rotation without ConfidentialBalanceInbox', function () {
    delete tx.ConfidentialBalanceInbox
    assertInvalid(
      tx,
      'ConfidentialMPTHolderKeyUpdate: tfHolderKeyRotation requires ConfidentialBalanceSpending and ConfidentialBalanceInbox',
    )
  })

  it('throws w/ a recovery carrying ConfidentialBalanceSpending', function () {
    tx.Flags = tfHolderKeyRecovery
    delete tx.ConfidentialBalanceInbox
    assertInvalid(
      tx,
      'ConfidentialMPTHolderKeyUpdate: tfHolderKeyRecovery must not carry ConfidentialBalanceSpending or ConfidentialBalanceInbox',
    )
  })

  it('throws w/ a HolderEncryptionKey that is not 33 bytes', function () {
    tx.HolderEncryptionKey = 'AB'.repeat(32)
    assertInvalid(
      tx,
      'ConfidentialMPTHolderKeyUpdate: invalid field HolderEncryptionKey',
    )
  })

  it('throws w/ a ConfidentialBalanceSpending that is not 66 bytes', function () {
    tx.ConfidentialBalanceSpending = 'AB'.repeat(65)
    assertInvalid(
      tx,
      'ConfidentialMPTHolderKeyUpdate: invalid field ConfidentialBalanceSpending',
    )
  })

  it('throws w/ a non-hex ZKProof', function () {
    tx.ZKProof = 'not hex'
    assertInvalid(tx, 'ConfidentialMPTHolderKeyUpdate: invalid field ZKProof')
  })
})
