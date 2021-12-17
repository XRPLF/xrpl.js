import { assert } from 'chai'
import {
  convertStringToHex,
  validate,
  ValidationError,
  NFTokenMintFlags,
} from 'xrpl-local'

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
      Flags: NFTokenMintFlags.tfTransferable,
      TokenTaxon: 0,
      Issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      TransferFee: 1,
      URI: convertStringToHex('http://xrpl.org'),
    } as any

    assert.doesNotThrow(() => validate(validNFTokenMint))
  })

  it(`throws w/ missing TokenTaxon`, function () {
    const invalid = {
      TransactionType: 'NFTokenMint',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Fee: '5000000',
      Sequence: 2470665,
      Flags: NFTokenMintFlags.tfTransferable,
      Issuer: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
      TransferFee: 1,
      URI: convertStringToHex('http://xrpl.org'),
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenMint: missing field TokenTaxon',
    )
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
      TokenTaxon: 0,
      URI: convertStringToHex('http://xrpl.org'),
    } as any

    assert.throws(
      () => validate(invalid),
      ValidationError,
      'NFTokenMint: Issuer must not be equal to Account',
    )
  })
})
