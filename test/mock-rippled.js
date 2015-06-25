'use strict';
const _ = require('lodash');
const assert = require('assert');
const WebSocketServer = require('ws').Server;
const EventEmitter2 = require('eventemitter2').EventEmitter2;
const fixtures = require('./fixtures/mock');
const addresses = require('./fixtures/addresses');
const hashes = require('./fixtures/hashes');
const accountOffersResponse = require('./fixtures/acct-offers-response');

module.exports = function(port) {
  const mock = new WebSocketServer({port: port});
  _.assign(mock, EventEmitter2.prototype);

  const close = mock.close;
  mock.close = function() {
    if (mock.expectedRequests !== undefined) {
      const allRequestsMade = _.every(mock.expectedRequests, function(counter) {
        return counter === 0;
      });
      if (!allRequestsMade) {
        const json = JSON.stringify(mock.expectedRequests, null, 2);
        const indent = '      ';
        const indented = indent + json.replace(/\n/g, '\n' + indent);
        assert(false, 'Not all expected requests were made:\n' + indented);
      }
    }
    close.call(mock);
  };

  mock.expect = function(expectedRequests) {
    mock.expectedRequests = expectedRequests;
  };

  mock.once('connection', function(conn) {
    conn.on('message', function(requestJSON) {
      const request = JSON.parse(requestJSON);
      mock.emit('request_' + request.command, request, conn);
    });
  });

  mock.onAny(function() {
    if (this.event.indexOf('request_') !== 0) {
      return;
    }
    if (mock.listeners(this.event).length === 0) {
      throw new Error('No event handler registered for ' + this.event);
    }
    if (mock.expectedRequests === undefined) {
      return;   // TODO: fail here to require expectedRequests
    }
    const expectedCount = mock.expectedRequests[this.event];
    if (expectedCount === undefined || expectedCount === 0) {
      throw new Error('Unexpected request: ' + this.event);
    }
    mock.expectedRequests[this.event] -= 1;
  });

  mock.on('request_server_info', function(request, conn) {
    assert.strictEqual(request.command, 'server_info');
    conn.send(fixtures.serverInfoResponse(request));
  });

  mock.on('request_subscribe', function(request, conn) {
    assert.strictEqual(request.command, 'subscribe');
    if (request.accounts) {
      assert.strictEqual(request.accounts[0], addresses.ACCOUNT);
    } else {
      assert.deepEqual(request.streams, ['ledger', 'server']);
    }
    conn.send(fixtures.subscribeResponse(request));
  });

  mock.on('request_account_info', function(request, conn) {
    assert.strictEqual(request.command, 'account_info');
    if (request.account === addresses.ACCOUNT) {
      conn.send(fixtures.accountInfoResponse(request));
    } else if (request.account === addresses.NOTFOUND) {
      conn.send(fixtures.accountNotFoundResponse(request));
    } else {
      assert(false, 'Unrecognized account address: ' + request.account);
    }
  });

  mock.on('request_ledger', function(request, conn) {
    assert.strictEqual(request.command, 'ledger');
    conn.send(fixtures.ledgerResponse(request));
  });

  mock.on('request_tx', function(request, conn) {
    assert.strictEqual(request.command, 'tx');
    if (request.transaction === hashes.VALID_TRANSACTION_HASH) {
      conn.send(fixtures.transactionResponse(request));
    } else if (request.transaction === hashes.NOTFOUND_TRANSACTION_HASH) {
      conn.send(fixtures.transactionNotFoundResponse(request));
    } else {
      assert(false, 'Unrecognized transaction hash: ' + request.transaction);
    }
  });

  mock.on('request_submit', function(request, conn) {
    assert.strictEqual(request.command, 'submit');
    conn.send(fixtures.submitResponse(request));
  });

  mock.on('request_account_lines', function(request, conn) {
    if (request.account === addresses.ACCOUNT) {
      conn.send(fixtures.accountLinesResponse(request));
    } else if (request.account === addresses.OTHER_ACCOUNT) {
      conn.send(fixtures.accountLinesCounterpartyResponse(request));
    } else {
      assert(false, 'Unrecognized account address: ' + request.account);
    }
  });

  mock.on('request_account_tx', function(request, conn) {
    if (request.account === addresses.ACCOUNT) {
      conn.send(fixtures.accountTransactionsResponse(request));
    } else {
      assert(false, 'Unrecognized account address: ' + request.account);
    }
  });

  mock.on('request_account_offers', function(request, conn) {
    if (request.account === addresses.ACCOUNT) {
      conn.send(accountOffersResponse(request));
    } else {
      assert(false, 'Unrecognized account address: ' + request.account);
    }
  });

  return mock;
};
