'use strict';
const assert = require('assert');
const setupAPI = require('./setup-api');
const address = require('./fixtures/addresses').ACCOUNT;
const paymentSpecification = require('./fixtures/payment-specification');
const paymentResponse = require('./fixtures/payment-response');
const balancesResponse = require('./fixtures/balances-response');

describe('RippleAPI', function() {
  beforeEach(setupAPI.setup);
  afterEach(setupAPI.teardown);

  it('preparePayment', function(done) {
    const instructions = {lastLedgerOffset: 100};
    this.api.preparePayment(address, paymentSpecification, instructions,
    (error, response) => {
      if (error) {
        done(error);
        return;
      }
      assert.deepEqual(response, paymentResponse);
      done();
    });
  });

  it('getBalances', function(done) {
    this.api.getBalances(address, {}, (error, response) => {
      if (error) {
        done(error);
        return;
      }
      assert.deepEqual(response, balancesResponse);
      done();
    });
  });
});
