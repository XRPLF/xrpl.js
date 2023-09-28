import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateDIDSet } from '../../src/models/transactions/DIDSet'

/**
 * DIDSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('DIDSet', function () {
  let tx

  beforeEach(function () {
    tx = {
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Attestation: '617474657374',
      DIDDocument: '646F63',
      Fee: '10',
      Flags: 2147483648,
      Sequence: 3,
      TransactionType: 'DIDSet',
      URI: '6469645F6578616D706C65',
    } as any
  })

  it('verifies valid DIDSet', function () {
    assert.doesNotThrow(() => validateDIDSet(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ invalid Attestation', function () {
    tx.Attestation = 123

    assert.throws(
      () => validateDIDSet(tx),
      ValidationError,
      'DIDSet: invalid field Attestation',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'DIDSet: invalid field Attestation',
    )
  })

  it('throws w/ invalid DIDDocument', function () {
    tx.DIDDocument = 123

    assert.throws(
      () => validateDIDSet(tx),
      ValidationError,
      'DIDSet: invalid field DIDDocument',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'DIDSet: invalid field DIDDocument',
    )
  })

  it('throws w/ invalid URI', function () {
    tx.URI = 123

    assert.throws(
      () => validateDIDSet(tx),
      ValidationError,
      'DIDSet: invalid field URI',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'DIDSet: invalid field URI',
    )
  })
})
