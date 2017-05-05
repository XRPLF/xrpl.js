/* eslint-disable max-nested-callbacks */
'use strict';
const assert = require('assert-diff');
const _ = require('lodash');
const jayson = require('jayson');

const RippleAPI = require('../../src').RippleAPI;
const createHTTPServer = require('../../src/http').createHTTPServer;
const {payTo, ledgerAccept} = require('./utils');

const apiFixtures = require('../fixtures');
const apiRequests = apiFixtures.requests;
const apiResponses = apiFixtures.responses;

const TIMEOUT = 20000;   // how long before each test case times out

const serverUri = 'ws://127.0.0.1:6006';
const apiOptions = {
  server: serverUri
};

const httpPort = 3000;

function createClient() {
  return jayson.client.http({port: httpPort, hostname: 'localhost'});
}

const address = 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59';

function makePositionalParams(params) {
  return params.map(value => value[_.keys(value)[0]]);
}

function makeNamedParams(params) {
  return _.reduce(params, _.assign, {});
}

function random() {
  return _.fill(Array(16), 0);
}


describe('http server integration tests', function() {
  this.timeout(TIMEOUT);

  let server = null;
  let client = null;
  let paymentId = null;
  let newWallet = null;

  function createTestInternal(testName, methodName, params, testFunc, id) {
    it(testName, function() {
      return new Promise((resolve, reject) => {
        client.request(methodName, params, id,
          (err, result) => err ? reject(err) : resolve(testFunc(result)));
      });
    });
  }

  function createTest(name, params, testFunc, id) {
    createTestInternal(name + ' - positional params', name,
      makePositionalParams(params), testFunc, id);
    createTestInternal(name + ' - named params', name,
      makeNamedParams(params), testFunc, id);
  }

  before(() => {
    this.api = new RippleAPI({server: serverUri});
    console.log('CONNECTING...');
    return this.api.connect().then(() => {
      console.log('CONNECTED...');
    })
    .then(() => ledgerAccept(this.api))
    .then(() => newWallet = this.api.generateAddress())
    .then(() => ledgerAccept(this.api))
    .then(() => payTo(this.api, newWallet.address))
    .then(paymentId_ => {
      paymentId = paymentId_;
    });
  });

  beforeEach(function() {
    server = createHTTPServer(apiOptions, httpPort);
    return server.start().then(() => {
      this.client = createClient();
      client = this.client;
    });
  });

  afterEach(function() {
    return server.stop();
  });


  createTest(
    'getLedgerVersion',
    [],
    result => assert(_.isNumber(result.result))
  );

  createTest(
    'getServerInfo',
    [],
    result => assert(_.isNumber(result.result.validatedLedger.ledgerVersion))
  );

  it('getTransaction', function() {
    const params = [{id: paymentId}];
    return new Promise((resolve, reject) => {
      client.request('getTransaction', makePositionalParams(params),
        (err, result) => {
          if (err) {
            reject(err);
          }
          assert.strictEqual(result.result.id, paymentId);
          const outcome = result.result.outcome;
          assert.strictEqual(outcome.result, 'tesSUCCESS');
          assert.strictEqual(outcome.balanceChanges
            .rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh[0].value, '-4003218.000012');
          resolve(result);
        });
    });
  });

  it('getTransactions', function() {
    const params = [{address: newWallet.address}, {
      options: {
        binary: true,
        limit: 1
      }
    }];
    return new Promise((resolve, reject) => {
      client.request('getTransactions', makeNamedParams(params),
        (err, result) => {
          if (err) {
            reject(err);
          }
          assert.strictEqual(result.result.length, 1);
          assert.strictEqual(result.result[0].id, paymentId);
          resolve(result);
        });
    });
  });

  createTest(
    'prepareSettings',
    [
      {address},
      {settings: apiRequests.prepareSettings.domain},
      {instructions: {
        maxFee: '0.000012',
        sequence: 23,
        maxLedgerVersion: 8820051
      }}
    ],
    result => {
      const got = JSON.parse(result.result.txJSON);
      const expected = JSON.parse(apiResponses.prepareSettings.flags.txJSON);
      assert.deepEqual(got, expected);
    }
  );

  createTest(
    'sign',
    [{txJSON: apiRequests.sign.normal.txJSON},
    {secret: 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV'}],
    result => assert.deepEqual(result.result, apiResponses.sign.normal)
  );

  createTest(
    'generateAddress',
    [{options: {entropy: random()}}],
    result => assert.deepEqual(result.result, apiResponses.generateAddress)
  );

  createTest(
    'computeLedgerHash',
    [{ledger: _.assign({}, apiResponses.getLedger.full,
      {parentCloseTime: apiResponses.getLedger.full.closeTime})
    }],
    result => {
      assert.strictEqual(result.result,
        'E6DB7365949BF9814D76BCC730B01818EB9136A89DB224F3F9F5AAE4569D758E');
    }
  );

  createTest(
    'isConnected',
    [],
    result => assert(result.result)
  );

});
