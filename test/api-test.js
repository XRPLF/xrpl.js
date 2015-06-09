'use strict';
const _ = require('lodash');
const assert = require('assert-diff');
const setupAPI = require('./setup-api');
const address = require('./fixtures/addresses').ACCOUNT;
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

function checkResult(expected, done, error, response) {
  if (error) {
    done(error);
    return;
  }
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

  it('getBalances', function(done) {
    this.api.getBalances(address, {},
      _.partial(checkResult, balancesResponse, done));
  });
});
