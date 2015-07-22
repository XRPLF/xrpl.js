'use strict';
const _ = require('lodash');
const assert = require('assert');
const WebSocketServer = require('ws').Server;
const EventEmitter2 = require('eventemitter2').EventEmitter2;
const fixtures = require('./fixtures/api/rippled');
const addresses = require('./fixtures/addresses');
const hashes = require('./fixtures/hashes');
const transactionsResponse = require('./fixtures/api/rippled/account-tx');
const accountLinesResponse = require('./fixtures/api/rippled/account-lines');

function isUSD(json) {
  return json === 'USD' || json === '0000000000000000000000005553440000000000';
}

function isBTC(json) {
  return json === 'BTC' || json === '0000000000000000000000004254430000000000';
}

function createResponse(request, response) {
  return JSON.stringify(_.assign({}, response, {id: request.id}));
}

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
    conn.send(createResponse(request, fixtures.server_info));
  });

  mock.on('request_subscribe', function(request, conn) {
    assert.strictEqual(request.command, 'subscribe');
    if (request.accounts) {
      assert(_.indexOf(_.values(addresses), request.accounts[0]) !== -1);
    } else {
      assert.deepEqual(request.streams, ['ledger', 'server']);
    }
    conn.send(createResponse(request, fixtures.subscribe));
  });

  mock.on('request_unsubscribe', function(request, conn) {
    assert.strictEqual(request.command, 'unsubscribe');
    if (request.accounts) {
      assert(_.indexOf(_.values(addresses), request.accounts[0]) !== -1);
    } else {
      assert.deepEqual(request.streams, ['ledger', 'server']);
    }
    conn.send(createResponse(request, fixtures.unsubscribe));
  });

  mock.on('request_account_info', function(request, conn) {
    assert.strictEqual(request.command, 'account_info');
    if (request.account === addresses.ACCOUNT) {
      conn.send(createResponse(request, fixtures.account_info.normal));
    } else if (request.account === addresses.NOTFOUND) {
      conn.send(createResponse(request, fixtures.account_info.notfound));
    } else if (request.account === addresses.THIRD_ACCOUNT) {
      const response = _.assign({}, fixtures.account_info.normal);
      response.Account = addresses.THIRD_ACCOUNT;
      conn.send(createResponse(request, response));
    } else {
      assert(false, 'Unrecognized account address: ' + request.account);
    }
  });

  mock.on('request_ledger', function(request, conn) {
    assert.strictEqual(request.command, 'ledger');
    conn.send(createResponse(request, fixtures.ledger));
  });

  mock.on('request_tx', function(request, conn) {
    assert.strictEqual(request.command, 'tx');
    if (request.transaction === hashes.VALID_TRANSACTION_HASH) {
      conn.send(createResponse(request, fixtures.tx.Payment));
    } else if (request.transaction ===
        '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA1B') {
      conn.send(createResponse(request, fixtures.tx.AccountSet));
    } else if (request.transaction ===
        '10A6FB4A66EE80BED46AAE4815D7DC43B97E944984CCD5B93BCF3F8538CABC51') {
      conn.send(createResponse(request, fixtures.tx.OfferCreate));
    } else if (request.transaction ===
        '809335DD3B0B333865096217AA2F55A4DF168E0198080B3A090D12D88880FF0E') {
      conn.send(createResponse(request, fixtures.tx.OfferCancel));
    } else if (request.transaction ===
        '635A0769BD94710A1F6A76CDE65A3BC661B20B798807D1BBBDADCEA26420538D') {
      conn.send(createResponse(request, fixtures.tx.TrustSet));
    } else if (request.transaction === hashes.NOTFOUND_TRANSACTION_HASH) {
      conn.send(createResponse(request, fixtures.tx.NotFound));
    } else {
      assert(false, 'Unrecognized transaction hash: ' + request.transaction);
    }
  });

  mock.on('request_submit', function(request, conn) {
    assert.strictEqual(request.command, 'submit');
    conn.send(createResponse(request, fixtures.submit));
  });

  mock.on('request_account_lines', function(request, conn) {
    if (request.account === addresses.ACCOUNT) {
      conn.send(accountLinesResponse.normal(request));
    } else if (request.account === addresses.OTHER_ACCOUNT) {
      conn.send(accountLinesResponse.counterparty(request));
    } else if (request.account === addresses.NOTFOUND) {
      conn.send(createResponse(request, fixtures.account_info.notfound));
    } else {
      assert(false, 'Unrecognized account address: ' + request.account);
    }
  });

  mock.on('request_account_tx', function(request, conn) {
    if (request.account === addresses.ACCOUNT) {
      conn.send(transactionsResponse(request));
    } else {
      assert(false, 'Unrecognized account address: ' + request.account);
    }
  });

  mock.on('request_account_offers', function(request, conn) {
    if (request.account === addresses.ACCOUNT) {
      conn.send(fixtures.account_offers(request));
    } else {
      assert(false, 'Unrecognized account address: ' + request.account);
    }
  });

  mock.on('request_book_offers', function(request, conn) {
    if (isBTC(request.taker_gets.currency)
        && isUSD(request.taker_pays.currency)) {
      conn.send(fixtures.book_offers.requestBookOffersBidsResponse(request));
    } else if (isUSD(request.taker_gets.currency)
        && isBTC(request.taker_pays.currency)) {
      conn.send(fixtures.book_offers.requestBookOffersAsksResponse(request));
    } else {
      assert(false, 'Unrecognized order book: ' + JSON.stringify(request));
    }
  });

  mock.on('request_ripple_path_find', function(request, conn) {
    let response = null;
    if (request.source_account === addresses.OTHER_ACCOUNT) {
      response = createResponse(request, fixtures.ripple_path_find.sendUSD);
    } else if (request.source_account === addresses.THIRD_ACCOUNT) {
      response = createResponse(request, fixtures.ripple_path_find.XrpToXrp);
    } else {
      response = fixtures.ripple_path_find.generate.generateIOUPaymentPaths(
        request.id, request.source_account, request.destination_account,
        request.destination_amount);
    }
    conn.send(response);
  });

  return mock;
};
