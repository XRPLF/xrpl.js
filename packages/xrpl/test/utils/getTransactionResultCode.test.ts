import { assert } from 'chai'
import { encode } from 'ripple-binary-codec'

import { getTransactionResultCode } from '../../src'
import { TransactionMetadata } from '../../src/models/transactions/metadata'
import fixtures from '../fixtures/rippled'

const failedMeta: TransactionMetadata = {
  AffectedNodes: [],
  TransactionIndex: 0,
  TransactionResult: 'tecUNFUNDED_PAYMENT',
}

describe('getTransactionResultCode', function () {
  it('gets tesSUCCESS from a validated transaction', function () {
    const result = getTransactionResultCode(fixtures.tx.NFTokenMint.meta)
    assert.equal(result, 'tesSUCCESS')
  })

  it('gets a tec code from a failed but validated transaction', function () {
    const result = getTransactionResultCode(failedMeta)
    assert.equal(result, 'tecUNFUNDED_PAYMENT')
  })

  it('decodes binary-encoded metadata', function () {
    const encoded = encode(failedMeta as never)
    const result = getTransactionResultCode(encoded)
    assert.equal(result, 'tecUNFUNDED_PAYMENT')
  })

  it('throws with a nice error when meta is undefined', function () {
    assert.throws(() => {
      getTransactionResultCode(undefined)
    }, /^Unable to parse the parameter given to getTransactionResultCode.*/u)
  })

  it('throws when given metadata from an un-validated transaction', function () {
    assert.throws(() => {
      // @ts-expect-error -- on purpose, to check the error
      getTransactionResultCode({ AffectedNodes: [], TransactionIndex: 0 })
    }, /Cannot get the transaction result code from an un-validated transaction/u)
  })

  it('throws when TransactionResult is a truthy non-string value', function () {
    assert.throws(() => {
      getTransactionResultCode({
        AffectedNodes: [],
        TransactionIndex: 0,
        // @ts-expect-error -- on purpose, to check the error
        TransactionResult: 105,
      })
    }, /Cannot get the transaction result code from an un-validated transaction/u)
  })
})
