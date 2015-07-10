'use strict';
const _ = require('lodash');
const assert = require('assert-diff');
const setupAPI = require('./setup-api');
const addresses = require('./fixtures/addresses');
const hashes = require('./fixtures/hashes');
const paymentSpecification = require('./fixtures/payment-specification');
const paymentResponse = require('./fixtures/payment-response');
const orderSpecification = require('./fixtures/order-specification');
const orderResponse = require('./fixtures/order-response');
const trustlineSpecification =
  require('./fixtures/trustline-specification');
const trustlineResponse = require('./fixtures/trustline-response');
const balancesResponse = require('./fixtures/balances-response');
const orderCancellationResponse =
  require('./fixtures/ordercancellation-response');
const settingsSpecification = require('./fixtures/settings-specification');
const settingsResponse = require('./fixtures/settings-response');
const signInput = require('./fixtures/sign-input');
const signOutput = require('./fixtures/sign-output');
const MockPRNG = require('./mock-prng');
const sjcl = require('../src').sjcl;
const submitResponse = require('./fixtures/submit-response');
const transactionResponse = require('./fixtures/transaction-response');
const accountTransactionsResponse =
  require('./fixtures/account-transactions-response');
const trustlinesResponse = require('./fixtures/trustlines-response');
const walletResponse = require('./fixtures/wallet.json');
const getSettingsResponse = require('./fixtures/get-settings-response');
const getOrdersResponse = require('./fixtures/get-orders-response');
const getOrderbookResponse = require('./fixtures/get-orderbook-response');
const getServerInfoResponse = require('./fixtures/get-server-info-response');
const getPathsResponse = require('./fixtures/get-paths-response');
const address = addresses.ACCOUNT;

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

function checkResult(expected, done, error, response) {
  if (error) {
    done(error);
    return;
  }
  // console.log(JSON.stringify(response, null, 2));
  assert.deepEqual(response, expected);
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
    this.api.preparePayment(address, paymentSpecification, instructions,
      _.partial(checkResult, paymentResponse, done));
  });

  it('prepareOrder', function(done) {
    this.api.prepareOrder(address, orderSpecification, instructions,
      _.partial(checkResult, orderResponse, done));
  });

  it('prepareOrderCancellation', function(done) {
    this.api.prepareOrderCancellation(address, 23, instructions,
      _.partial(checkResult, orderCancellationResponse, done));
  });

  it('prepareTrustline', function(done) {
    this.api.prepareTrustline(address, trustlineSpecification,
      instructions, _.partial(checkResult, trustlineResponse, done));
  });

  it('prepareSettings', function(done) {
    this.api.prepareSettings(address, settingsSpecification,
      instructions, _.partial(checkResult, settingsResponse, done));
  });

  it('sign', function() {
    const secret = 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV';
    withDeterministicPRNG(() => {
      const result = this.api.sign(signInput, secret);
      assert.deepEqual(result, signOutput);
    });
  });

  it('submit', function(done) {
    this.api.submit(signOutput.signedTransaction,
      _.partial(checkResult, submitResponse, done));
  });

  it('getBalances', function(done) {
    this.api.getBalances(address, {},
      _.partial(checkResult, balancesResponse, done));
  });

  it('getTransaction', function(done) {
    this.api.getTransaction(hashes.VALID_TRANSACTION_HASH, {},
      _.partial(checkResult, transactionResponse, done));
  });

  it('getTransactions', function(done) {
    const options = {types: ['payment', 'order'], outgoing: true, limit: 2};
    this.api.getTransactions(address, options,
      _.partial(checkResult, accountTransactionsResponse, done));
  });

  // TODO: this doesn't test much, just that it doesn't crash
  it('getTransactions with start option', function(done) {
    const options = {
      start: hashes.VALID_TRANSACTION_HASH,
      earliestFirst: false,
      limit: 2
    };
    this.api.getTransactions(address, options,
      _.partial(checkResult, accountTransactionsResponse, done));
  });

  it('getTrustlines', function(done) {
    const options = {currency: 'USD'};
    this.api.getTrustlines(address, options,
      _.partial(checkResult, trustlinesResponse, done));
  });

  it('generateWallet', function() {
    withDeterministicPRNG(() => {
      assert.deepEqual(this.api.generateWallet(), walletResponse);
    });
  });

  it('getSettings', function(done) {
    this.api.getSettings(address, {},
      _.partial(checkResult, getSettingsResponse, done));
  });

  it('getOrders', function(done) {
    this.api.getOrders(address, {},
      _.partial(checkResult, getOrdersResponse, done));
  });

  it('getOrderbook', function(done) {
    this.api.getOrderbook(address, orderbook, {},
      _.partial(checkResult, getOrderbookResponse, done));
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
      assert(_.every(data.asks, ask => ask.specification.direction === 'sell'));
      done();
    });
  });

  it('getServerInfo', function(done) {
    this.api.getServerInfo(_.partial(checkResult, getServerInfoResponse, done));
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
    const pathfind = {
      source: {
        address: address
      },
      destination: {
        address: addresses.OTHER_ACCOUNT,
        amount: {
          currency: 'USD',
          counterparty: addresses.ISSUER,
          value: '100'
        }
      }
    };
    this.api.getPaths(pathfind,
      _.partial(checkResult, getPathsResponse, done));
  });

  it('getLedgerVersion', function() {
    assert.strictEqual(this.api.getLedgerVersion(), 8819951);
  });
});
