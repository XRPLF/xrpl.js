/* eslint-disable max-nested-callbacks */
'use strict';
const _ = require('lodash');
const assert = require('assert-diff');
const setupAPI = require('./setup-api');
const responses = require('./fixtures').responses;
const ledgerClosed = require('./fixtures/rippled/ledger-close');
const RippleAPI = require('ripple-api').RippleAPI;
const schemaValidator = RippleAPI._PRIVATE.schemaValidator;

const TIMEOUT = process.browser ? 25000 : 10000;

function checkResult(expected, schemaName, response) {
  if (expected.txJSON) {
    assert(response.txJSON);
    assert.deepEqual(JSON.parse(response.txJSON), JSON.parse(expected.txJSON));
  }
  assert.deepEqual(_.omit(response, 'txJSON'), _.omit(expected, 'txJSON'));
  if (schemaName) {
    schemaValidator.schemaValidate(schemaName, response);
  }
  return response;
}

describe('RippleAPIBroadcast', function() {
  this.timeout(TIMEOUT);
  beforeEach(setupAPI.setupBroadcast);
  afterEach(setupAPI.teardown);

  it('base', function() {
    const expected = {request_server_info: 1};
    if (!process.browser) {
      this.mocks.forEach(mock => mock.expect(_.assign({}, expected)));
    }
    assert(this.api.isConnected());
    return this.api.getServerInfo().then(
      _.partial(checkResult, responses.getServerInfo, 'getServerInfo'));
  });

  it('ledger', function(done) {
    let gotLedger = 0;
    this.api.on('ledger', () => {
      gotLedger++;
    });
    const ledgerNext = _.assign({}, ledgerClosed);
    ledgerNext.ledger_index++;

    this.api._apis.forEach(api => api.connection._send(JSON.stringify({
      command: 'echo',
      data: ledgerNext
    })));

    setTimeout(() => {
      assert.strictEqual(gotLedger, 1);
      done();
    }, 1250);
  });

  it('error propagation', function(done) {
    this.api.once('error', (type, info) => {
      assert.strictEqual(type, 'type');
      assert.strictEqual(info, 'info');
      done();
    });
    this.api._apis[1].connection._send(JSON.stringify({
      command: 'echo',
      data: {error: 'type', error_message: 'info'}
    }));
  });

});
