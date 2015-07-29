/* eslint-disable max-nested-callbacks */
'use strict';
const _ = require('lodash');
const assert = require('assert-diff');
const path = require('path');
const setupAPI = require('./setup-api');
const fixtures = require('./fixtures/api');
const requests = fixtures.requests;
const responses = fixtures.responses;
const addresses = require('./fixtures/addresses');
const hashes = require('./fixtures/hashes');
const MockPRNG = require('./mock-prng');
const sjcl = require('../src').sjcl;
const address = addresses.ACCOUNT;
const common = require('../src/api/common');
const validate = common.validate;
const RippleError = require('../src/core/rippleerror').RippleError;
const utils = require('../src/api/ledger/utils');
const ledgerClosed = require('./fixtures/api/rippled/ledger-close-newer');
const schemaValidator = require('../src/api/common/schema-validator');

const orderbook = {
  base: {
    currency: 'USD',
    counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
  },
  counter: {
    currency: 'BTC',
    counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
  }
};

function checkResult(expected, schemaName, done, error, response) {
  if (error) {
    done(error);
    return;
  }
  // console.log(JSON.stringify(response, null, 2));
  assert.deepEqual(response, expected);
  if (schemaName) {
    schemaValidator.schemaValidate(schemaName, response);
  }
  done();
}

function withDeterministicPRNG(f) {
  const prng = sjcl.random;
  sjcl.random = new MockPRNG();
  f();
  sjcl.random = prng;
}

