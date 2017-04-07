'use strict'; // eslint-disable-line
const _ = require('lodash');
const assert = require('assert');
const WebSocketServer = require('ws').Server;
const EventEmitter2 = require('eventemitter2').EventEmitter2;
const fixtures = require('./fixtures/rippled');
const addresses = require('./fixtures/addresses');
const hashes = require('./fixtures/hashes');
const transactionsResponse = require('./fixtures/rippled/account-tx');
const accountLinesResponse = require('./fixtures/rippled/account-lines');
const fullLedger = require('./fixtures/rippled/ledger-full-38129.json');
const {getFreePort} = require('./utils/net-utils');

function isUSD(json) {
  return json === 'USD' || json === '0000000000000000000000005553440000000000';
}

function isBTC(json) {
  return json === 'BTC' || json === '0000000000000000000000004254430000000000';
}

function createResponse(request, response, overrides = {}) {
  const result = _.assign({}, response.result, overrides);
  const change = response.result && !_.isEmpty(overrides) ?
    {id: request.id, result: result} : {id: request.id};
  return JSON.stringify(_.assign({}, response, change));
}

function createLedgerResponse(request, response) {
  const newResponse = JSON.parse(createResponse(request, response));
  if (newResponse.result && newResponse.result.ledger) {
    if (!request.transactions) {
      delete newResponse.result.ledger.transactions;
    }
    if (!request.accounts) {
      delete newResponse.result.ledger.accountState;
    }
    // the following fields were not in the ledger response in the past
    if (newResponse.result.ledger.close_flags === undefined) {
      newResponse.result.ledger.close_flags = 0;
    }
    if (newResponse.result.ledger.parent_close_time === undefined) {
      newResponse.result.ledger.parent_close_time =
        newResponse.result.ledger.close_time - 10;
    }
  }
  return JSON.stringify(newResponse);
}

