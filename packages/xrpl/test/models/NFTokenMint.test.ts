import { stringToHex } from '@xrplf/isomorphic/src/utils'

import { NFTokenMintFlags } from '../../src'
import { validateNFTokenMint } from '../../src/models/transactions/NFTokenMint'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateNFTokenMint)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateNFTokenMint, message)

/**
 * NFTokenMint Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('NFTokenMint', function () {
  it(`verifies valid NFTokenMint`, function () {
    const validNFTokenMint = {
      TransactionType: 'NFTokenMint',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: {
        tfTransferable: true,
      },
      NFTokenTaxon: 0,
      Issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      TransferFee: 1,
      URI: stringToHex('http://xrpl.org'),
    } as any

    assertValid(validNFTokenMint)
  })

  it(`verifies valid NFTokenMint with Amount, Destination and Expiration`, function () {
    const valid = {
      TransactionType: 'NFTokenMint',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      NFTokenTaxon: 0,
      Issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Amount: '1000000',
      Destination: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Expiration: 123456,
    } as any

    assertValid(valid)
  })

  it(`throws w/ missing NFTokenTaxon`, function () {
    const invalid = {
      TransactionType: 'NFTokenMint',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: NFTokenMintFlags.tfTransferable,
      Issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      TransferFee: 1,
      URI: stringToHex('http://xrpl.org'),
    } as any

    assertInvalid(invalid, 'NFTokenMint: missing field NFTokenTaxon')
  })

  it(`throws w/ Account === Issuer`, function () {
    const invalid = {
      TransactionType: 'NFTokenMint',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: NFTokenMintFlags.tfTransferable,
      Issuer: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      TransferFee: 1,
      NFTokenTaxon: 0,
      URI: stringToHex('http://xrpl.org'),
    } as any

    assertInvalid(invalid, 'NFTokenMint: Issuer must not be equal to Account')
  })

  it(`throws w/ URI being an empty string`, function () {
    const invalid = {
      TransactionType: 'NFTokenMint',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: NFTokenMintFlags.tfTransferable,
      NFTokenTaxon: 0,
      Issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      TransferFee: 1,
      URI: '',
    } as any

    assertInvalid(invalid, 'NFTokenMint: URI must not be empty string')
  })

  it(`throws w/ URI not in hex format`, function () {
    const invalid = {
      TransactionType: 'NFTokenMint',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: NFTokenMintFlags.tfTransferable,
      NFTokenTaxon: 0,
      Issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      TransferFee: 1,
      URI: 'http://xrpl.org',
    } as any

    assertInvalid(invalid, 'NFTokenMint: URI must be in hex format')
  })

  it(`throws when Amount is null but Expiration is present`, function () {
    const invalid = {
      TransactionType: 'NFTokenMint',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      NFTokenTaxon: 0,
      Issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Expiration: 123456,
    } as any

    assertInvalid(
      invalid,
      'NFTokenMint: Amount is required when Expiration or Destination is present',
    )
  })

  it(`throws when Amount is null but Destination is present`, function () {
    const invalid = {
      TransactionType: 'NFTokenMint',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      NFTokenTaxon: 0,
      Issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      Destination: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
    } as any

    assertInvalid(
      invalid,
      'NFTokenMint: Amount is required when Expiration or Destination is present',
    )
  })
})
