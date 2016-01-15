/* eslint-disable max-nested-callbacks */
/* eslint-disable max-params */
'use strict';
const _ = require('lodash');
const assert = require('assert');
const errors = require('../../src/common/errors');
const wallet = require('./wallet');
const requests = require('../fixtures/requests');
const RippleAPI = require('ripple-api').RippleAPI;
const {isValidAddress} = require('ripple-address-codec');
const {isValidSecret} = require('../../src/common');
const {payTo, ledgerAccept} = require('./utils');


// how long before each test case times out
const TIMEOUT = process.browser ? 25000 : 10000;
const INTERVAL = 1000;   // how long to wait between checks for validated ledger

const serverUrl = 'ws://127.0.0.1:6006';

function acceptLedger(api) {
  return api.connection.request({command: 'ledger_accept'});
}

function verifyTransaction(testcase, hash, type, options, txData, address) {
  console.log('VERIFY...');
  return testcase.api.getTransaction(hash, options).then(data => {
    assert(data && data.outcome);
    assert.strictEqual(data.type, type);
    assert.strictEqual(data.address, address);
    assert.strictEqual(data.outcome.result, 'tesSUCCESS');
    if (testcase.transactions !== undefined) {
      testcase.transactions.push(hash);
    }
    return {txJSON: JSON.stringify(txData), id: hash, tx: data};
  }).catch(error => {
    if (error instanceof errors.PendingLedgerVersionError) {
      console.log('NOT VALIDATED YET...');
      return new Promise((resolve, reject) => {
        setTimeout(() => verifyTransaction(testcase, hash, type,
          options, txData, address).then(resolve, reject), INTERVAL);
      });
    }
    console.log(error.stack);
    assert(false, 'Transaction not successful: ' + error.message);
  });
}

function testTransaction(testcase, type, lastClosedLedgerVersion, prepared,
    address = wallet.getAddress(), secret = wallet.getSecret()) {
  const txJSON = prepared.txJSON;
  assert(txJSON, 'missing txJSON');
  const txData = JSON.parse(txJSON);
  assert.strictEqual(txData.Account, address);
  const signedData = testcase.api.sign(txJSON, secret);
  console.log('PREPARED...');
  return testcase.api.submit(signedData.signedTransaction)
  .then(data => testcase.test.title.indexOf('multisign') !== -1 ?
  acceptLedger(testcase.api).then(() => data) : data).then(data => {
    console.log('SUBMITTED...');
    assert.strictEqual(data.resultCode, 'tesSUCCESS');
    const options = {
      minLedgerVersion: lastClosedLedgerVersion,
      maxLedgerVersion: txData.LastLedgerSequence
    };
    ledgerAccept(testcase.api);
    return new Promise((resolve, reject) => {
      setTimeout(() => verifyTransaction(testcase, signedData.id, type,
        options, txData, address).then(resolve, reject), INTERVAL);
    });
  });
}

function setup(server = 'wss://s1.ripple.com') {
  this.api = new RippleAPI({server});
  console.log('CONNECTING...');
  return this.api.connect().then(() => {
    console.log('CONNECTED...');
  }, error => {
    console.log('ERROR:', error);
    throw error;
  });
}

const masterAccount = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
const masterSecret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb';

function makeTrustLine(testcase, address, secret) {
  const api = testcase.api;
  const specification = {
    currency: 'USD',
    counterparty: masterAccount,
    limit: '1341.1',
    ripplingDisabled: true
  };
  const trust = api.prepareTrustline(address, specification, {})
    .then(data => {
      const signed = api.sign(data.txJSON, secret);
      if (address === wallet.getAddress()) {
        testcase.transactions.push(signed.id);
      }
      return api.submit(signed.signedTransaction);
    })
    .then(() => ledgerAccept(api));
  return trust;
}

function makeOrder(api, address, specification, secret) {
  return api.prepareOrder(address, specification)
    .then(data => api.sign(data.txJSON, secret))
    .then(signed => api.submit(signed.signedTransaction))
    .then(() => ledgerAccept(api));
}

