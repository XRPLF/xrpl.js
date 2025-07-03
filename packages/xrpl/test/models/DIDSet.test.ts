import { validateDIDSet } from '../../src/models/transactions/DIDSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateDIDSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateDIDSet, message)

/**
 * DIDSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('DIDSet', function () {
  let tx: any

  beforeEach(function () {
    tx = {
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Data: '617474657374',
      DIDDocument: '646F63',
      Fee: '10',
      Flags: 2147483648,
      Sequence: 3,
      TransactionType: 'DIDSet',
      URI: '6469645F6578616D706C65',
    } as any
  })

  it('verifies valid DIDSet', function () {
    assertValid(tx)
  })

  it('throws w/ invalid Data', function () {
    tx.Data = 123

    assertInvalid(tx, 'DIDSet: invalid field Data')
  })

  it('throws w/ invalid DIDDocument', function () {
    tx.DIDDocument = 123

    assertInvalid(tx, 'DIDSet: invalid field DIDDocument')
  })

  it('throws w/ invalid URI', function () {
    tx.URI = 123

    assertInvalid(tx, 'DIDSet: invalid field URI')
  })

  it('throws w/ empty DID', function () {
    delete tx.Data
    delete tx.DIDDocument
    delete tx.URI

    assertInvalid(
      tx,
      'DIDSet: Must have at least one of `Data`, `DIDDocument`, and `URI`',
    )
  })
})
