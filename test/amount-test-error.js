'use strict';
const assert = require('assert');
const Amount = require('ripple-lib').Amount;
const Remote = require('ripple-lib').Remote;

const data = require('./fixtures/negative-error');


describe.skip('Amount ', function() {
  it('Show "Offer total cannot be negative" error', function() {
    const a1 = {
      currency: 'JPY',
      issuer: 'r94s8px6kSw1uZ1MV98dhSRTvc6VMPoPcN',
      value: '66436.33517689175'
    };
    const a2 = {
      currency: 'JPY',
      issuer: 'r94s8px6kSw1uZ1MV98dhSRTvc6VMPoPcN',
      value: '66435.49665972557'
    };
    const a1a = Amount.from_json(a1);
    const res = a1a.add(a2).subtract(a2).subtract(a1);

    console.log(res.to_human());
    assert(!res.is_negative(), 'Offer total cannot be negative');
  });

  it('Show Details of "Offer total cannot be negative" error', function() {
    const book = new Remote().createOrderBook({
      currency_gets: 'JPY',
      issuer_gets: 'r94s8px6kSw1uZ1MV98dhSRTvc6VMPoPcN',
      currency_pays: 'XRP'
    });
    book._subscribed = true;
    book._synced = true;
    book._offers = data._offers;
    book._offerCounts = data._offerCounts;
    book._ownerFundsUnadjusted = data._ownerFundsUnadjusted;
    book._ownerFunds = data._ownerFunds;
    book._ownerOffersTotal = data._ownerOffersTotal;
    book._issuerTransferRate = 1000000000;
    book._remote._handleTransaction(data.message1);
    book._remote._handleTransaction(data.lastMessage);
  });

});