function setupAccounts(testcase) {
  const api = testcase.api;

  const promise = payTo(api, 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM')
    .then(() => payTo(api, wallet.getAddress()))
    .then(() => payTo(api, testcase.newWallet.address))
    .then(() => payTo(api, 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc'))
    .then(() => payTo(api, 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q'))
    .then(() => {
      return api.prepareSettings(masterAccount, {defaultRipple: true})
      .then(data => api.sign(data.txJSON, masterSecret))
      .then(signed => api.submit(signed.signedTransaction))
      .then(() => ledgerAccept(api));
    })
    .then(() => makeTrustLine(testcase, wallet.getAddress(),
      wallet.getSecret()))
    .then(() => makeTrustLine(testcase, testcase.newWallet.address,
      testcase.newWallet.secret))
    .then(() => payTo(api, wallet.getAddress(), '123', 'USD', masterAccount))
    .then(() => payTo(api, 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q'))
    .then(() => {
      const orderSpecification = {
        direction: 'buy',
        quantity: {
          currency: 'USD',
          value: '432',
          counterparty: masterAccount
        },
        totalPrice: {
          currency: 'XRP',
          value: '432'
        }
      };
      return makeOrder(testcase.api, testcase.newWallet.address,
        orderSpecification, testcase.newWallet.secret);
    })
    .then(() => {
      const orderSpecification = {
        direction: 'buy',
        quantity: {
          currency: 'XRP',
          value: '1741'
        },
        totalPrice: {
          currency: 'USD',
          value: '171',
          counterparty: masterAccount
        }
      };
      return makeOrder(testcase.api, masterAccount, orderSpecification,
        masterSecret);
    });
  return promise;
}

function teardown() {
  return this.api.disconnect();
}

function suiteSetup() {
  this.transactions = [];

  return setup.bind(this)(serverUrl)
    .then(() => ledgerAccept(this.api))
    .then(() => this.newWallet = this.api.generateAddress())
    // two times to give time to server to send `ledgerClosed` event
    // so getLedgerVersion will return right value
    .then(() => ledgerAccept(this.api))
    .then(() => this.api.getLedgerVersion())
    .then(ledgerVersion => {
      this.startLedgerVersion = ledgerVersion;
    })
    .then(() => setupAccounts(this))
    .then(() => teardown.bind(this)());
}

describe('integration tests', function() {
  const address = wallet.getAddress();
  const instructions = {maxLedgerVersionOffset: 10};
  this.timeout(TIMEOUT);

  before(suiteSetup);
  beforeEach(_.partial(setup, serverUrl));
  afterEach(teardown);


  it('settings', function() {
    return this.api.getLedgerVersion().then(ledgerVersion => {
      return this.api.prepareSettings(address,
        requests.prepareSettings.domain, instructions).then(prepared =>
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
      return this.api.prepareOrder(address, orderSpecification, instructions)
        .then(prepared =>
          testTransaction(this, 'order', ledgerVersion, prepared))
        .then(result => {
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
        })
        .then(txData => this.api.prepareOrderCancellation(
          address, {orderSequence: txData.Sequence}, instructions)
            .then(prepared => testTransaction(this, 'orderCancellation',
              ledgerVersion, prepared))
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
      assert.strictEqual(data.domain, requests.prepareSettings.domain.domain);
    });
  });


  it('getOrderbook', function() {
    const orderbook = {
      base: {
        currency: 'XRP'
      },
      counter: {
        currency: 'USD',
        counterparty: masterAccount
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
        address: this.newWallet.address,
        amount: {
          value: '1',
          currency: 'USD',
          counterparty: masterAccount
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


  it('getPaths - send all', function() {
    const pathfind = {
      source: {
        address: address,
        amount: {
          currency: 'USD',
          value: '0.005'
        }
      },
      destination: {
        address: this.newWallet.address,
        amount: {
          currency: 'USD'
        }
      }
    };

    return this.api.getPaths(pathfind).then(data => {
      assert(data && data.length > 0);
      assert(_.every(data, path => {
        return parseFloat(path.source.amount.value)
        <= parseFloat(pathfind.source.amount.value);
      }));
      const path = data[0];
      assert(path && path.source);
      assert.strictEqual(path.source.address, pathfind.source.address);
      assert(path.paths && path.paths.length > 0);
    });
  });


  it('generateWallet', function() {
    const newWallet = this.api.generateAddress();
    assert(newWallet && newWallet.address && newWallet.secret);
    assert(isValidAddress(newWallet.address));
    assert(isValidSecret(newWallet.secret));
  });

});

describe('integration tests - standalone rippled', function() {
  const instructions = {maxLedgerVersionOffset: 10};
  this.timeout(TIMEOUT);

  beforeEach(_.partial(setup, serverUrl));
  afterEach(teardown);
  const address = 'r5nx8ZkwEbFztnc8Qyi22DE9JYjRzNmvs';
  const secret = 'ss6F8381Br6wwpy9p582H8sBt19J3';
  const signer1address = 'rQDhz2ZNXmhxzCYwxU6qAbdxsHA4HV45Y2';
  const signer1secret = 'shK6YXzwYfnFVn3YZSaMh5zuAddKx';
  const signer2address = 'r3RtUvGw9nMoJ5FuHxuoVJvcENhKtuF9ud';
  const signer2secret = 'shUHQnL4EH27V4EiBrj6EfhWvZngF';

  it('submit multisigned transaction', function() {
    const signers = {
      threshold: 2,
      weights: [
        {address: signer1address, weight: 1},
        {address: signer2address, weight: 1}
      ]
    };
    let minLedgerVersion = null;
    return payTo(this.api, address).then(() => {
      return this.api.getLedgerVersion().then(ledgerVersion => {
        minLedgerVersion = ledgerVersion;
        return this.api.prepareSettings(address, {signers}, instructions)
        .then(prepared => {
          return testTransaction(this, 'settings', ledgerVersion, prepared,
            address, secret);
        });
      });
    }).then(() => {
      const multisignInstructions =
        _.assign({}, instructions, {signersCount: 2});
      return this.api.prepareSettings(
        address, {domain: 'example.com'}, multisignInstructions)
      .then(prepared => {
        const signed1 = this.api.sign(
          prepared.txJSON, signer1secret, {signAs: signer1address});
        const signed2 = this.api.sign(
          prepared.txJSON, signer2secret, {signAs: signer2address});
        const combined = this.api.combine([
          signed1.signedTransaction, signed2.signedTransaction
        ]);
        return this.api.submit(combined.signedTransaction)
        .then(response => acceptLedger(this.api).then(() => response))
        .then(response => {
          assert.strictEqual(response.resultCode, 'tesSUCCESS');
          const options = {minLedgerVersion};
          return verifyTransaction(this, combined.id, 'settings',
            options, {}, address);
        }).catch(error => {
          console.log(error.message);
          throw error;
        });
      });
    });
  });
});
