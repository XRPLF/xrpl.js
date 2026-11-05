import { stringToHex } from '@xrplf/isomorphic/utils'

import {
  TokenIssuanceCreate,
  TokenIssuanceCreateFlags,
} from '../../src/models/transactions'
import { validateTokenIssuanceCreate } from '../../src/models/transactions/tokenIssuanceCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateTokenIssuanceCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateTokenIssuanceCreate, message)

const MPT_ISSUANCE_ID = '0000000101476926B590BA3245F63C829116A0A3AF7F382D'

/**
 * TokenIssuanceCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('TokenIssuanceCreate', function () {
  let tx: TokenIssuanceCreate

  beforeEach(function () {
    tx = {
      TransactionType: 'TokenIssuanceCreate',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Currency: 'USD',
    }
  })

  it('verifies valid TokenIssuanceCreate', function () {
    assertValid(tx)
  })

  it('verifies valid TokenIssuanceCreate with every optional field', function () {
    tx.MaximumAmount = '1000000000000000'
    tx.TokenScale = 18
    tx.MPTokenIssuanceID = MPT_ISSUANCE_ID
    tx.TransferFee = 50000
    tx.MPTokenMetadata = stringToHex('a'.repeat(1024))
    tx.Flags = TokenIssuanceCreateFlags.tfTokenCannotLock
    assertValid(tx)
  })

  it('verifies valid TokenIssuanceCreate with a hex Currency', function () {
    tx.Currency = '0158415500000000C1F76FF6ECB0BAC600000000'
    assertValid(tx)
  })

  it('verifies valid TokenIssuanceCreate with tfTokenCannotLock as a flag map', function () {
    tx.Flags = { tfTokenCannotLock: true }
    assertValid(tx)
  })

  it('throws w/ missing Currency', function () {
    // @ts-expect-error for test
    tx.Currency = undefined
    assertInvalid(tx, 'TokenIssuanceCreate: missing field Currency')
  })

  it('throws w/ non-string Currency', function () {
    // @ts-expect-error for test
    tx.Currency = { currency: 'USD' }
    assertInvalid(tx, 'TokenIssuanceCreate: invalid field Currency')
  })

  it('throws w/ malformed Currency', function () {
    tx.Currency = 'USDC'
    assertInvalid(tx, 'TokenIssuanceCreate: invalid field Currency')
  })

  it('throws w/ the reserved XRP-coded hex Currency', function () {
    tx.Currency = '0000000000000000000000005852500000000000'
    assertInvalid(tx, 'TokenIssuanceCreate: invalid field Currency')
  })

  it('throws w/ XRP as Currency', function () {
    tx.Currency = 'XRP'
    assertInvalid(tx, 'TokenIssuanceCreate: Currency must not be XRP')
  })

  it('throws w/ the all-zero hex Currency', function () {
    tx.Currency = '0'.repeat(40)
    assertInvalid(tx, 'TokenIssuanceCreate: Currency must not be XRP')
  })

  describe('fee, metadata, base units and flags', function () {
    it('throws w/ non-number TransferFee', function () {
      // @ts-expect-error for test
      tx.TransferFee = '10'
      assertInvalid(tx, 'TokenIssuanceCreate: invalid field TransferFee')
    })

    it('throws w/ TransferFee above 50000', function () {
      tx.TransferFee = 50001
      assertInvalid(
        tx,
        'TokenIssuanceCreate: TransferFee must be an integer between 0 and 50000',
      )
    })

    it('throws w/ non-string MPTokenMetadata', function () {
      // @ts-expect-error for test
      tx.MPTokenMetadata = 123
      assertInvalid(tx, 'TokenIssuanceCreate: invalid field MPTokenMetadata')
    })

    it('throws w/ empty MPTokenMetadata', function () {
      tx.MPTokenMetadata = ''
      assertInvalid(
        tx,
        'TokenIssuanceCreate: MPTokenMetadata must be a non-empty hex string of at most 1024 bytes',
      )
    })

    it('throws w/ MPTokenMetadata not hex', function () {
      tx.MPTokenMetadata = 'zznothex'
      assertInvalid(
        tx,
        'TokenIssuanceCreate: MPTokenMetadata must be a non-empty hex string of at most 1024 bytes',
      )
    })

    it('throws w/ MPTokenMetadata above 1024 bytes', function () {
      tx.MPTokenMetadata = stringToHex('a'.repeat(1025))
      assertInvalid(
        tx,
        'TokenIssuanceCreate: MPTokenMetadata must be a non-empty hex string of at most 1024 bytes',
      )
    })

    it('throws w/ non-string MaximumAmount', function () {
      // @ts-expect-error for test
      tx.MaximumAmount = 100
      tx.TokenScale = 2
      assertInvalid(tx, 'TokenIssuanceCreate: invalid field MaximumAmount')
    })

    it('throws w/ zero MaximumAmount', function () {
      tx.MaximumAmount = '0'
      tx.TokenScale = 2
      assertInvalid(
        tx,
        'TokenIssuanceCreate: MaximumAmount must be an integer between 1 and 1000000000000000',
      )
    })

    it('throws w/ MaximumAmount above 10^15', function () {
      tx.MaximumAmount = '1000000000000001'
      tx.TokenScale = 2
      assertInvalid(
        tx,
        'TokenIssuanceCreate: MaximumAmount must be an integer between 1 and 1000000000000000',
      )
    })

    it('throws w/ non-integer MaximumAmount', function () {
      tx.MaximumAmount = '1.5'
      tx.TokenScale = 2
      assertInvalid(
        tx,
        'TokenIssuanceCreate: MaximumAmount must be an integer between 1 and 1000000000000000',
      )
    })

    it('throws w/ non-number TokenScale', function () {
      // @ts-expect-error for test
      tx.TokenScale = '2'
      assertInvalid(tx, 'TokenIssuanceCreate: invalid field TokenScale')
    })

    it('throws w/ TokenScale above 18', function () {
      tx.TokenScale = 19
      assertInvalid(
        tx,
        'TokenIssuanceCreate: TokenScale must be an integer between 0 and 18',
      )
    })

    it('throws w/ invalid MPTokenIssuanceID', function () {
      tx.MPTokenIssuanceID = 'ABCD'
      tx.TokenScale = 2
      assertInvalid(tx, 'TokenIssuanceCreate: invalid field MPTokenIssuanceID')
    })

    it('throws w/ MaximumAmount but no TokenScale', function () {
      tx.MaximumAmount = '1000'
      assertInvalid(
        tx,
        'TokenIssuanceCreate: TokenScale is required with MaximumAmount or MPTokenIssuanceID',
      )
    })

    it('throws w/ MPTokenIssuanceID but no TokenScale', function () {
      tx.MPTokenIssuanceID = MPT_ISSUANCE_ID
      assertInvalid(
        tx,
        'TokenIssuanceCreate: TokenScale is required with MaximumAmount or MPTokenIssuanceID',
      )
    })

    it('throws w/ an unknown flag', function () {
      tx.Flags = 0x00000002
      assertInvalid(tx, 'TokenIssuanceCreate: invalid Flags')
    })

    it('allows the universal flags', function () {
      tx.Flags = 0x80000000 + TokenIssuanceCreateFlags.tfTokenCannotLock
      assertValid(tx)
    })
  })
})
