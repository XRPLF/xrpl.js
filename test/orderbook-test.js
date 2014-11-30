var assert = require('assert');
var utils = require('./testutils');
var Remote  = utils.load_module('remote').Remote;
var Currency = utils.load_module('currency').Currency;
var Amount = utils.load_module('amount').Amount;
var Meta = utils.load_module('meta').Meta;

describe('OrderBook', function() {
  it('toJSON', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });
    assert.deepEqual(book.toJSON(), {
      taker_gets: {
        currency: Currency.from_json('XRP').to_hex()
      },
      taker_pays: {
        currency: Currency.from_json('BTC').to_hex(),
        issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji'
      }
    });
    book = new Remote().createOrderBook({
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_gets: 'BTC',
      currency_pays: 'XRP'
    });
    assert.deepEqual(book.toJSON(), {
      taker_gets: {
        currency: Currency.from_json('BTC').to_hex(),
        issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji'
      },
      taker_pays: {
        currency: Currency.from_json('XRP').to_hex()
      },
    });
  });

  it('Check orderbook validity', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });
    assert(book.isValid());
  });

  it('Automatic subscription (based on listeners)', function(done) {
    var book = new Remote().createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });
    book.subscribe = function() {
      done();
    };
    book.on('model', function(){});
  });

  it('Subscribe', function(done) {
    var book = new Remote().createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });

    var requestedOffers = false;

    book.subscribeTransactions = function() {
      assert(requestedOffers);
      done();
    };

    book.requestOffers = function(callback) {
      requestedOffers = true;
      callback();
    };

    book.subscribe();
  });

  it('Unsubscribe', function(done) {
    var book = new Remote().createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });

    book.once('unsubscribe', function() {
      done();
    });

    book.on('model', function(){});

    book.unsubscribe();

    assert(!book._subscribed);
    assert(!book._shouldConnect);
    assert.deepEqual(book.listeners(), []);
  });

  it('Automatic unsubscription (based on listeners)', function(done) {
    var book = new Remote().createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });
    book.unsubscribe = function() {
      done();
    };
    book.on('model', function(){});
    book.removeAllListeners('model');
  });

  it('Add cached owner funds', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });
    book.addCachedFunds('rrrrrrrrrrrrrrrrrrrrBZbvji', '1');
    assert.strictEqual(book.getCachedFunds('rrrrrrrrrrrrrrrrrrrrBZbvji'), '1');
  });

  it('Add cached owner funds - invalid account', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });
    assert.throws(function() {
      book.addCachedFunds('0rrrrrrrrrrrrrrrrrrrrBZbvji', '1');
    });
  });

  it('Has cached owner funds', function() {
    var book =  new Remote().createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });
    book.addCachedFunds('rrrrrrrrrrrrrrrrrrrrBZbvji', '1');
    assert(book.hasCachedFunds('rrrrrrrrrrrrrrrrrrrrBZbvji'));
  });

  it('Has cached owner funds - invalid account', function() {
    var book =  new Remote().createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });
    assert.throws(function() {
      book.addCachedFunds('0rrrrrrrrrrrrrrrrrrrrBZbvji', '1');
    });
  });

  it('Remove cached owner funds', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });
    book.addCachedFunds('rrrrrrrrrrrrrrrrrrrrBZbvji', '1');
    assert(book.hasCachedFunds('rrrrrrrrrrrrrrrrrrrrBZbvji'));
    book.removeCachedFunds('rrrrrrrrrrrrrrrrrrrrBZbvji');
    assert(!book.hasCachedFunds('rrrrrrrrrrrrrrrrrrrrBZbvji'));
  });

  it('Remove cached owner funds', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'BTC',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });
    book.addCachedFunds('rrrrrrrrrrrrrrrrrrrrBZbvji', '1');
    assert(book.hasCachedFunds('rrrrrrrrrrrrrrrrrrrrBZbvji'));
    assert.throws(function() {
      book.removeCachedFunds('0rrrrrrrrrrrrrrrrrrrrBZbvji');
    });
  });

  it('Increment offer count', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'BTC',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });
    assert.strictEqual(book.incrementOfferCount('rrrrrrrrrrrrrrrrrrrrBZbvji'), 1);
    assert.strictEqual(book.getOfferCount('rrrrrrrrrrrrrrrrrrrrBZbvji'), 1);
  });

  it('Increment offer count - invalid address', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'BTC',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });
    assert.throws(function() {
      book.incrementOfferCount('zrrrrrrrrrrrrrrrrrrrBZbvji');
    });
  });

  it('Decrement offer count', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'BTC',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });
    book.incrementOfferCount('rrrrrrrrrrrrrrrrrrrrBZbvji');
    assert.strictEqual(book.decrementOfferCount('rrrrrrrrrrrrrrrrrrrrBZbvji'), 0);
    assert.strictEqual(book.getOfferCount('rrrrrrrrrrrrrrrrrrrrBZbvji'), 0);
  });

  it('Decrement offer count - invalid address', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'BTC',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });
    assert.throws(function() {
      book.decrementOfferCount('zrrrrrrrrrrrrrrrrrrrBZbvji');
    });
  });

  it('Apply transfer rate', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'BTC',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });
    assert.strictEqual(book.applyTransferRate('1', 1002000000), '0.9980039920159681');
  });

  it('Apply transfer rate - cached transfer rate', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'BTC',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });
    book._issuerTransferRate = 1002000000;
    assert.strictEqual(book.applyTransferRate('1'), '0.9980039920159681');
  });

  it('Apply transfer rate - invalid balance', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'BTC',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });
    assert.throws(function() {
      book.applyTransferRate('asdf');
    });
  });

  it('Apply transfer rate - invalid transfer rate', function() {
    var book = new Remote().createOrderBook({
      currency_gets: 'BTC',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });
    assert.throws(function() {
      book.applyTransferRate('1', 'asdf');
    });
  });

  it('Request transfer rate', function() {
    var remote = new Remote();
    var book = remote.createOrderBook({
      currency_gets: 'BTC',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });

    remote.request = function(request) {
      assert.deepEqual(request.message, {
        command: 'account_info',
        id: void(0),
        account: 'rrrrrrrrrrrrrrrrrrrrBZbvji'
      });
      request.emit('success', {
        account_data: {
          TransferRate: 1002000000
        }
      });
    };

    book.requestTransferRate(function(err, rate) {
      assert.ifError(err);
      assert.strictEqual(rate, 1002000000);
    });
  });

  it('Request transfer rate - cached transfer rate', function() {
    var remote = new Remote();
    var book = remote.createOrderBook({
      currency_gets: 'BTC',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });

    book._issuerTransferRate = 1002000000;

    remote.request = function(request) {
      assert(false);
    };

    book.requestTransferRate(function(err, rate) {
      assert.ifError(err);
      assert.strictEqual(rate, 1002000000);
    });
  });

  it('Request transfer rate - native currency', function() {
    var remote = new Remote();
    var book = remote.createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });

    remote.request = function(request) {
      assert(false);
    };

    book.requestTransferRate(function(err, rate) {
      assert.ifError(err);
      assert.strictEqual(rate, 1000000000);
    });
  });

  it('Set funded amount - iou/xrp - funded', function() {
    var remote = new Remote();
    var book = remote.createOrderBook({
      currency_gets: 'BTC',
      currency_pays: 'XRP',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji'
    });

    var offer = {
      TakerGets: {
        value: '100',
        currency: 'BTC',
        issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji'
      },
      TakerPays: '123456'
    };

    book.setFundedAmount(offer, '100.1234');

    var expected = {
      TakerGets: offer.TakerGets,
      TakerPays: offer.TakerPays,
      is_fully_funded: true,
      taker_gets_funded: '100',
      taker_pays_funded: '123456'
    };

    assert.deepEqual(offer, expected);
  });

  it('Set funded amount - iou/xrp - unfunded', function() {
    var remote = new Remote();
    var book = remote.createOrderBook({
      currency_gets: 'BTC',
      currency_pays: 'XRP',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji'
    });

    var offer = {
      TakerGets: {
        value: '100',
        currency: 'BTC',
        issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji'
      },
      TakerPays: '123456'
    };

    book.setFundedAmount(offer, '99');

    var expected = {
      TakerGets: offer.TakerGets,
      TakerPays: offer.TakerPays,
      is_fully_funded: false,
      taker_gets_funded: '99',
      taker_pays_funded: '122221'
    };

    assert.deepEqual(offer, expected);
  });

  it('Set funded amount - xrp/iou - funded', function() {
    var remote = new Remote();
    var book = remote.createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });

    var offer = {
      TakerGets: '100',
      TakerPays: {
        value: '123.456',
        currency: 'BTC',
        issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji'
      }
    };

    book.setFundedAmount(offer, '100.1');

    var expected = {
      TakerGets: offer.TakerGets,
      TakerPays: offer.TakerPays,
      is_fully_funded: true,
      taker_gets_funded: '100',
      taker_pays_funded: '123.456'
    };

    assert.deepEqual(offer, expected);
  });

  it('Set funded amount - xrp/iou - unfunded', function() {
    var remote = new Remote();
    var book = remote.createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });

    var offer = {
      TakerGets: '100',
      TakerPays: {
        value: '123.456',
        currency: 'BTC',
        issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji'
      }
    };

    book.setFundedAmount(offer, '99');

    var expected = {
      TakerGets: offer.TakerGets,
      TakerPays: offer.TakerPays,
      is_fully_funded: false,
      taker_gets_funded: '99',
      taker_pays_funded: '122.22144'
    };

    assert.deepEqual(offer, expected);
  });

  it('Set funded amount - zero funds', function() {
    var remote = new Remote();
    var book = remote.createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });

    var offer = {
      TakerGets: {
        value: '100',
        currency: 'BTC',
        issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji'
      },
      TakerPays: '123456'
    };

    book.setFundedAmount(offer, '0');

    assert.deepEqual(offer, {
      TakerGets: offer.TakerGets,
      TakerPays: offer.TakerPays,
      is_fully_funded: false,
      taker_gets_funded: '0',
      taker_pays_funded: '0'
    });
  });

  it('Check is balance change', function() {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'USD',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });

    var meta = new Meta({
      AffectedNodes: [{
        ModifiedNode: {
          FinalFields: {
            Balance: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '-1'
            },
            Flags: 131072,
            HighLimit: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '100'
            },
            HighNode: '0000000000000000',
            LowLimit: {
              currency: 'USD',
              issuer: 'r3PDtZSa5LiYp1Ysn1vMuMzB59RzV3W9QH',
              value: '0'
            },
            LowNode: '0000000000000000'
          },
          LedgerEntryType: 'RippleState',
          LedgerIndex: 'EA4BF03B4700123CDFFB6EB09DC1D6E28D5CEB7F680FB00FC24BC1C3BB2DB959',
          PreviousFields: {
            Balance: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '0'
            }
          },
          PreviousTxnID: '53354D84BAE8FDFC3F4DA879D984D24B929E7FEB9100D2AD9EFCD2E126BCCDC8',
          PreviousTxnLgrSeq: 343570
        }
      }]
    });

    assert(book.isBalanceChange(meta.getNodes()[0]));
  });

  it('Check is balance change - not balance change', function() {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });

    var meta = new Meta({
      AffectedNodes: [{
        ModifiedNode: {
          FinalFields: {
            Balance: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '-1'
            },
            Flags: 131072,
            HighLimit: {
              currency: 'USD',
              issuer: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
              value: '100'
            },
            HighNode: '0000000000000000',
            LowLimit: {
              currency: 'USD',
              issuer: 'r3PDtZSa5LiYp1Ysn1vMuMzB59RzV3W9QH',
              value: '0'
            },
            LowNode: '0000000000000000'
          },
          LedgerEntryType: 'RippleState',
          LedgerIndex: 'EA4BF03B4700123CDFFB6EB09DC1D6E28D5CEB7F680FB00FC24BC1C3BB2DB959',
          PreviousTxnID: '53354D84BAE8FDFC3F4DA879D984D24B929E7FEB9100D2AD9EFCD2E126BCCDC8',
          PreviousTxnLgrSeq: 343570
        }
      }]
    });

    assert(!book.isBalanceChange(meta.getNodes()[0]));
  });

  it('Check is balance change - different currency', function() {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'BTC',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });

    var meta = new Meta({
      AffectedNodes: [{
        ModifiedNode: {
          FinalFields: {
            Balance: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '-1'
            },
            Flags: 131072,
            HighLimit: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '100'
            },
            HighNode: '0000000000000000',
            LowLimit: {
              currency: 'USD',
              issuer: 'r3PDtZSa5LiYp1Ysn1vMuMzB59RzV3W9QH',
              value: '0'
            },
            LowNode: '0000000000000000'
          },
          LedgerEntryType: 'RippleState',
          LedgerIndex: 'EA4BF03B4700123CDFFB6EB09DC1D6E28D5CEB7F680FB00FC24BC1C3BB2DB959',
          PreviousFields: {
            Balance: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '0'
            }
          },
          PreviousTxnID: '53354D84BAE8FDFC3F4DA879D984D24B929E7FEB9100D2AD9EFCD2E126BCCDC8',
          PreviousTxnLgrSeq: 343570
        }
      }]
    });

    assert(!book.isBalanceChange(meta.getNodes()[0]));
  });

  it('Check is balance change - different issuer', function() {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'USD',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });

    var meta = new Meta({
      AffectedNodes: [{
        ModifiedNode: {
          FinalFields: {
            Balance: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '-1'
            },
            Flags: 131072,
            HighLimit: {
              currency: 'USD',
              issuer: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
              value: '100'
            },
            HighNode: '0000000000000000',
            LowLimit: {
              currency: 'USD',
              issuer: 'r3PDtZSa5LiYp1Ysn1vMuMzB59RzV3W9QH',
              value: '0'
            },
            LowNode: '0000000000000000'
          },
          LedgerEntryType: 'RippleState',
          LedgerIndex: 'EA4BF03B4700123CDFFB6EB09DC1D6E28D5CEB7F680FB00FC24BC1C3BB2DB959',
          PreviousFields: {
            Balance: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '0'
            }
          },
          PreviousTxnID: '53354D84BAE8FDFC3F4DA879D984D24B929E7FEB9100D2AD9EFCD2E126BCCDC8',
          PreviousTxnLgrSeq: 343570
        }
      }]
    });

    assert(!book.isBalanceChange(meta.getNodes()[0]));
  });

  it('Check is balance change - native currency', function() {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });

    var meta = new Meta({
      AffectedNodes: [{
        ModifiedNode: {
          FinalFields: {
            Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
            Balance: '9999999990',
            Flags: 0,
            OwnerCount: 1,
            Sequence: 2
          },
          LedgerEntryType: 'AccountRoot',
          LedgerIndex: '4F83A2CF7E70F77F79A307E6A472BFC2585B806A70833CCD1C26105BAE0D6E05',
          PreviousFields: {
            Balance: '10000000000',
            OwnerCount: 0,
            Sequence: 1
          },
          PreviousTxnID: 'B24159F8552C355D35E43623F0E5AD965ADBF034D482421529E2703904E1EC09',
          PreviousTxnLgrSeq: 16154
        }
      }]
    });

    assert(book.isBalanceChange(meta.getNodes()[0]));
  });

  it('Check is balance change - native currency - not balance change', function() {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'BTC'
    });

    var meta = new Meta({
      AffectedNodes: [{
        ModifiedNode: {
          FinalFields: {
            Account: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
            Balance: '78991384535796',
            Flags: 0,
            OwnerCount: 3,
            Sequence: 188
          },
          LedgerEntryType: 'AccountRoot',
          LedgerIndex: 'B33FDD5CF3445E1A7F2BE9B06336BEBD73A5E3EE885D3EF93F7E3E2992E46F1A',
          PreviousTxnID: 'E9E1988A0F061679E5D14DE77DB0163CE0BBDC00F29E396FFD1DA0366E7D8904',
          PreviousTxnLgrSeq: 195455
        }
      }]
    });

    assert(!book.isBalanceChange(meta.getNodes()[0]));
  });

  it('Get balance change', function() {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'USD',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });

    var meta = new Meta({
      AffectedNodes: [
        {
        ModifiedNode: {
          FinalFields: {
            Balance: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '10'
            },
            Flags: 131072,
            HighLimit: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '100'
            },
            HighNode: '0000000000000000',
            LowLimit: {
              currency: 'USD',
              issuer: 'r3PDtZSa5LiYp1Ysn1vMuMzB59RzV3W9QH',
              value: '0'
            },
            LowNode: '0000000000000000'
          },
          LedgerEntryType: 'RippleState',
          LedgerIndex: 'EA4BF03B4700123CDFFB6EB09DC1D6E28D5CEB7F680FB00FC24BC1C3BB2DB959',
          PreviousFields: {
            Balance: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '0'
            }
          },
          PreviousTxnID: '53354D84BAE8FDFC3F4DA879D984D24B929E7FEB9100D2AD9EFCD2E126BCCDC8',
          PreviousTxnLgrSeq: 343570
        }
      },
        {
        ModifiedNode: {
          FinalFields: {
            Balance: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '-10'
            },
            Flags: 131072,
            HighLimit: {
              currency: 'USD',
              issuer: 'r3PDtZSa5LiYp1Ysn1vMuMzB59RzV3W9QH',
              value: '100'
            },
            HighNode: '0000000000000000',
            LowLimit: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '0'
            },
            LowNode: '0000000000000000'
          },
          LedgerEntryType: 'RippleState',
          LedgerIndex: 'EA4BF03B4700123CDFFB6EB09DC1D6E28D5CEB7F680FB00FC24BC1C3BB2DB959',
          PreviousFields: {
            Balance: {
              currency: 'USD',
              issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
              value: '0'
            }
          },
          PreviousTxnID: '53354D84BAE8FDFC3F4DA879D984D24B929E7FEB9100D2AD9EFCD2E126BCCDC8',
          PreviousTxnLgrSeq: 343570
        }
      }
      ]
    });

    assert.deepEqual(book.getBalanceChange(meta.getNodes()[0]), {
      account: 'r3PDtZSa5LiYp1Ysn1vMuMzB59RzV3W9QH',
      balance: '10',
      isValid: true
    });

    assert.deepEqual(book.getBalanceChange(meta.getNodes()[1]), {
      account: 'r3PDtZSa5LiYp1Ysn1vMuMzB59RzV3W9QH',
      balance: '10',
      isValid: true
    });
  });

  it('Get balance change - native currency', function() {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'USD',
      issuer_gets: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      currency_pays: 'XRP'
    });

    var meta = new Meta({
      AffectedNodes: [{
        ModifiedNode: {
          FinalFields: {
            Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
            Balance: '9999999990',
            Flags: 0,
            OwnerCount: 1,
            Sequence: 2
          },
          LedgerEntryType: 'AccountRoot',
          LedgerIndex: '4F83A2CF7E70F77F79A307E6A472BFC2585B806A70833CCD1C26105BAE0D6E05',
          PreviousFields: {
            Balance: '10000000000',
            OwnerCount: 0,
            Sequence: 1
          },
          PreviousTxnID: 'B24159F8552C355D35E43623F0E5AD965ADBF034D482421529E2703904E1EC09',
          PreviousTxnLgrSeq: 16154
        }
      }]
    });

    assert.deepEqual(book.getBalanceChange(meta.getNodes()[0]), {
      account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      balance: '9999999990',
      isValid: true
    });
  });

  it('Update funded amounts', function(done) {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'USD',
      issuer_gets: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      currency_pays: 'XRP'
    });

    var message = {
      mmeta: new Meta({
        AffectedNodes: [{
          ModifiedNode: {
            FinalFields: {
              Balance: {
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                value: '10'
              },
              Flags: 131072,
              HighLimit: {
                currency: 'USD',
                issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                value: '100'
              },
              HighNode: '0000000000000000',
              LowLimit: {
                currency: 'USD',
                issuer: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
                value: '0'
              },
              LowNode: '0000000000000000'
            },
            LedgerEntryType: 'RippleState',
            LedgerIndex: 'EA4BF03B4700123CDFFB6EB09DC1D6E28D5CEB7F680FB00FC24BC1C3BB2DB959',
            PreviousFields: {
              Balance: {
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                value: '0'
              }
            },
            PreviousTxnID: '53354D84BAE8FDFC3F4DA879D984D24B929E7FEB9100D2AD9EFCD2E126BCCDC8',
            PreviousTxnLgrSeq: 343570
          }
        }]
      })
    };

    book._issuerTransferRate = 1000000000;
    book._synchronized = true;

    book._offers = [
      {
      Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      BookDirectory: '4627DFFCFF8B5A265EDBD8AE8C14A52325DBFEDAF4F5C32E5D06F15E821839FB',
      BookNode: '0000000000000000',
      Flags: 0,
      LedgerEntryType: 'Offer',
      OwnerNode: '0000000000001897',
      PreviousTxnID: '11BA57676711A42C2FC2191EAEE98023B04627DFA84926B0C8E9D61A9CAF13AD',
      PreviousTxnLgrSeq: 8265601,
      Sequence: 531927,
      TakerGets: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '19.84580331'
      },
      taker_gets_funded: '100',
      is_fully_funded: true,
      TakerPays: '3878342440',
      index: '06AFB03237286C1566CD649CFD5388C2C1F5BEFC5C3302A1962682803A9946FA',
      owner_funds: '318.3643710638508',
      quality: '195423807.2109563'
    },
    {
      Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      BookDirectory: '4627DFFCFF8B5A265EDBD8AE8C14A52325DBFEDAF4F5C32E5D06F4C3362FE1D0',
      BookNode: '0000000000000000',
      Flags: 0,
      LedgerEntryType: 'Offer',
      OwnerNode: '00000000000063CC',
      PreviousTxnID: 'CD77500EF28984BFC123E8A257C10E44FF486EA8FC43E1356C42BD6DB853A602',
      PreviousTxnLgrSeq: 8265523,
      Sequence: 1139002,
      TakerGets: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '4.9656112525'
      },
      taker_gets_funded: '100',
      is_fully_funded: true,
      TakerPays: '972251352',
      index: 'D3338DA77BA23122FB5647B74B53636AB54BE246D4B21707C9D6887DEB334252',
      owner_funds: '235.0194163432668',
      quality: '195796912.5171664'
    },
    {
      Account: 'r8cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      BookDirectory: '4627DFFCFF8B5A265EDBD8AE8C14A52325DBFEDAF4F5C32E5D06F4C3362FE1D0',
      BookNode: '0000000000000000',
      Flags: 0,
      LedgerEntryType: 'Offer',
      OwnerNode: '00000000000063CC',
      PreviousTxnID: 'CD77500EF28984BFC123E8A257C10E44FF486EA8FC43E1356C42BD6DB853A602',
      PreviousTxnLgrSeq: 8265523,
      Sequence: 1139002,
      TakerGets: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '4.9656112525'
      },
      taker_gets_funded: '100',
      is_fully_funded: true,
      TakerPays: '972251352',
      index: 'D3338DA77BA23122FB5647B74B53636AB54BE246D4B21707C9D6887DEB334252',
      owner_funds: '235.0194163432668',
      quality: '195796912.5171664'
    },
    ];

    var receivedChangedEvents = 0;
    var receivedFundsChangedEvents = 0;

    book.on('offer_changed', function(offer) {
      receivedChangedEvents += 1;
    });

    book.on('offer_funds_changed', function(offer, previousFunds, newFunds) {
      assert.strictEqual(previousFunds, '100');
      assert.strictEqual(newFunds, offer.taker_gets_funded);
      assert.notStrictEqual(previousFunds, newFunds);
      switch (++receivedFundsChangedEvents) {
        case 1:
          assert(!offer.is_fully_funded);
          break;
        case 2:
          assert(offer.is_fully_funded);
          break;
      }
    });

    book.addCachedFunds('r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59', '100');
    book.updateFundedAmounts(message);

    setImmediate(function() {
      book.getCachedFunds('r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59', '10');
      assert.strictEqual(receivedChangedEvents, 2);
      assert.strictEqual(receivedFundsChangedEvents, 2);
      done();
    });
  });

  it('Update funded amounts - native currency', function(done) {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      currency_pays: 'USD'
    });

    var message = {
      mmeta: new Meta({
        AffectedNodes: [{
          ModifiedNode: {
            FinalFields: {
              Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
              Balance: '25',
              Flags: 0,
              OwnerCount: 1,
              Sequence: 2
            },
            LedgerEntryType: 'AccountRoot',
            LedgerIndex: '4F83A2CF7E70F77F79A307E6A472BFC2585B806A70833CCD1C26105BAE0D6E05',
            PreviousFields: {
              Balance: '100',
              OwnerCount: 0,
              Sequence: 1
            },
            PreviousTxnID: 'B24159F8552C355D35E43623F0E5AD965ADBF034D482421529E2703904E1EC09',
            PreviousTxnLgrSeq: 16154
          }
        }]
      })
    };

    book._synchronized = true;

    book._offers = [
      {
      Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      BookDirectory: 'DFA3B6DDAB58C7E8E5D944E736DA4B7046C30E4F460FD9DE4C124AF94ED1781B',
      BookNode: '0000000000000000',
      Flags: 0,
      LedgerEntryType: 'Offer',
      OwnerNode: '00000000000063CA',
      PreviousTxnID: '51C64E0B300E9C0E877BA3E79B4ED1DBD5FDDCE58FA1A8FDA5F8DDF139787A24',
      PreviousTxnLgrSeq: 8265275,
      Sequence: 1138918,
      TakerGets: '50',
      taker_gets_funded: '100',
      is_fully_funded: true,
      TakerPays: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '5'
      },
      index: 'DC003E09AD1306FBBD1957C955EE668E429CC85B0EC0EC17297F6676E6108DE7',
      owner_funds: '162110617177',
      quality: '0.000000005148984210454555'
    },
    {
      Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      BookDirectory: 'DFA3B6DDAB58C7E8E5D944E736DA4B7046C30E4F460FD9DE4C124B054BAD1D79',
      BookNode: '0000000000000000',
      Flags: 0,
      LedgerEntryType: 'Offer',
      OwnerNode: '0000000000001896',
      PreviousTxnID: '9B21C7A4B66DC1CD5FC9D85C821C4CAA8F80E437582BAD11E88A1E9E6C7AA59C',
      PreviousTxnLgrSeq: 8265118,
      Sequence: 531856,
      TakerGets: '10',
      taker_gets_funded: '100',
      is_fully_funded: true,
      TakerPays: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '20'
      },
      index: '7AC0458676A54E99FAA5ED0A56CD0CB814D3DEFE1C7874F0BB39875D60668E41',
      owner_funds: '430527438338',
      quality: '0.000000005149035697347961'
    },
    {
      Account: 'r8cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      BookDirectory: '4627DFFCFF8B5A265EDBD8AE8C14A52325DBFEDAF4F5C32E5D06F4C3362FE1D0',
      BookNode: '0000000000000000',
      Flags: 0,
      LedgerEntryType: 'Offer',
      OwnerNode: '00000000000063CC',
      PreviousTxnID: 'CD77500EF28984BFC123E8A257C10E44FF486EA8FC43E1356C42BD6DB853A602',
      PreviousTxnLgrSeq: 8265523,
      Sequence: 1139002,
      TakerGets: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '4.9656112525'
      },
      TakerPays: '972251352',
      index: 'D3338DA77BA23122FB5647B74B53636AB54BE246D4B21707C9D6887DEB334252',
      owner_funds: '235.0194163432668',
      quality: '195796912.5171664'
    },
    ];

    var receivedChangedEvents = 0;
    var receivedFundsChangedEvents = 0;

    book.on('offer_changed', function(offer) {
      receivedChangedEvents += 1;
    });

    book.on('offer_funds_changed', function(offer, previousFunds, newFunds) {
      assert.strictEqual(previousFunds, '100');
      assert.strictEqual(newFunds, offer.taker_gets_funded);
      assert.notStrictEqual(previousFunds, newFunds);
      switch (++receivedFundsChangedEvents) {
        case 1:
          assert(!offer.is_fully_funded);
          break;
        case 2:
          assert(offer.is_fully_funded);
          break;
      }
    });

    book.addCachedFunds('r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59', '100');
    book.updateFundedAmounts(message);

    setImmediate(function() {
      book.getCachedFunds('r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59', '25');
      assert.strictEqual(receivedChangedEvents, 2);
      assert.strictEqual(receivedFundsChangedEvents, 2);
      done();
    });
  });

  it('Update funded amounts - no affected account', function(done) {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      currency_pays: 'USD'
    });

    var message = {
      mmeta: new Meta({
        AffectedNodes: [{
          ModifiedNode: {
            FinalFields: {
              Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
              Balance: '25',
              Flags: 0,
              OwnerCount: 1,
              Sequence: 2
            },
            LedgerEntryType: 'AccountRoot',
            LedgerIndex: '4F83A2CF7E70F77F79A307E6A472BFC2585B806A70833CCD1C26105BAE0D6E05',
            PreviousFields: {
              Balance: '100',
              OwnerCount: 0,
              Sequence: 1
            },
            PreviousTxnID: 'B24159F8552C355D35E43623F0E5AD965ADBF034D482421529E2703904E1EC09',
            PreviousTxnLgrSeq: 16154
          }
        }]
      })
    };

    book._synchronized = true;

    book._offers = [
      {
      Account: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
      BookDirectory: 'DFA3B6DDAB58C7E8E5D944E736DA4B7046C30E4F460FD9DE4C124AF94ED1781B',
      BookNode: '0000000000000000',
      Flags: 0,
      LedgerEntryType: 'Offer',
      OwnerNode: '00000000000063CA',
      PreviousTxnID: '51C64E0B300E9C0E877BA3E79B4ED1DBD5FDDCE58FA1A8FDA5F8DDF139787A24',
      PreviousTxnLgrSeq: 8265275,
      Sequence: 1138918,
      TakerGets: '50',
      taker_gets_funded: '100',
      is_fully_funded: true,
      TakerPays: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '5'
      },
      index: 'DC003E09AD1306FBBD1957C955EE668E429CC85B0EC0EC17297F6676E6108DE7',
      owner_funds: '162110617177',
      quality: '0.000000005148984210454555'
    }
    ];

    book._offers.__defineGetter__(0, function() {
      assert(false, 'Iteration of offers for unaffected account');
    });

    book.on('offer_changed', function() {
      assert(false, 'offer_changed event emitted');
    });

    book.on('offer_funds_changed', function() {
      assert(false, 'offer_funds_changed event emitted');
    });

    book.updateFundedAmounts(message);

    setImmediate(done);
  });

  it('Update funded amounts - no balance change', function(done) {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'XRP',
      issuer_pays: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      currency_pays: 'USD'
    });

    var message = {
      mmeta: new Meta({
        AffectedNodes: [{
          ModifiedNode: {
            FinalFields: {
              Account: 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
              Balance: '78991384535796',
              Flags: 0,
              OwnerCount: 3,
              Sequence: 188
            },
            LedgerEntryType: 'AccountRoot',
            LedgerIndex: 'B33FDD5CF3445E1A7F2BE9B06336BEBD73A5E3EE885D3EF93F7E3E2992E46F1A',
            PreviousTxnID: 'E9E1988A0F061679E5D14DE77DB0163CE0BBDC00F29E396FFD1DA0366E7D8904',
            PreviousTxnLgrSeq: 195455
          }
        }]
      })
    };

    book._synchronized = true;

    book._offers = [
      {
      Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      BookDirectory: 'DFA3B6DDAB58C7E8E5D944E736DA4B7046C30E4F460FD9DE4C124AF94ED1781B',
      BookNode: '0000000000000000',
      Flags: 0,
      LedgerEntryType: 'Offer',
      OwnerNode: '00000000000063CA',
      PreviousTxnID: '51C64E0B300E9C0E877BA3E79B4ED1DBD5FDDCE58FA1A8FDA5F8DDF139787A24',
      PreviousTxnLgrSeq: 8265275,
      Sequence: 1138918,
      TakerGets: '50',
      taker_gets_funded: '100',
      is_fully_funded: true,
      TakerPays: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '5'
      },
      index: 'DC003E09AD1306FBBD1957C955EE668E429CC85B0EC0EC17297F6676E6108DE7',
      owner_funds: '162110617177',
      quality: '0.000000005148984210454555'
    }
    ];

    book.on('offer_changed', function() {
      assert(false, 'offer_changed event emitted');
    });

    book.on('offer_funds_changed', function() {
      assert(false, 'offer_funds_changed event emitted');
    });

    assert.strictEqual(typeof book.getBalanceChange, 'function');

    book.getBalanceChange = function() {
      assert(false, 'getBalanceChange should not be called');
    };

    book.addCachedFunds('r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59', '100');
    book.updateFundedAmounts(message);

    setImmediate(done);
  });

  it('Update funded amounts - deferred TransferRate', function(done) {
    var remote = new Remote();

    var book = remote.createOrderBook({
      currency_gets: 'USD',
      issuer_gets: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      currency_pays: 'XRP'
    });

    var message = {
      mmeta: new Meta({
        AffectedNodes: [{
          ModifiedNode: {
            FinalFields: {
              Balance: {
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                value: '10'
              },
              Flags: 131072,
              HighLimit: {
                currency: 'USD',
                issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                value: '100'
              },
              HighNode: '0000000000000000',
              LowLimit: {
                currency: 'USD',
                issuer: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
                value: '0'
              },
              LowNode: '0000000000000000'
            },
            LedgerEntryType: 'RippleState',
            LedgerIndex: 'EA4BF03B4700123CDFFB6EB09DC1D6E28D5CEB7F680FB00FC24BC1C3BB2DB959',
            PreviousTxnID: '53354D84BAE8FDFC3F4DA879D984D24B929E7FEB9100D2AD9EFCD2E126BCCDC8',
            PreviousTxnLgrSeq: 343570
          }
        }]
      })
    };

    remote.request = function(request) {
      assert.deepEqual(request.message, {
        command: 'account_info',
        id: undefined,
        account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      });

      request.emit('success', {
        account_data: {
          Account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
          Balance: '6156166959471',
          Domain: '6269747374616D702E6E6574',
          EmailHash: '5B33B93C7FFE384D53450FC666BB11FB',
          Flags: 131072,
          LedgerEntryType: 'AccountRoot',
          OwnerCount: 0,
          PreviousTxnID: '6A7D0AB36CBA6884FDC398254BC67DE7E0B4887E9B0252568391102FBB854C09',
          PreviousTxnLgrSeq: 8344426,
          Sequence: 561,
          TransferRate: 1002000000,
          index: 'B7D526FDDF9E3B3F95C3DC97C353065B0482302500BBB8051A5C090B596C6133',
          urlgravatar: 'http:www.gravatar.com/avatar/5b33b93c7ffe384d53450fc666bb11fb'
        }
      });

      assert.strictEqual(book._issuerTransferRate, 1002000000);
      done();
    };

    book.addCachedFunds('r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59', '100');
    book.updateFundedAmounts(message);
  });

  it('Request offers', function(done) {
    var remote = new Remote();

    var offers = {
      offers: [
        {
      Account: 'rGCHV41NxoK7wHQJhmao2RqjWZvBrTUhW1',
      BookDirectory: '6EAB7C172DEFA430DBFAD120FDC373B5F5AF8B191649EC985711A3A4254F5000',
      BookNode: '0000000000000000',
      Flags: 131072,
      LedgerEntryType: 'Offer',
      OwnerNode: '0000000000000000',
      PreviousTxnID: '9BB337CC8B34DC8D1A3FFF468556C8BA70977C37F7436439D8DA19610F214AD1',
      PreviousTxnLgrSeq: 8342933,
      Sequence: 195,
      TakerGets: {
        currency: 'BTC',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '0.1129232560043778'
      },
      TakerPays: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '56.06639660617357'
      },
      index: 'B6BC3B0F87976370EE11F5575593FE63AA5DC1D602830DC96F04B2D597F044BF',
      owner_funds: '0.1129267125000245',
      quality: '496.5',
      taker_gets_funded: {
        currency: 'BTC',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '0.1127013098802639'
      },
      taker_pays_funded: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '55.95620035555103'
      }
    },
    {
      Account: 'raudnGKfTK23YKfnS7ixejHrqGERTYNFXk',
      BookDirectory: '6EAB7C172DEFA430DBFAD120FDC373B5F5AF8B191649EC985711B6D8C62EF414',
      BookNode: '0000000000000000',
      Expiration: 461498565,
      Flags: 131072,
      LedgerEntryType: 'Offer',
      OwnerNode: '0000000000000144',
      PreviousTxnID: 'C8296B9CCA6DC594C7CD271C5D8FD11FEE380021A07768B25935642CDB37048A',
      PreviousTxnLgrSeq: 8342469,
      Sequence: 29354,
      TakerGets: {
        currency: 'BTC',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '0.2'
      },
      TakerPays: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '99.72233516476456'
      },
      index: 'A437D85DF80D250F79308F2B613CF5391C7CF8EE9099BC4E553942651CD9FA86',
      owner_funds: '0.950363009783092',
      quality: '498.6116758238228'
    }
    ]
  };

  remote.request = function(request) {
    switch (request.message.command) {
      case 'book_offers':
        assert.deepEqual(request.message, {
        command: 'book_offers',
        id: void(0),
        taker_gets: {
          currency: '0000000000000000000000004254430000000000',
          issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
        },
        taker_pays: {
          currency: '0000000000000000000000005553440000000000',
          issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
        },
        taker: 'rrrrrrrrrrrrrrrrrrrrBZbvji'
      });

      setImmediate(function() {
        request.emit('success', offers);
      });
      break;
    }
  };

  var book = remote.createOrderBook({
    currency_gets: 'BTC',
    issuer_gets: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
    currency_pays: 'USD',
    issuer_pays: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
  });

  book._issuerTransferRate = 1002000000;

  var expected = [
    { Account: 'rGCHV41NxoK7wHQJhmao2RqjWZvBrTUhW1',
      BookDirectory: '6EAB7C172DEFA430DBFAD120FDC373B5F5AF8B191649EC985711A3A4254F5000',
      BookNode: '0000000000000000',
      Flags: 131072,
      LedgerEntryType: 'Offer',
      OwnerNode: '0000000000000000',
      Sequence: 195,
      TakerGets: { currency: 'BTC',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '0.1129232560043778'
      },
      TakerPays: {
        currency: 'USD',
        issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        value: '56.06639660617357'
      },
      index: 'B6BC3B0F87976370EE11F5575593FE63AA5DC1D602830DC96F04B2D597F044BF',
      owner_funds: '0.1129267125000245',
      taker_gets_funded: '0.1127013098802639',
      taker_pays_funded: '55.95620035555102',
      is_fully_funded: false },

      { Account: 'raudnGKfTK23YKfnS7ixejHrqGERTYNFXk',
        BookDirectory: '6EAB7C172DEFA430DBFAD120FDC373B5F5AF8B191649EC985711B6D8C62EF414',
        BookNode: '0000000000000000',
        Expiration: 461498565,
        Flags: 131072,
        LedgerEntryType: 'Offer',
        OwnerNode: '0000000000000144',
        Sequence: 29354,
        TakerGets: {
          currency: 'BTC',
          issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
          value: '0.2'
        },
        TakerPays: {
          currency: 'USD',
          issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
          value: '99.72233516476456'
        },
        index: 'A437D85DF80D250F79308F2B613CF5391C7CF8EE9099BC4E553942651CD9FA86',
        owner_funds: '0.950363009783092',
        is_fully_funded: true,
        taker_gets_funded: '0.2',
        taker_pays_funded: '99.72233516476456'
      }
  ]


  book.on('model', function(model) {
    assert.deepEqual(model, expected);
    assert.strictEqual(book._synchronized, true);
    done();
  });
  });
});
