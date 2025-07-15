import { stringToHex } from '@xrplf/isomorphic/src/utils'

import { validateNFTokenModify } from '../../src/models/transactions/NFTokenModify'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateNFTokenModify)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateNFTokenModify, message)

const TOKEN_ID =
  '00090032B5F762798A53D543A014CAF8B297CFF8F2F937E844B17C9E00000003'

/**
 * NFTokenModify Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('NFTokenModify', function () {
  it(`verifies valid NFTokenModify`, function () {
    const validNFTokenModify = {
      TransactionType: 'NFTokenModify',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      NFTokenID: TOKEN_ID,
      Fee: '5000000',
      Sequence: 2470665,
      URI: stringToHex('http://xrpl.org'),
    } as any

    assertValid(validNFTokenModify)
  })

  it(`throws w/ missing NFTokenID`, function () {
    const invalid = {
      TransactionType: 'NFTokenModify',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
    } as any

    assertInvalid(invalid, 'NFTokenModify: missing field NFTokenID')
  })

  it(`throws w/ URI being an empty string`, function () {
    const invalid = {
      TransactionType: 'NFTokenModify',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      NFTokenID: TOKEN_ID,
      Fee: '5000000',
      Sequence: 2470665,
      URI: '',
    } as any

    assertInvalid(invalid, 'NFTokenModify: URI must not be empty string')
  })

  it(`throws w/ URI not in hex format`, function () {
    const invalid = {
      TransactionType: 'NFTokenModify',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      NFTokenID: TOKEN_ID,
      Fee: '5000000',
      Sequence: 2470665,
      URI: '--',
    } as any

    assertInvalid(invalid, 'NFTokenModify: URI must be in hex format')
  })
})
