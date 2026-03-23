import { stringToHex } from '@xrplf/isomorphic/utils'

import { validateCredentialCreate } from '../../src/models/transactions/CredentialCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateCredentialCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateCredentialCreate, message)

/**
 * CredentialCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('credentialCreate', function () {
  let credentialCreate: any

  beforeEach(function () {
    credentialCreate = {
      TransactionType: 'CredentialCreate',
      Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Subject: 'rNdY9XDnQ4Dr1EgefwU3CBRuAjt3sAutGg',
      CredentialType: stringToHex('Passport'),
      Expiration: 1212025,
      URI: stringToHex('TestURI'),
      Sequence: 1337,
      Flags: 0,
    } as any
  })

  it(`verifies valid credentialCreate`, function () {
    assertValid(credentialCreate)
  })

  it(`throws w/ missing field Account`, function () {
    credentialCreate.Account = undefined
    const errorMessage = 'CredentialCreate: missing field Account'
    assertInvalid(credentialCreate, errorMessage)
  })

  it(`throws w/ Account not string`, function () {
    credentialCreate.Account = 123
    const errorMessage = 'CredentialCreate: invalid field Account'
    assertInvalid(credentialCreate, errorMessage)
  })

  it(`throws w/ missing field Subject`, function () {
    credentialCreate.Subject = undefined
    const errorMessage = 'CredentialCreate: missing field Subject'
    assertInvalid(credentialCreate, errorMessage)
  })

  it(`throws w/ Subject not string`, function () {
    credentialCreate.Subject = 123
    const errorMessage = 'CredentialCreate: invalid field Subject'
    assertInvalid(credentialCreate, errorMessage)
  })

  it(`throws w/ missing field credentialType`, function () {
    credentialCreate.CredentialType = undefined
    const errorMessage = 'CredentialCreate: missing field CredentialType'
    assertInvalid(credentialCreate, errorMessage)
  })

  it(`throws w/ credentialType field too long`, function () {
    credentialCreate.CredentialType = stringToHex('A'.repeat(129))
    const errorMessage =
      'CredentialCreate: CredentialType length cannot be > 128'
    assertInvalid(credentialCreate, errorMessage)
  })

  it(`throws w/ credentialType field empty`, function () {
    credentialCreate.CredentialType = ''
    const errorMessage =
      'CredentialCreate: CredentialType cannot be an empty string'
    assertInvalid(credentialCreate, errorMessage)
  })

  it(`throws w/ credentialType field not hex`, function () {
    credentialCreate.CredentialType = 'this is not hex'
    const errorMessage =
      'CredentialCreate: CredentialType must be encoded in hex'
    assertInvalid(credentialCreate, errorMessage)
  })

  it(`throws w/ Expiration field not number`, function () {
    credentialCreate.Expiration = 'this is not a number'
    const errorMessage = 'CredentialCreate: invalid field Expiration'
    assertInvalid(credentialCreate, errorMessage)
  })

  it(`throws w/ URI field not a string`, function () {
    credentialCreate.URI = 123
    const errorMessage = 'CredentialCreate: invalid field URI'
    assertInvalid(credentialCreate, errorMessage)
  })

  it(`throws w/ URI field empty`, function () {
    credentialCreate.URI = ''
    const errorMessage = 'CredentialCreate: URI cannot be an empty string'
    assertInvalid(credentialCreate, errorMessage)
  })

  it(`throws w/ URI field too long`, function () {
    credentialCreate.URI = stringToHex('A'.repeat(129))
    const errorMessage = 'CredentialCreate: URI length must be <= 256'
    assertInvalid(credentialCreate, errorMessage)
  })

  it(`throws w/ URI field not hex`, function () {
    credentialCreate.URI = 'this is not hex'
    const errorMessage = 'CredentialCreate: URI must be encoded in hex'
    assertInvalid(credentialCreate, errorMessage)
  })
})
