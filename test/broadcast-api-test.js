/* eslint-disable max-nested-callbacks */
'use strict';
const _ = require('lodash');
const assert = require('assert-diff');
const setupAPI = require('./setup-api');
const responses = require('./fixtures').responses;
const ledgerClosed = require('./fixtures/rippled/ledger-close');
const RippleAPI = require('ripple-api').RippleAPI;
const schemaValidator = RippleAPI._PRIVATE.schemaValidator;

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
  beforeEach(setupAPI.setupBroadcast);
  afterEach(setupAPI.teardown);

  it('base', function() {
    const expected = {request_server_info: 1};
    this.mocks.forEach(mock => mock.expect(_.assign({}, expected)));
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
    this.mocks.forEach(mock => mock.socket.send(JSON.stringify(ledgerNext)));

    setTimeout(() => {
      console.log('-- ledgerVersion', this.api.ledgerVersion);
      assert.strictEqual(gotLedger, 1);
      done();
    }, 50);

  });

  it('error propagation', function(done) {
    this.api.once('error', (type, info) => {
      assert.strictEqual(type, 'type');
      assert.strictEqual(info, 'info');
      done();
    });
    this.mocks[1].socket.send(
      JSON.stringify({error: 'type', error_message: 'info'}));
  });

});
