/* eslint-disable no-bitwise -- flags require bitwise operations */
import { assert } from 'chai'

import {
  DepositPreauth,
  OfferCreate,
  OfferCreateFlags,
  PaymentChannelClaim,
  PaymentChannelClaimFlags,
  Payment,
  PaymentFlags,
  TrustSet,
  TrustSetFlags,
} from '../../src'
import { AccountRootFlags } from '../../src/models/ledger'
import { isFlagEnabled } from '../../src/models/utils'
import {
  setTransactionFlagsToNumber,
  parseAccountRootFlags,
  parseTransactionFlags,
} from '../../src/models/utils/flags'

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

      const { tfPassive, tfFillOrKill } = OfferCreateFlags
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

      const { tfRenew } = PaymentChannelClaimFlags
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
          tfNoRippleDirect: false,
          tfPartialPayment: true,
          tfLimitQuality: true,
        },
      }

      const { tfPartialPayment, tfLimitQuality } = PaymentFlags
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

      const { tfSetfAuth, tfClearNoRipple, tfClearFreeze } = TrustSetFlags
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

    // eslint-disable-next-line complexity -- Simpler to list them all out at once.
    it('parseAccountRootFlags all enabled', function () {
      const accountRootFlags =
        AccountRootFlags.lsfDefaultRipple |
        AccountRootFlags.lsfDepositAuth |
        AccountRootFlags.lsfDisableMaster |
        AccountRootFlags.lsfDisallowXRP |
        AccountRootFlags.lsfGlobalFreeze |
        AccountRootFlags.lsfNoFreeze |
        AccountRootFlags.lsfPasswordSpent |
        AccountRootFlags.lsfRequireAuth |
        AccountRootFlags.lsfRequireDestTag |
        AccountRootFlags.lsfDisallowIncomingNFTokenOffer |
        AccountRootFlags.lsfDisallowIncomingCheck |
        AccountRootFlags.lsfDisallowIncomingPayChan |
        AccountRootFlags.lsfDisallowIncomingTrustline |
        AccountRootFlags.lsfAllowTrustLineClawback

      const parsed = parseAccountRootFlags(accountRootFlags)

      assert.isTrue(
        parsed.lsfDefaultRipple &&
          parsed.lsfDepositAuth &&
          parsed.lsfDisableMaster &&
          parsed.lsfDisallowXRP &&
          parsed.lsfGlobalFreeze &&
          parsed.lsfNoFreeze &&
          parsed.lsfPasswordSpent &&
          parsed.lsfRequireAuth &&
          parsed.lsfRequireDestTag &&
          parsed.lsfDisallowIncomingNFTokenOffer &&
          parsed.lsfDisallowIncomingCheck &&
          parsed.lsfDisallowIncomingPayChan &&
          parsed.lsfDisallowIncomingTrustline &&
          parsed.lsfAllowTrustLineClawback,
      )
    })

    it('parseAccountFlags all false', function () {
      const parsed = parseAccountRootFlags(0)

      assert.isUndefined(parsed.lsfDefaultRipple)
      assert.isUndefined(parsed.lsfDepositAuth)
      assert.isUndefined(parsed.lsfDisableMaster)
      assert.isUndefined(parsed.lsfDisallowXRP)
      assert.isUndefined(parsed.lsfGlobalFreeze)
      assert.isUndefined(parsed.lsfNoFreeze)
      assert.isUndefined(parsed.lsfPasswordSpent)
      assert.isUndefined(parsed.lsfRequireAuth)
      assert.isUndefined(parsed.lsfRequireDestTag)
      assert.isUndefined(parsed.lsfDisallowIncomingNFTokenOffer)
      assert.isUndefined(parsed.lsfDisallowIncomingCheck)
      assert.isUndefined(parsed.lsfDisallowIncomingPayChan)
      assert.isUndefined(parsed.lsfDisallowIncomingTrustline)
      assert.isUndefined(parsed.lsfAllowTrustLineClawback)
    })

    it('parseTransactionFlags all enabled', function () {
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

      const expected = {
        tfRenew: true,
      }

      const flagsMap = parseTransactionFlags(tx)
      assert.notStrictEqual(flagsMap, expected)
    })

    it('parseTransactionFlags all false', function () {
      const tx: PaymentChannelClaim = {
        Account: 'r...',
        TransactionType: 'PaymentChannelClaim',
        Channel:
          'C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198',
        Flags: {
          tfRenew: false,
          tfClose: false,
        },
      }

      const expected = {}

      const flagsMap = parseTransactionFlags(tx)
      assert.notStrictEqual(flagsMap, expected)
    })

    it('parseTransactionFlags flag is already numeric', function () {
      const tx: PaymentChannelClaim = {
        Account: 'r...',
        TransactionType: 'PaymentChannelClaim',
        Channel:
          'C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198',
        Flags: 65536,
      }

      const expected = {
        tfRenew: true,
      }

      const flagsMap = parseTransactionFlags(tx)
      assert.notStrictEqual(flagsMap, expected)
    })
  })
})
