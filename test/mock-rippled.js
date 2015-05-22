'use strict';
const _ = require('lodash');
const assert = require('assert');
const WebSocketServer = require('ws').Server;
const EventEmitter2 = require('eventemitter2').EventEmitter2;
const fixtures = require('./fixtures/mock');
const addresses = require('./fixtures/addresses');
const hashes = require('./fixtures/hashes');

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
    conn.on('message', function(messageJSON) {
      const message = JSON.parse(messageJSON);
      mock.emit('request_' + message.command, message, conn);
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

  mock.on('request_server_info', function(message, conn) {
    assert.strictEqual(message.command, 'server_info');
    conn.send(fixtures.serverInfoResponse(message));
  });

  mock.on('request_subscribe', function(message, conn) {
    assert.strictEqual(message.command, 'subscribe');
    if (message.accounts) {
      assert.strictEqual(message.accounts[0], addresses.ACCOUNT);
    } else {
      assert.deepEqual(message.streams, ['ledger', 'server']);
    }
    conn.send(fixtures.subscribeResponse(message));
  });

  mock.on('request_account_info', function(message, conn) {
    assert.strictEqual(message.command, 'account_info');
    if (message.account === addresses.ACCOUNT) {
      conn.send(fixtures.accountInfoResponse(message));
    } else if (message.account === addresses.NOTFOUND) {
      conn.send(fixtures.accountNotFoundResponse(message));
    } else {
      assert(false, 'Unrecognized account address: ' + message.account);
    }
  });

  mock.on('request_ledger', function(message, conn) {
    assert.strictEqual(message.command, 'ledger');
    conn.send(fixtures.ledgerResponse(message));
  });

  mock.on('request_tx', function(message, conn) {
    assert.strictEqual(message.command, 'tx');
    if (message.transaction === hashes.VALID_TRANSACTION_HASH) {
      conn.send(fixtures.transactionResponse(message));
    } else if (message.transaction === hashes.NOTFOUND_TRANSACTION_HASH) {
      conn.send(fixtures.transactionNotFoundResponse(message));
    } else {
      assert(false, 'Unrecognized transaction hash: ' + message.transaction);
    }
  });

  mock.on('request_account_lines', function(message, conn) {
    if (message.account === addresses.ACCOUNT) {
      conn.send(fixtures.accountLinesResponse(message));
    } else if (message.account === addresses.OTHER_ACCOUNT) {
      conn.send(fixtures.accountLinesCounterpartyResponse(message));
    } else {
      assert(false, 'Unrecognized account address: ' + message.account);
    }
  });

  return mock;
};
