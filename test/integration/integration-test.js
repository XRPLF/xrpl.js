/* eslint-disable max-nested-callbacks */
/* eslint-disable max-params */
'use strict';
const _ = require('lodash');
const assert = require('assert');
const errors = require('../../src/common/errors');
const validate = require('../../src/common').validate;
const wallet = require('./wallet');
const requests = require('../fixtures/api/requests');
const RippleAPI = require('../../src').RippleAPI;


const TIMEOUT = 30000;   // how long before each test case times out
const INTERVAL = 1000;   // how long to wait between checks for validated ledger


function verifyTransaction(testcase, hash, type, options, txData) {
  console.log('VERIFY...');
  return testcase.api.getTransaction(hash, options).then(data => {
    assert(data && data.outcome);
    assert.strictEqual(data.type, type);
    assert.strictEqual(data.address, wallet.getAddress());
    assert.strictEqual(data.outcome.result, 'tesSUCCESS');
    testcase.transactions.push(hash);
    return {txJSON: JSON.stringify(txData), id: hash, tx: data};
  }).catch(error => {
    if (error instanceof errors.PendingLedgerVersionError) {
      console.log('NOT VALIDATED YET...');
      return new Promise((resolve, reject) => {
        setTimeout(() => verifyTransaction(testcase, hash, type,
          options, txData).then(resolve, reject), INTERVAL);
      });
    }
    assert(false, 'Transaction not successful: ' + error.message);
  });
}

function testTransaction(testcase, type, lastClosedLedgerVersion, prepared) {
  const txJSON = prepared.txJSON;
  assert(txJSON, 'missing txJSON');
  const txData = JSON.parse(txJSON);
  assert.strictEqual(txData.Account, wallet.getAddress());
  const signedData = testcase.api.sign(txJSON, wallet.getSecret());
  console.log('PREPARED...');
  return testcase.api.submit(signedData.signedTransaction).then(data => {
    console.log('SUBMITTED...');
    assert.strictEqual(data.engineResult, 'tesSUCCESS');
    const options = {
      minLedgerVersion: lastClosedLedgerVersion,
      maxLedgerVersion: txData.LastLedgerSequence
    };
    return new Promise((resolve, reject) => {
      setTimeout(() => verifyTransaction(testcase, signedData.id, type,
        options, txData).then(resolve, reject), INTERVAL);
    });
  });
}

function setup() {
  this.api = new RippleAPI({servers: ['wss://s1.ripple.com']});
  console.log('CONNECTING...');
  return this.api.connect().then(() => {
    console.log('CONNECTED...');
  });
}

function teardown() {
  return this.api.disconnect();
}

function suiteSetup() {
  this.transactions = [];
  return setup.bind(this)().then(() => {
    return this.api.getLedgerVersion().then(ledgerVersion => {
      this.startLedgerVersion = ledgerVersion;
    });
  }).then(teardown.bind(this));
}

