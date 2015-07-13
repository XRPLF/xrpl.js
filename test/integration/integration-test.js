/* eslint-disable max-len  */
/* eslint-disable max-nested-callbacks */
/* eslint-disable max-params */
'use strict';
const _ = require('lodash');
const assert = require('assert');
const async = require('async');

const errors = require('../../src/api/common/errors');

const wallet = require('./wallet');

const settingsSpecification = require('../fixtures/settings-specification');
const trustlineSpecification = require('../fixtures/trustline-specification');
const payments = require('../fixtures/payments');

const RippleAPI = require('../../src').RippleAPI;


const TIMEOUT = 20000;   // how long before each test case times out
const INTERVAL = 2000;   // how long to wait between checks for validated ledger


function verifyTransaction(testcase, hash, type, options, txData, done) {
  testcase.api.getTransaction(hash, options, (err, data) => {
    if (err instanceof errors.NotFoundError
          && testcase.api.getLedgerVersion() <= options.maxLedgerVersion) {
      console.log('NOT VALIDATED YET...');
      setTimeout(_.partial(verifyTransaction, testcase, hash, type, options, txData, done), INTERVAL);
      return;
    } else if (err) {
      done(err);
      return;
    }
    assert(data && data.outcome);
    assert.strictEqual(data.type, type);
    assert.strictEqual(data.address, wallet.getAddress());
    assert.strictEqual(data.outcome.result, 'tesSUCCESS');
    done(null, txData);
  });
}

function testTransaction(testcase, type, lastClosedLedgerVersion, txData, done) {
  const signedData = testcase.api.sign(txData, wallet.getSecret());
  console.log('PREPARED...');
  testcase.api.submit(signedData.signedTransaction, (error, data) => {
    console.log('SUBMITTED...');
    if (error) {
      done(error);
      return;
    }
    assert.strictEqual(data.engine_result, 'tesSUCCESS');
    const options = {
      minLedgerVersion: lastClosedLedgerVersion,
      maxLedgerVersion: txData.LastLedgerSequence
    };
    setTimeout(_.partial(verifyTransaction, testcase, signedData.id, type, options, txData, done), INTERVAL);
  });
}

function verifyResult(transactionType, transaction, done) {
  assert(transaction);
  assert.strictEqual(transaction.Account, wallet.getAddress());
  assert.strictEqual(transaction.TransactionType, transactionType);
  done(null, transaction);
}


function setup(done) {
  this.api = new RippleAPI({servers: ['wss://s1.ripple.com:443']});
  this.api.connect(() => {
    this.api.remote.getServer().once('ledger_closed', () => done());
  });
}

function teardown(done) {
  this.api.remote.disconnect(done);
}

describe.skip('integration tests', function() {
  const instructions = {maxLedgerVersionOffset: 100};
  this.timeout(TIMEOUT);

  beforeEach(setup);
  afterEach(teardown);

  it('settings', function(done) {
    const lastClosedLedgerVersion = this.api.getLedgerVersion();
    async.waterfall([
      this.api.prepareSettings.bind(this.api, wallet.getAddress(), settingsSpecification, instructions),
      _.partial(verifyResult, 'AccountSet'),
      _.partial(testTransaction, this, 'settings', lastClosedLedgerVersion)
    ], () => done());
  });


  it('trustline', function(done) {
    const lastClosedLedgerVersion = this.api.getLedgerVersion();
    async.waterfall([
      this.api.prepareTrustline.bind(this.api, wallet.getAddress(), trustlineSpecification, instructions),
      _.partial(verifyResult, 'TrustSet'),
      _.partial(testTransaction, this, 'trustline', lastClosedLedgerVersion)
    ], () => done());
  });


  it('payment', function(done) {
    const paymentSpecification = payments.payment({
      value: '0.000001',
      sourceAccount: wallet.getAddress(),
      destinationAccount: 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc'
    });
    const lastClosedLedgerVersion = this.api.getLedgerVersion();
    async.waterfall([
      this.api.preparePayment.bind(this.api, wallet.getAddress(), paymentSpecification, instructions),
      _.partial(verifyResult, 'Payment'),
      _.partial(testTransaction, this, 'payment', lastClosedLedgerVersion)
    ], () => done());
  });


  it('order', function(done) {
    const orderSpecification = {
      direction: 'buy',
      quantity: {
        currency: 'USD',
        value: '100',
        counterparty: 'r3PDtZSa5LiYp1Ysn1vMuMzB59RzV3W9QH'
      },
      totalPrice: {
        currency: 'XRP',
        value: '0.000001'
      },
      immediateOrCancel: true
    };
    const self = this;
    const lastClosedLedgerVersion = this.api.getLedgerVersion();
    async.waterfall([
      this.api.prepareOrder.bind(this.api, wallet.getAddress(), orderSpecification, instructions),
      _.partial(verifyResult, 'OfferCreate'),
      _.partial(testTransaction, this, 'order', lastClosedLedgerVersion),
      (txData, callback) => {
        self.api.prepareOrderCancellation(wallet.getAddress(), txData.Sequence, instructions, callback);
      },
      _.partial(verifyResult, 'OfferCancel'),
      _.partial(testTransaction, this, 'orderCancellation', lastClosedLedgerVersion)
    ], () => done());
  });

  /*
  // the 'order' test case already tests order cancellation
  // this is just for cancelling orders if something goes wrong during testing
  it.skip('cancel order', function(done) {
    const sequence = 280;
    const lastClosedLedgerVersion = this.api.getLedgerVersion();
    this.api.prepareOrderCancellation(wallet.getAddress(), sequence, instructions, (cerr, cancellationTxData) => {
      if (cerr) {
        done(cerr);
        return;
      }
      verifyResult('OfferCancel', cancellationTxData);
      testTransaction(this, cancellationTxData, 'orderCancellation', lastClosedLedgerVersion, done);
    });
  });
  */

});