describe('RippleAPI', function() {
  const instructions = {maxLedgerVersionOffset: 100};
  beforeEach(setupAPI.setup);
  afterEach(setupAPI.teardown);

  it('preparePayment', function(done) {
    const localInstructions = _.defaults({
      maxFee: '0.000012'
    }, instructions);
    this.api.preparePayment(address, requests.preparePayment, localInstructions,
      _.partial(checkResult, responses.preparePayment, 'tx', done));
  });

  it('preparePayment with all options specified', function(done) {
    const localInstructions = {
      maxLedgerVersion: this.api.getLedgerVersion() + 100,
      fee: '0.000012'
    };
    this.api.preparePayment(address, requests.preparePaymentAllOptions,
      localInstructions,
      _.partial(checkResult, responses.preparePaymentAllOptions, 'tx', done));
  });

  it('preparePayment without counterparty set', function(done) {
    const localInstructions = _.defaults({
      sequence: 23
    }, instructions);
    this.api.preparePayment(address, requests.preparePaymentNoCounterparty,
      localInstructions,
      _.partial(checkResult, responses.preparePaymentNoCounterparty,
        'tx', done));
  });

  it('prepareOrder - buy order', function(done) {
    this.api.prepareOrder(address, requests.prepareOrder, instructions,
      _.partial(checkResult, responses.prepareOrder, 'tx', done));
  });

  it('prepareOrder - sell order', function(done) {
    this.api.prepareOrder(address, requests.prepareOrderSell, instructions,
      _.partial(checkResult, responses.prepareOrderSell, 'tx', done));
  });

  it('prepareOrderCancellation', function(done) {
    this.api.prepareOrderCancellation(address, 23, instructions,
      _.partial(checkResult, responses.prepareOrderCancellation, 'tx',
        done));
  });

  it('prepareTrustline', function(done) {
    this.api.prepareTrustline(address, requests.prepareTrustline,
      instructions, _.partial(checkResult, responses.prepareTrustline,
        'tx', done));
  });

  it('prepareSettings', function(done) {
    this.api.prepareSettings(address, requests.prepareSettings, instructions,
      _.partial(checkResult, responses.prepareSettings.flags, 'tx', done));
  });

  it('prepareSettings - regularKey', function(done) {
    const regularKey = {regularKey: 'rAR8rR8sUkBoCZFawhkWzY4Y5YoyuznwD'};
    this.api.prepareSettings(address, regularKey, instructions,
      _.partial(checkResult, responses.prepareSettings.regularKey,
        'tx', done));
  });

  it('prepareSettings - flag set', function(done) {
    const settings = {requireDestinationTag: true};
    this.api.prepareSettings(address, settings, instructions,
      _.partial(checkResult, responses.prepareSettings.flagSet, 'tx', done));
  });

  it('prepareSettings - flag clear', function(done) {
    const settings = {requireDestinationTag: false};
    this.api.prepareSettings(address, settings, instructions,
      _.partial(checkResult, responses.prepareSettings.flagClear, 'tx', done));
  });

  it('prepareSettings - string field clear', function(done) {
    const settings = {walletLocator: null};
    this.api.prepareSettings(address, settings, instructions,
      _.partial(checkResult, responses.prepareSettings.fieldClear, 'tx', done));
  });

  it('prepareSettings - integer field clear', function(done) {
    const settings = {walletSize: null};
    this.api.prepareSettings(address, settings, instructions, (e, data) => {
      assert(data);
      assert.strictEqual(data.WalletSize, 0);
      done(e);
    });
  });

  it('prepareSettings - set transferRate', function(done) {
    const settings = {transferRate: 1};
    this.api.prepareSettings(address, settings, instructions,
      _.partial(checkResult, responses.prepareSettings.setTransferRate,
        'tx', done));
  });

  it('sign', function() {
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV';
    withDeterministicPRNG(() => {
      const result = this.api.sign(requests.sign, secret);
      assert.deepEqual(result, responses.sign);
      schemaValidator.schemaValidate('sign', result);
    });
  });

  it('submit', function(done) {
    this.api.submit(responses.sign.signedTransaction,
      _.partial(checkResult, responses.submit, null, done));
  });

  it('getBalances', function(done) {
    this.api.getBalances(address, {},
      _.partial(checkResult, responses.getBalances, 'getBalances', done));
  });

  it('getTransaction - payment', function(done) {
    this.api.getTransaction(hashes.VALID_TRANSACTION_HASH, {},
      _.partial(checkResult, responses.getTransaction.payment,
        'getTransaction', done));
  });

  it('getTransaction - settings', function(done) {
    const hash =
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA1B';
    this.api.getTransaction(hash, {},
      _.partial(checkResult, responses.getTransaction.settings,
        'getTransaction', done));
  });

  it('getTransaction - order', function(done) {
    const hash =
      '10A6FB4A66EE80BED46AAE4815D7DC43B97E944984CCD5B93BCF3F8538CABC51';
    this.api.getTransaction(hash, {},
      _.partial(checkResult, responses.getTransaction.order,
        'getTransaction', done));
  });

  it('getTransaction - order cancellation', function(done) {
    const hash =
      '809335DD3B0B333865096217AA2F55A4DF168E0198080B3A090D12D88880FF0E';
    this.api.getTransaction(hash, {},
      _.partial(checkResult, responses.getTransaction.orderCancellation,
        'getTransaction', done));
  });

  it('getTransaction - trustline set', function(done) {
    const hash =
      '635A0769BD94710A1F6A76CDE65A3BC661B20B798807D1BBBDADCEA26420538D';
    this.api.getTransaction(hash, {},
      _.partial(checkResult, responses.getTransaction.trustline,
        'getTransaction', done));
  });

  it('getTransaction - trustline froze off', function(done) {
    const hash =
      'FE72FAD0FA7CA904FB6C633A1666EDF0B9C73B2F5A4555D37EEF2739A78A531B';
    this.api.getTransaction(hash, {},
      _.partial(checkResult, responses.getTransaction.trustlineFrozeOff,
        'getTransaction', done));
  });

  it('getTransaction - not validated', function(done) {
    const hash =
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA10';
    this.api.getTransaction(hash, {}, (error, data) => {
      assert.deepEqual(data, responses.getTransaction.notValidated);
      done(error);
    });
  });

  it('getTransaction - tracking on', function(done) {
    const hash =
      '8925FC8844A1E930E2CC76AD0A15E7665AFCC5425376D548BB1413F484C31B8C';
    this.api.getTransaction(hash, {},
      _.partial(checkResult, responses.getTransaction.trackingOn,
        'getTransaction', done));
  });

  it('getTransaction - tracking off', function(done) {
    const hash =
      'C8C5E20DFB1BF533D0D81A2ED23F0A3CBD1EF2EE8A902A1D760500473CC9C582';
    this.api.getTransaction(hash, {},
      _.partial(checkResult, responses.getTransaction.trackingOff,
        'getTransaction', done));
  });

  it('getTransaction - set regular key', function(done) {
    const hash =
      '278E6687C1C60C6873996210A6523564B63F2844FB1019576C157353B1813E60';
    this.api.getTransaction(hash, {},
      _.partial(checkResult, responses.getTransaction.setRegularKey,
        'getTransaction', done));
  });

  it('getTransaction - not found in range', function(done) {
    const hash =
      '809335DD3B0B333865096217AA2F55A4DF168E0198080B3A090D12D88880FF0E';
    const options = {
      minLedgerVersion: 32570,
      maxLedgerVersion: 32571
    };
    this.api.getTransaction(hash, options, (error) => {
      assert(error instanceof this.api.errors.NotFoundError);
      done();
    });
  });

  it('getTransaction - not found by hash', function(done) {
    this.api.getTransaction(hashes.NOTFOUND_TRANSACTION_HASH, {}, (error) => {
      assert(error instanceof this.api.errors.NotFoundError);
      done();
    });
  });

  it('getTransaction - missing ledger history', function(done) {
    // make gaps in history
    this.api.remote.getServer().emit('message', ledgerClosed);
    this.api.getTransaction(hashes.NOTFOUND_TRANSACTION_HASH, {}, (error) => {
      assert(error instanceof this.api.errors.MissingLedgerHistoryError);
      done();
    });
  });

  it('getTransaction - ledger_index not found', function(done) {
    const hash =
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA11';
    this.api.getTransaction(hash, {}, (error) => {
      assert(error instanceof this.api.errors.NotFoundError);
      assert(error.message.indexOf('ledger_index') !== -1);
      done();
    });
  });

  it('getTransaction - transaction ledger not found', function(done) {
    const hash =
      '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA12';
    this.api.getTransaction(hash, {}, (error) => {
      assert(error instanceof this.api.errors.NotFoundError);
      assert(error.message.indexOf('ledger not found') !== -1);
      done();
    });
  });

  it('getTransaction - ledger missing close time', function(done) {
    const hash =
      '0F7ED9F40742D8A513AE86029462B7A6768325583DF8EE21B7EC663019DD6A04';
    this.api.getTransaction(hash, {}, (error) => {
      assert(error instanceof this.api.errors.ApiError);
      done();
    });
  });

  it('getTransactions', function(done) {
    const options = {types: ['payment', 'order'], initiated: true, limit: 2};
    this.api.getTransactions(address, options,
      _.partial(checkResult, responses.getTransactions,
        'getTransactions', done));
  });

  it('getTransactions - earliest first', function(done) {
    const options = {types: ['payment', 'order'], initiated: true, limit: 2,
      earliestFirst: true
    };
    const expected = _.cloneDeep(responses.getTransactions)
      .sort(utils.compareTransactions);
    this.api.getTransactions(address, options,
      _.partial(checkResult, expected, 'getTransactions', done));
  });

  it('getTransactions - earliest first with start option', function(done) {
    const options = {types: ['payment', 'order'], initiated: true, limit: 2,
      start: hashes.VALID_TRANSACTION_HASH,
      earliestFirst: true
    };
    this.api.getTransactions(address, options, (error, data) => {
      assert.strictEqual(data.length, 0);
      done(error);
    });
  });

  it('getTransactions - gap', function(done) {
    const options = {types: ['payment', 'order'], initiated: true, limit: 2,
      maxLedgerVersion: 348858000
    };
    this.api.getTransactions(address, options, (error) => {
      assert(error instanceof this.api.errors.MissingLedgerHistoryError);
      done();
    });
  });

  it('getTransactions - tx not found', function(done) {
    const options = {types: ['payment', 'order'], initiated: true, limit: 2,
      start: hashes.NOTFOUND_TRANSACTION_HASH,
      counterparty: address
    };
    this.api.getTransactions(address, options, (error) => {
      assert(error instanceof this.api.errors.NotFoundError);
      done();
    });
  });

  it('getTransactions - filters', function(done) {
    const options = {types: ['payment', 'order'], initiated: true, limit: 10,
      excludeFailures: true,
      counterparty: addresses.ISSUER
    };
    this.api.getTransactions(address, options, (error, data) => {
      assert.strictEqual(data.length, 10);
      assert(_.every(data, t => t.type === 'payment' || t.type === 'order'));
      assert(_.every(data, t => t.outcome.result === 'tesSUCCESS'));
      done();
    });
  });

  it('getTransactions - filters for incoming', function(done) {
    const options = {types: ['payment', 'order'], initiated: false, limit: 10,
      excludeFailures: true,
      counterparty: addresses.ISSUER
    };
    this.api.getTransactions(address, options, (error, data) => {
      assert.strictEqual(data.length, 10);
      assert(_.every(data, t => t.type === 'payment' || t.type === 'order'));
      assert(_.every(data, t => t.outcome.result === 'tesSUCCESS'));
      done();
    });
  });

  // this is the case where core.RippleError just falls
  // through the api to the user
  it('getTransactions - error', function(done) {
    const options = {types: ['payment', 'order'], initiated: true, limit: 13};
    this.api.getTransactions(address, options, (error) => {
      assert(error instanceof RippleError);
      done();
    });
  });

  // TODO: this doesn't test much, just that it doesn't crash
  it('getTransactions with start option', function(done) {
    const options = {
      start: hashes.VALID_TRANSACTION_HASH,
      earliestFirst: false,
      limit: 2
    };
    this.api.getTransactions(address, options,
      _.partial(checkResult, responses.getTransactions,
        'getTransactions', done));
  });

  it('getTrustlines', function(done) {
    const options = {currency: 'USD'};
    this.api.getTrustlines(address, options,
      _.partial(checkResult, responses.getTrustlines, 'getTrustlines',
        done));
  });

  it('generateWallet', function() {
    withDeterministicPRNG(() => {
      assert.deepEqual(this.api.generateWallet(), responses.generateWallet);
    });
  });

  it('getSettings', function(done) {
    this.api.getSettings(address, {},
      _.partial(checkResult, responses.getSettings, 'getSettings', done));
  });

  it('getAccountInfo', function(done) {
    this.api.getAccountInfo(address, {},
      _.partial(checkResult, responses.getAccountInfo, 'getAccountInfo',
        done));
  });

  it('getOrders', function(done) {
    this.api.getOrders(address, {},
      _.partial(checkResult, responses.getOrders, 'getOrders', done));
  });

  it('getOrderbook', function(done) {
    this.api.getOrderbook(address, orderbook, {},
      _.partial(checkResult, responses.getOrderbook, 'getOrderbook', done));
  });

  it('getOrderbook - sorted so that best deals come first', function(done) {
    this.api.getOrderbook(address, orderbook, {}, (error, data) => {
      const bidRates = data.bids.map(bid => bid.properties.makerExchangeRate);
      const askRates = data.asks.map(ask => ask.properties.makerExchangeRate);
      // makerExchangeRate = quality = takerPays.value/takerGets.value
      // so the best deal for the taker is the lowest makerExchangeRate
      // bids and asks should be sorted so that the best deals come first
      assert.deepEqual(_.sortBy(bidRates, x => Number(x)), bidRates);
      assert.deepEqual(_.sortBy(askRates, x => Number(x)), askRates);
      done();
    });
  });

  it('getOrderbook - currency & counterparty are correct', function(done) {
    this.api.getOrderbook(address, orderbook, {}, (error, data) => {
      const orders = _.flatten([data.bids, data.asks]);
      _.forEach(orders, order => {
        const quantity = order.specification.quantity;
        const totalPrice = order.specification.totalPrice;
        const {base, counter} = orderbook;
        assert.strictEqual(quantity.currency, base.currency);
        assert.strictEqual(quantity.counterparty, base.counterparty);
        assert.strictEqual(totalPrice.currency, counter.currency);
        assert.strictEqual(totalPrice.counterparty, counter.counterparty);
      });
      done();
    });
  });

  it('getOrderbook - direction is correct for bids and asks', function(done) {
    this.api.getOrderbook(address, orderbook, {}, (error, data) => {
      assert(_.every(data.bids, bid => bid.specification.direction === 'buy'));
      assert(
        _.every(data.asks, ask => ask.specification.direction === 'sell'));
      done();
    });
  });

  it('getServerInfo', function(done) {
    this.api.getServerInfo(
      _.partial(checkResult, responses.getServerInfo, null, done));
  });

  it('getServerInfo - error', function(done) {
    this.mockRippled.returnErrorOnServerInfo = true;
    this.api.getServerInfo((error) => {
      assert(error instanceof this.api.errors.NetworkError);
      assert(error.message.indexOf('too much load') !== -1);
      done();
    });
  });

  it('getFee', function() {
    assert.strictEqual(this.api.getFee(), '0.000012');
  });

  it('disconnect & isConnected', function(done) {
    assert.strictEqual(this.api.isConnected(), true);
    this.api.disconnect(() => {
      assert.strictEqual(this.api.isConnected(), false);
      done();
    });
  });

  it('getPaths', function(done) {
    this.api.getPaths(requests.getPaths.normal,
      _.partial(checkResult, responses.getPaths.XrpToUsd, 'getPaths', done));
  });

  // @TODO
  // need decide what to do with currencies/XRP:
  // if add 'XRP' in currencies, then there will be exception in
  // xrpToDrops function (called from toRippledAmount)
  it('getPaths USD 2 USD', function(done) {
    this.api.getPaths(requests.getPaths.UsdToUsd,
      _.partial(checkResult, responses.getPaths.UsdToUsd, 'getPaths', done));
  });

  it('getPaths XRP 2 XRP', function(done) {
    this.api.getPaths(requests.getPaths.XrpToXrp,
      _.partial(checkResult, responses.getPaths.XrpToXrp, 'getPaths', done));
  });

  it('getPaths - XRP 2 XRP - not enough', function(done) {
    this.api.getPaths(requests.getPaths.XrpToXrpNotEnough, (error) => {
      assert(error instanceof this.api.errors.NotFoundError);
      done();
    });
  });

  it('getPaths - does not accept currency', function(done) {
    this.api.getPaths(requests.getPaths.NotAcceptCurrency, (error) => {
      assert(error instanceof this.api.errors.NotFoundError);
      done();
    });
  });

  it('getPaths - no paths', function(done) {
    this.api.getPaths(requests.getPaths.NoPaths, (error) => {
      assert(error instanceof this.api.errors.NotFoundError);
      done();
    });
  });

  it('getPaths - no paths with source currencies', function(done) {
    this.api.getPaths(requests.getPaths.NoPathsWithCurrencies, (error) => {
      assert(error instanceof this.api.errors.NotFoundError);
      done();
    });
  });

  it('getLedgerVersion', function() {
    assert.strictEqual(this.api.getLedgerVersion(), 8819951);
  });

  it('ledger utils - compareTransactions', function() {
    let first = {outcome: {ledgerVersion: 1, indexInLedger: 100}};
    let second = {outcome: {ledgerVersion: 1, indexInLedger: 200}};

    assert.strictEqual(utils.compareTransactions(first, second), -1);

    first = {outcome: {ledgerVersion: 1, indexInLedger: 100}};
    second = {outcome: {ledgerVersion: 1, indexInLedger: 100}};

    assert.strictEqual(utils.compareTransactions(first, second), 0);

    first = {outcome: {ledgerVersion: 1, indexInLedger: 200}};
    second = {outcome: {ledgerVersion: 1, indexInLedger: 100}};

    assert.strictEqual(utils.compareTransactions(first, second), 1);
  });

  it('ledger utils - renameCounterpartyToIssuer', function() {
    assert.strictEqual(utils.renameCounterpartyToIssuer(undefined), undefined);
    const amountArg = {issuer: '1'};
    assert.deepEqual(utils.renameCounterpartyToIssuer(amountArg), amountArg);
  });

  it('ledger utils - getRecursive', function(done) {
    function getter(marker, limit, callback) {
      if (marker === undefined) {
        callback(null, {marker: 'A', results: [1]});
      } else {
        callback(new Error(), null);
      }
    }
    utils.getRecursive(getter, 10, (error) => {
      assert(error instanceof Error);
      done();
    });
  });

  describe('schema-validator', function() {
    beforeEach(function() {
      const schema = schemaValidator.loadSchema(path.join(__dirname,
        './fixtures/schemas/ledgerhash.json'));
      schemaValidator.SCHEMAS.ledgerhash = schema;
    });

    it('valid', function() {
      assert.doesNotThrow(function() {
        schemaValidator.schemaValidate('ledgerhash',
          '0F7ED9F40742D8A513AE86029462B7A6768325583DF8EE21B7EC663019DD6A0F');
      });
    });

    it('invalid', function() {
      assert.throws(function() {
        schemaValidator.schemaValidate('ledgerhash', 'invalid');
      }, this.api.errors.ValidationError);
    });

    it('invalid - empty value', function() {
      assert.throws(function() {
        schemaValidator.schemaValidate('ledgerhash', '');
      }, this.api.errors.ValidationError);
    });

    it('load schema error', function() {
      assert.throws(function() {
        schemaValidator.loadSchema('/bad/file/name');
      }, Error);
    });

    it('schema not found error', function() {
      assert.throws(function() {
        schemaValidator.schemaValidate('unexisting', 'anything');
      }, /schema not found/);
    });

  });

  describe('validator', function() {

    it('validateLedgerRange', function() {
      const options = {
        minLedgerVersion: 20000,
        maxLedgerVersion: 10000
      };
      assert.throws(_.partial(validate.getTransactionsOptions, options),
        this.api.errors.ValidationError);
      assert.throws(_.partial(validate.getTransactionsOptions, options),
        /minLedgerVersion must not be greater than maxLedgerVersion/);
    });

    it('addressAndSecret', function() {
      const wrongSecret = {address: address,
        secret: 'shzjfakiK79YQdMjy4h8cGGfQSV6u'
      };
      assert.throws(_.partial(validate.addressAndSecret, wrongSecret),
        this.api.errors.ValidationError);
      const noSecret = {address: address};
      assert.throws(_.partial(validate.addressAndSecret, noSecret),
        this.api.errors.ValidationError);
      assert.throws(_.partial(validate.addressAndSecret, noSecret),
        /Parameter missing/);
      const badSecret = {address: address, secret: 'bad'};
      assert.throws(_.partial(validate.addressAndSecret, badSecret),
        this.api.errors.ValidationError);
      assert.throws(_.partial(validate.addressAndSecret, badSecret),
        /not match/);
      const goodWallet = {address: 'rpZMK8hwyrBvLorFNWHRCGt88nCJWbixur',
        secret: 'shzjfakiK79YQdMjy4h8cGGfQSV6u'
      };
      assert.doesNotThrow(_.partial(validate.addressAndSecret, goodWallet));
    });

    it('secret', function() {
      assert.doesNotThrow(_.partial(validate.secret,
        'shzjfakiK79YQdMjy4h8cGGfQSV6u'));
      assert.throws(_.partial(validate.secret, 1),
        /Invalid parameter/);
      assert.throws(_.partial(validate.secret, ''),
        this.api.errors.ValidationError);
      assert.throws(_.partial(validate.secret, 's!!!'),
        this.api.errors.ValidationError);
      assert.throws(_.partial(validate.secret, 'passphrase'),
        this.api.errors.ValidationError);
      // 32 0s is a valid hex repr of seed bytes
      const hex = new Array(33).join('0');
      assert.throws(_.partial(validate.secret, hex),
        this.api.errors.ValidationError);
    });

  });

  describe('common utils', function() {

    it('wrapCatch', function(done) {
      common.wrapCatch(function() {
        throw new Error('error');
      })(function(error) {
        assert(error instanceof Error);
        done();
      });
    });

    it('convertExceptions', function() {
      assert.throws(common.convertExceptions(function() {
        throw new Error('fall through');
      }), this.api.errors.ApiError);
      assert.throws(common.convertExceptions(function() {
        throw new Error('fall through');
      }), /fall through/);
    });

  });

});