describe('integration tests', function() {
  const address = wallet.getAddress();
  const instructions = {maxLedgerVersionOffset: 10};
  this.timeout(TIMEOUT);

  before(suiteSetup);
  beforeEach(setup);
  afterEach(teardown);


  it('settings', function() {
    return this.api.getLedgerVersion().then(ledgerVersion => {
      return this.api.prepareSettings(address,
        requests.prepareSettings, instructions).then(prepared =>
          testTransaction(this, 'settings', ledgerVersion, prepared));
    });
  });


  it('trustline', function() {
    return this.api.getLedgerVersion().then(ledgerVersion => {
      return this.api.prepareTrustline(address,
        requests.prepareTrustline.simple, instructions).then(prepared =>
          testTransaction(this, 'trustline', ledgerVersion, prepared));
    });
  });


  it('payment', function() {
    const amount = {currency: 'XRP', value: '0.000001'};
    const paymentSpecification = {
      source: {
        address: address,
        maxAmount: amount
      },
      destination: {
        address: 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc',
        amount: amount
      }
    };
    return this.api.getLedgerVersion().then(ledgerVersion => {
      return this.api.preparePayment(address,
        paymentSpecification, instructions).then(prepared =>
          testTransaction(this, 'payment', ledgerVersion, prepared));
    });
  });


  it('order', function() {
    const orderSpecification = {
      direction: 'buy',
      quantity: {
        currency: 'USD',
        value: '237',
        counterparty: 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q'
      },
      totalPrice: {
        currency: 'XRP',
        value: '0.0002'
      }
    };
    return this.api.getLedgerVersion().then(ledgerVersion => {
      return this.api.prepareOrder(address,
        orderSpecification, instructions).then(prepared =>
          testTransaction(this, 'order', ledgerVersion, prepared)
        ).then(result => {
          const txData = JSON.parse(result.txJSON);
          return this.api.getOrders(address).then(orders => {
            assert(orders && orders.length > 0);
            const createdOrder = _.first(_.filter(orders, order => {
              return order.properties.sequence === txData.Sequence;
            }));
            assert(createdOrder);
            assert.strictEqual(createdOrder.properties.maker, address);
            assert.deepEqual(createdOrder.specification, orderSpecification);
            return txData;
          });
        }).then(txData => this.api.prepareOrderCancellation(
            address, txData.Sequence, instructions).then(prepared =>
              testTransaction(this, 'orderCancellation', ledgerVersion,
                              prepared))
        );
    });
  });


  it('isConnected', function() {
    assert(this.api.isConnected());
  });


  it('getServerInfo', function() {
    return this.api.getServerInfo().then(data => {
      assert(data && data.pubkeyNode);
    });
  });


  it('getFee', function() {
    return this.api.getFee().then(fee => {
      assert.strictEqual(typeof fee, 'string');
      assert(!isNaN(Number(fee)));
      assert(parseFloat(fee) === Number(fee));
    });
  });


  it('getLedgerVersion', function() {
    return this.api.getLedgerVersion().then(ledgerVersion => {
      assert.strictEqual(typeof ledgerVersion, 'number');
      assert(ledgerVersion >= this.startLedgerVersion);
    });
  });


  it('getTransactions', function() {
    const options = {
      initiated: true,
      minLedgerVersion: this.startLedgerVersion
    };
    return this.api.getTransactions(address, options).then(transactionsData => {
      assert(transactionsData);
      assert.strictEqual(transactionsData.length, this.transactions.length);
    });
  });


  it('getTrustlines', function() {
    const fixture = requests.prepareTrustline.simple;
    const options = _.pick(fixture, ['currency', 'counterparty']);
    return this.api.getTrustlines(address, options).then(data => {
      assert(data && data.length > 0 && data[0] && data[0].specification);
      const specification = data[0].specification;
      assert.strictEqual(Number(specification.limit), Number(fixture.limit));
      assert.strictEqual(specification.currency, fixture.currency);
      assert.strictEqual(specification.counterparty, fixture.counterparty);
    });
  });


  it('getBalances', function() {
    const fixture = requests.prepareTrustline.simple;
    const options = _.pick(fixture, ['currency', 'counterparty']);
    return this.api.getBalances(address, options).then(data => {
      assert(data && data.length > 0 && data[0]);
      assert.strictEqual(data[0].currency, fixture.currency);
      assert.strictEqual(data[0].counterparty, fixture.counterparty);
    });
  });


  it('getSettings', function() {
    return this.api.getSettings(address).then(data => {
      assert(data);
      assert.strictEqual(data.domain, requests.prepareSettings.domain);
    });
  });


  it('getOrderbook', function() {
    const orderbook = {
      base: {
        currency: 'XRP'
      },
      counter: {
        currency: 'USD',
        counterparty: 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q'
      }
    };
    return this.api.getOrderbook(address, orderbook).then(book => {
      assert(book && book.bids && book.bids.length > 0);
      assert(book.asks && book.asks.length > 0);
      const bid = book.bids[0];
      assert(bid && bid.specification && bid.specification.quantity);
      assert(bid.specification.totalPrice);
      assert.strictEqual(bid.specification.direction, 'buy');
      assert.strictEqual(bid.specification.quantity.currency, 'XRP');
      assert.strictEqual(bid.specification.totalPrice.currency, 'USD');
      const ask = book.asks[0];
      assert(ask && ask.specification && ask.specification.quantity);
      assert(ask.specification.totalPrice);
      assert.strictEqual(ask.specification.direction, 'sell');
      assert.strictEqual(ask.specification.quantity.currency, 'XRP');
      assert.strictEqual(ask.specification.totalPrice.currency, 'USD');
    });
  });


  it('getPaths', function() {
    const pathfind = {
      source: {
        address: address
      },
      destination: {
        address: 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc',
        amount: {
          value: '0.000001',
          currency: 'USD',
          counterparty: 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q'
        }
      }
    };
    return this.api.getPaths(pathfind).then(data => {
      assert(data && data.length > 0);
      const path = data[0];
      assert(path && path.source);
      assert.strictEqual(path.source.address, address);
      assert(path.paths && path.paths.length > 0);
    });
  });


  it('generateWallet', function() {
    const newWallet = this.api.generateAddress();
    assert(newWallet && newWallet.address && newWallet.secret);
    validate.address(newWallet.address);
    validate.secret(newWallet.secret);
  });

});
