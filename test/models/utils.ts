/* eslint-disable no-bitwise -- flags require bitwise operations */
import { assert } from 'chai'

import {
  DepositPreauth,
  OfferCreate,
  OfferCreateTransactionFlags,
  PaymentChannelClaim,
  PaymentChannelClaimTransactionFlags,
  Payment,
  PaymentTransactionFlags,
  TrustSet,
  TrustSetTransactionFlags,
} from 'xrpl-local'

import {
  isFlagEnabled,
  setTransactionFlagsToNumber,
} from '../../src/models/utils'

/**
 * Utils Testing.
 *
 * Provides tests for utils used in models.
 */
describe('Models Utils', function () {
  describe('isFlagEnabled', function () {
    let flags: number
    const flag1 = 0x00010000
    const flag2 = 0x00020000

    beforeEach(function () {
      flags = 0x00000000
    })

    it('verifies a flag is enabled', function () {
      flags |= flag1 | flag2
      assert.isTrue(isFlagEnabled(flags, flag1))
    })

    it('verifies a flag is not enabled', function () {
      flags |= flag2
      assert.isFalse(isFlagEnabled(flags, flag1))
    })
  })

  describe('setTransactionFlagsToNumber', function () {
    it('sets OfferCreateFlags to its numeric value', function () {
      const tx: OfferCreate = {
        Account: 'r3rhWeE31Jt5sWmi4QiGLMZnY3ENgqw96W',
        Fee: '10',
        TakerGets: {
          currency: 'DSH',
          issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
          value: '43.11584856965009',
        },
        TakerPays: '12928290425',
        TransactionType: 'OfferCreate',
        TxnSignature:
          '3045022100D874CDDD6BB24ED66E83B1D3574D3ECAC753A78F26DB7EBA89EAB8E7D72B95F802207C8CCD6CEA64E4AE2014E59EE9654E02CA8F03FE7FCE0539E958EAE182234D91',
        Flags: {
          tfPassive: true,
          tfImmediateOrCancel: false,
          tfFillOrKill: true,
          tfSell: false,
        },
      }

      const { tfPassive, tfFillOrKill } = OfferCreateTransactionFlags
      const expected: number = tfPassive | tfFillOrKill

      setTransactionFlagsToNumber(tx)
      assert.strictEqual(tx.Flags, expected)
    })

    it('sets PaymentChannelClaimFlags to its numeric value', function () {
      const tx: PaymentChannelClaim = {
        Account: 'r...',
        TransactionType: 'PaymentChannelClaim',
        Channel:
          'C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198',
        Flags: {
          tfRenew: true,
          tfClose: false,
        },
      }

      const { tfRenew } = PaymentChannelClaimTransactionFlags
      const expected: number = tfRenew

      setTransactionFlagsToNumber(tx)
      assert.strictEqual(tx.Flags, expected)
    })

    it('sets PaymentTransactionFlags to its numeric value', function () {
      const tx: Payment = {
        TransactionType: 'Payment',
        Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
        Amount: '1234',
        Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
        Flags: {
          tfNoDirectRipple: false,
          tfPartialPayment: true,
          tfLimitQuality: true,
        },
      }

      const { tfPartialPayment, tfLimitQuality } = PaymentTransactionFlags
      const expected: number = tfPartialPayment | tfLimitQuality

      setTransactionFlagsToNumber(tx)
      assert.strictEqual(tx.Flags, expected)
    })

    it('sets TrustSetFlags to its numeric value', function () {
      const tx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
        LimitAmount: {
          currency: 'XRP',
          issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
          value: '4329.23',
        },
        QualityIn: 1234,
        QualityOut: 4321,
        Flags: {
          tfSetfAuth: true,
          tfSetNoRipple: false,
          tfClearNoRipple: true,
          tfSetFreeze: false,
          tfClearFreeze: true,
        },
      }

      const { tfSetfAuth, tfClearNoRipple, tfClearFreeze } =
        TrustSetTransactionFlags
      const expected: number = tfSetfAuth | tfClearNoRipple | tfClearFreeze

      setTransactionFlagsToNumber(tx)
      assert.strictEqual(tx.Flags, expected)
    })

    it('sets other transaction types flags to its numeric value', function () {
      const tx: DepositPreauth = {
        TransactionType: 'DepositPreauth',
        Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
        Flags: {},
      }

      setTransactionFlagsToNumber(tx)
      assert.strictEqual(tx.Flags, 0)
    })
  })
})
