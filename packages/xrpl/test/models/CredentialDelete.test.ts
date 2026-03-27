import { stringToHex } from '@xrplf/isomorphic/utils'

import { validateCredentialDelete } from '../../src/models/transactions/CredentialDelete'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateCredentialDelete)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateCredentialDelete, message)

/**
 * CredentialDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CredentialDelete', function () {
  let credentialDelete: any

  beforeEach(function () {
    credentialDelete = {
      TransactionType: 'CredentialDelete',
      Issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Subject: 'rNdY9XDnQ4Dr1EgefwU3CBRuAjt3sAutGg',
      Account: 'rNdY9XDnQ4Dr1EgefwU3CBRuAjt3sAutGg',
      CredentialType: stringToHex('Passport'),
      Sequence: 1337,
      Flags: 0,
    } as any
  })

  it(`verifies valid credentialDelete`, function () {
    assertValid(credentialDelete)
  })

  it(`throws w/ missing field Account`, function () {
    credentialDelete.Account = undefined
    const errorMessage = 'CredentialDelete: missing field Account'
    assertInvalid(credentialDelete, errorMessage)
  })

  it(`throws w/ Account not string`, function () {
    credentialDelete.Account = 123
    const errorMessage = 'CredentialDelete: invalid field Account'
    assertInvalid(credentialDelete, errorMessage)
  })

  it(`throws w/ Subject not string`, function () {
    credentialDelete.Subject = 123
    const errorMessage = 'CredentialDelete: invalid field Subject'
    assertInvalid(credentialDelete, errorMessage)
  })

  it(`throws w/ Issuer not string`, function () {
    credentialDelete.Issuer = 123
    const errorMessage = 'CredentialDelete: invalid field Issuer'
    assertInvalid(credentialDelete, errorMessage)
  })

  it(`throws w/ missing field Subject and Issuer`, function () {
    credentialDelete.Subject = undefined
    credentialDelete.Issuer = undefined
    const errorMessage =
      'CredentialDelete: either `Issuer` or `Subject` must be provided'
    assertInvalid(credentialDelete, errorMessage)
  })

  it(`throws w/ missing field credentialType`, function () {
    credentialDelete.CredentialType = undefined
    const errorMessage = 'CredentialDelete: missing field CredentialType'
    assertInvalid(credentialDelete, errorMessage)
  })

  it(`throws w/ credentialType field too long`, function () {
    credentialDelete.CredentialType = stringToHex('A'.repeat(129))
    const errorMessage =
      'CredentialDelete: CredentialType length cannot be > 128'
    assertInvalid(credentialDelete, errorMessage)
  })

  it(`throws w/ credentialType field empty`, function () {
    credentialDelete.CredentialType = ''
    const errorMessage =
      'CredentialDelete: CredentialType cannot be an empty string'
    assertInvalid(credentialDelete, errorMessage)
  })

  it(`throws w/ credentialType field not hex`, function () {
    credentialDelete.CredentialType = 'this is not hex'
    const errorMessage =
      'CredentialDelete: CredentialType must be encoded in hex'
    assertInvalid(credentialDelete, errorMessage)
  })
})
