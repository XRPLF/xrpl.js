import { assert } from 'chai'

import { validateOfferCancel, validate } from 'xrpl-local'
import { ValidationError } from 'xrpl-local/common/errors'

/**
 * OfferCancel Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('OfferCancel', function () {
  let offer

  beforeEach(function () {
    offer = {
      Account: 'rnKiczmiQkZFiDES8THYyLA2pQohC5C6EF',
      Fee: '10',
      LastLedgerSequence: 65477334,
      OfferSequence: 60797528,
      Sequence: 60797535,
      Flags: 2147483648,
      SigningPubKey:
        '0369C9BC4D18FAE741898828A1F48E53E53F6F3DB3191441CC85A14D4FC140E031',
      TransactionType: 'OfferCancel',
      TxnSignature:
        '304402203EC848BD6AB42DC8509285245804B15E1652092CC0B189D369E12E563771D049022046DF40C16EA05DC99D01E553EA2E218FCA1C5B38927889A2BDF064D1F44D60F0',
    } as any
  })

  it(`verifies valid OfferCancel`, function () {
    assert.doesNotThrow(() => validateOfferCancel(offer))
    assert.doesNotThrow(() => validate(offer))
  })

  it(`verifies valid OfferCancel with flags`, function () {
    offer.Flags = 2147483648
    assert.doesNotThrow(() => validateOfferCancel(offer))
    assert.doesNotThrow(() => validate(offer))
  })

  it(`throws w/ OfferSequence must be a number`, function () {
    offer.OfferSequence = '99'
    assert.throws(
      () => validateOfferCancel(offer),
      ValidationError,
      'OfferCancel: OfferSequence must be a number',
    )
    assert.throws(
      () => validate(offer),
      ValidationError,
      'OfferCancel: OfferSequence must be a number',
    )
  })

  it(`throws w/ missing OfferSequence`, function () {
    delete offer.OfferSequence
    assert.throws(
      () => validateOfferCancel(offer),
      ValidationError,
      'OfferCancel: missing field OfferSequence',
    )
    assert.throws(
      () => validate(offer),
      ValidationError,
      'OfferCancel: missing field OfferSequence',
    )
  })
})