module.exports = function createMockRippled(port) {
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

  mock.on('connection', function(conn) {
    if (mock.config.breakNextConnection) {
      mock.config.breakNextConnection = false;
      conn.terminate();
      return;
    }
    this.socket = conn;
    conn.config = {};
    conn.on('message', function(requestJSON) {
      const request = JSON.parse(requestJSON);
      mock.emit('request_' + request.command, request, conn);
    });
  });

  mock.config = {};

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

  mock.on('request_config', function(request, conn) {
    assert.strictEqual(request.command, 'config');
    conn.config = _.assign(conn.config, request.data);
  });

  mock.on('request_test_command', function(request, conn) {
    assert.strictEqual(request.command, 'test_command');
    if (request.data.disconnectIn) {
      setTimeout(conn.terminate.bind(conn), request.data.disconnectIn);
    } else if (request.data.openOnOtherPort) {
      getFreePort().then(newPort => {
        createMockRippled(newPort);
        conn.send(createResponse(request, {status: 'success', type: 'response',
          result: {port: newPort}}
        ));
      });
    } else if (request.data.closeServerAndReopen) {
      setTimeout(() => {
        conn.terminate();
        close.call(mock, () => {
          setTimeout(() => {
            createMockRippled(port);
          }, request.data.closeServerAndReopen);
        });
      }, 10);
    }
  });

  mock.on('request_global_config', function(request, conn) {
    assert.strictEqual(request.command, 'global_config');
    mock.config = _.assign(conn.config, request.data);
  });

  mock.on('request_echo', function(request, conn) {
    assert.strictEqual(request.command, 'echo');
    conn.send(JSON.stringify(request.data));
  });

  mock.on('request_server_info', function(request, conn) {
    assert.strictEqual(request.command, 'server_info');
    if (conn.config.returnErrorOnServerInfo) {
      conn.send(createResponse(request, fixtures.server_info.error));
    } else if (conn.config.disconnectOnServerInfo) {
      conn.close();
    } else if (conn.config.serverInfoWithoutValidated) {
      conn.send(createResponse(request, fixtures.server_info.noValidated));
    } else if (mock.config.returnSyncingServerInfo) {
      mock.config.returnSyncingServerInfo--;
      conn.send(createResponse(request, fixtures.server_info.syncing));
    } else {
      conn.send(createResponse(request, fixtures.server_info.normal));
    }
  });

  mock.on('request_subscribe', function(request, conn) {
    assert.strictEqual(request.command, 'subscribe');
    if (mock.config.returnEmptySubscribeRequest) {
      mock.config.returnEmptySubscribeRequest--;
      conn.send(createResponse(request, fixtures.empty));
    } else if (request.accounts) {
      assert(_.indexOf(_.values(addresses), request.accounts[0]) !== -1);
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
    if (request.ledger_index === 34) {
      conn.send(createLedgerResponse(request, fixtures.ledger.notFound));
    } else if (request.ledger_index === 6) {
      conn.send(createResponse(request, fixtures.ledger.withStateAsHashes));
    } else if (request.ledger_index === 9038215) {
      conn.send(
        createLedgerResponse(request, fixtures.ledger.withoutCloseTime));
    } else if (request.ledger_index === 4181996) {
      conn.send(createLedgerResponse(request, fixtures.ledger.withSettingsTx));
    } else if (request.ledger_index === 100000) {
      conn.send(
        createLedgerResponse(request, fixtures.ledger.withPartialPayment));
    } else if (request.ledger_index === 100001) {
      conn.send(
        createLedgerResponse(request, fixtures.ledger.pre2014withPartial));
    } else if (request.ledger_index === 38129) {
      const response = _.assign({}, fixtures.ledger.normal,
        {result: {ledger: fullLedger}});
      conn.send(createLedgerResponse(request, response));
    } else {
      conn.send(createLedgerResponse(request, fixtures.ledger.normal));
    }
  });

  mock.on('request_ledger_entry', function(request, conn) {
    assert.strictEqual(request.command, 'ledger_entry');
    if (request.index ===
        'E30E709CF009A1F26E0E5C48F7AA1BFB79393764F15FB108BDC6E06D3CBD8415') {
      conn.send(createResponse(request, fixtures.payment_channel.normal));
    } else if (request.index ===
        'D77CD4713AA08195E6B6D0E5BC023DA11B052EBFF0B5B22EDA8AE85345BCF661') {
      conn.send(createResponse(request, fixtures.payment_channel.full));
    } else if (request.index ===
        '8EF9CCB9D85458C8D020B3452848BBB42EAFDDDB69A93DD9D1223741A4CA562B') {
      conn.send(createResponse(request, fixtures.escrow));
    } else {
      conn.send(createResponse(request, fixtures.ledger_entry.error));
    }
  });

  mock.on('request_tx', function(request, conn) {
    assert.strictEqual(request.command, 'tx');
    if (request.transaction === hashes.VALID_TRANSACTION_HASH) {
      conn.send(createResponse(request, fixtures.tx.Payment));
    } else if (request.transaction ===
        '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA1B') {
      conn.send(createResponse(request, fixtures.tx.AccountSet));
    } else if (request.transaction ===
        '8925FC8844A1E930E2CC76AD0A15E7665AFCC5425376D548BB1413F484C31B8C') {
      conn.send(createResponse(request, fixtures.tx.AccountSetTrackingOn));
    } else if (request.transaction ===
        'C8C5E20DFB1BF533D0D81A2ED23F0A3CBD1EF2EE8A902A1D760500473CC9C582') {
      conn.send(createResponse(request, fixtures.tx.AccountSetTrackingOff));
    } else if (request.transaction ===
        '278E6687C1C60C6873996210A6523564B63F2844FB1019576C157353B1813E60') {
      conn.send(createResponse(request, fixtures.tx.RegularKey));
    } else if (request.transaction ===
        '10A6FB4A66EE80BED46AAE4815D7DC43B97E944984CCD5B93BCF3F8538CABC51') {
      conn.send(createResponse(request, fixtures.tx.OfferCreate));
    } else if (request.transaction ===
        '458101D51051230B1D56E9ACAFAA34451BF65FA000F95DF6F0FF5B3A62D83FC2') {
      conn.send(createResponse(request, fixtures.tx.OfferCreateSell));
    } else if (request.transaction ===
        '809335DD3B0B333865096217AA2F55A4DF168E0198080B3A090D12D88880FF0E') {
      conn.send(createResponse(request, fixtures.tx.OfferCancel));
    } else if (request.transaction ===
        '635A0769BD94710A1F6A76CDE65A3BC661B20B798807D1BBBDADCEA26420538D') {
      conn.send(createResponse(request, fixtures.tx.TrustSet));
    } else if (request.transaction ===
        '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA11') {
      conn.send(createResponse(request, fixtures.tx.NoLedgerIndex));
    } else if (request.transaction ===
        '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA12') {
      conn.send(createResponse(request, fixtures.tx.NoLedgerFound));
    } else if (request.transaction ===
        '0F7ED9F40742D8A513AE86029462B7A6768325583DF8EE21B7EC663019DD6A04') {
      conn.send(createResponse(request, fixtures.tx.LedgerWithoutTime));
    } else if (request.transaction ===
        'FE72FAD0FA7CA904FB6C633A1666EDF0B9C73B2F5A4555D37EEF2739A78A531B') {
      conn.send(createResponse(request, fixtures.tx.TrustSetFrozenOff));
    } else if (request.transaction ===
        'BAF1C678323C37CCB7735550C379287667D8288C30F83148AD3C1CB019FC9002') {
      conn.send(createResponse(request, fixtures.tx.TrustSetNoQuality));
    } else if (request.transaction ===
        '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA10') {
      conn.send(createResponse(request, fixtures.tx.NotValidated));
    } else if (request.transaction === hashes.NOTFOUND_TRANSACTION_HASH) {
      conn.send(createResponse(request, fixtures.tx.NotFound));
    } else if (request.transaction ===
        '097B9491CC76B64831F1FEA82EAA93BCD728106D90B65A072C933888E946C40B') {
      conn.send(createResponse(request, fixtures.tx.OfferWithExpiration));
    } else if (request.transaction ===
        '144F272380BDB4F1BD92329A2178BABB70C20F59042C495E10BF72EBFB408EE1') {
      conn.send(createResponse(request, fixtures.tx.EscrowCreation));
    } else if (request.transaction ===
        'F346E542FFB7A8398C30A87B952668DAB48B7D421094F8B71776DA19775A3B22') {
      conn.send(createResponse(request, fixtures.tx.EscrowCancellation));
    } else if (request.transaction ===
        'CC5277137B3F25EE8B86259C83CB0EAADE818505E4E9BCBF19B1AC6FD136993B') {
      conn.send(createResponse(request, fixtures.tx.EscrowExecution));
    } else if (request.transaction ===
        'CC5277137B3F25EE8B86259C83CB0EAADE818505E4E9BCBF19B1AC6FD1369931') {
      conn.send(createResponse(request,
        fixtures.tx.EscrowExecutionSimple));
    } else if (request.transaction ===
        '0E9CA3AB1053FC0C1CBAA75F636FE1EC92F118C7056BBEF5D63E4C116458A16D') {
      conn.send(createResponse(request, fixtures.tx.PaymentChannelCreate));
    } else if (request.transaction ===
        'CD053D8867007A6A4ACB7A432605FE476D088DCB515AFFC886CF2B4EB6D2AE8B') {
      conn.send(createResponse(request, fixtures.tx.PaymentChannelFund));
    } else if (request.transaction ===
        '81B9ECAE7195EB6E8034AEDF44D8415A7A803E14513FDBB34FA984AB37D59563') {
      conn.send(createResponse(request, fixtures.tx.PaymentChannelClaim));
    } else if (request.transaction ===
        'AFB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA11') {
      conn.send(createResponse(request, fixtures.tx.Unrecognized));
    } else if (request.transaction ===
        'AFB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA1B') {
      conn.send(createResponse(request, fixtures.tx.NoMeta));
    } else if (request.transaction ===
        '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA13') {
      conn.send(createResponse(request, fixtures.tx.LedgerZero));
    } else if (request.transaction ===
        'A971B83ABED51D83749B73F3C1AAA627CD965AFF74BE8CD98299512D6FB0658F') {
      conn.send(createResponse(request, fixtures.tx.Amendment));
    } else if (request.transaction ===
        'C6A40F56127436DCD830B1B35FF939FD05B5747D30D6542572B7A835239817AF') {
      conn.send(createResponse(request, fixtures.tx.SetFee));
    } else {
      assert(false, 'Unrecognized transaction hash: ' + request.transaction);
    }
  });

  mock.on('request_submit', function(request, conn) {
    assert.strictEqual(request.command, 'submit');
    if (request.tx_blob === 'BAD') {
      conn.send(createResponse(request, fixtures.submit.failure));
    } else {
      conn.send(createResponse(request, fixtures.submit.success));
    }
  });

  mock.on('request_submit_multisigned', function(request, conn) {
    assert.strictEqual(request.command, 'submit_multisigned');
    conn.send(createResponse(request, fixtures.submit.success));
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
    } else if (request.account === addresses.OTHER_ACCOUNT) {
      conn.send(createResponse(request, fixtures.account_tx.one));
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
    if (request.taker_pays.issuer === 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw') {
      conn.send(createResponse(request, fixtures.book_offers.xrp_usd));
    } else if (request.taker_gets.issuer
        === 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw') {
      conn.send(createResponse(request, fixtures.book_offers.usd_xrp));
    } else if (isBTC(request.taker_gets.currency)
        && isUSD(request.taker_pays.currency)) {
      conn.send(
        fixtures.book_offers.fabric.requestBookOffersBidsResponse(request));
    } else if (isUSD(request.taker_gets.currency)
        && isBTC(request.taker_pays.currency)) {
      conn.send(
        fixtures.book_offers.fabric.requestBookOffersAsksResponse(request));
    } else {
      assert(false, 'Unrecognized order book: ' + JSON.stringify(request));
    }
  });

  mock.on('request_ripple_path_find', function(request, conn) {
    let response = null;
    if (request.subcommand === 'close') {   // for path_find command
      return;
    }
    if (request.source_account === addresses.NOTFOUND) {
      response = createResponse(request, fixtures.path_find.srcActNotFound);
    } else if (request.source_account === addresses.SOURCE_LOW_FUNDS) {
      response = createResponse(request, fixtures.path_find.sourceAmountLow);
    } else if (request.source_account === addresses.OTHER_ACCOUNT) {
      response = createResponse(request, fixtures.path_find.sendUSD);
    } else if (request.source_account === addresses.THIRD_ACCOUNT) {
      response = createResponse(request, fixtures.path_find.XrpToXrp, {
        destination_amount: request.destination_amount,
        destination_address: request.destination_address
      });
    } else if (request.source_account === addresses.ACCOUNT) {
      if (request.destination_account ===
          'ra5nK24KXen9AHvsdFTKHSANinZseWnPcX') {
        response = createResponse(request, fixtures.path_find.sendAll);
      } else {
        response = fixtures.path_find.generate.generateIOUPaymentPaths(
          request.id, request.source_account, request.destination_account,
          request.destination_amount);
      }
    } else {
      assert(false, 'Unrecognized path find request: '
             + JSON.stringify(request));
    }
    conn.send(response);
  });

  mock.on('request_gateway_balances', function(request, conn) {
    if (request.ledger_index === 123456) {
      conn.send(createResponse(request, fixtures.unsubscribe));
    } else {
      conn.send(createResponse(request, fixtures.gateway_balances));
    }
  });

  return mock;
};
