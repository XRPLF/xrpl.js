var assert = require('assert');
var utils  = require('./testutils');

var Remote = utils.load_module('remote').Remote;
var Server = utils.load_module('server').Server;
var Request = utils.load_module('request').Request;

var options, remote, callback, database, tx;

var ADDRESS       = 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS';
var PEER_ADDRESS  = 'rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX';
var LEDGER_INDEX  = 9592219;
var LEDGER_HASH   = 'B4FD84A73DBD8F0DA9E320D137176EBFED969691DC0AAC7882B76B595A0841AE';
var PAGING_MARKER = '29F992CC252056BF690107D1E8F2D9FBAFF29FF107B62B1D1F4E4E11ADF2CC73';

describe('Remote', function () {
  beforeEach(function () {
    options = {
      trace :         true,
      trusted:        true,
      local_signing:  true,

      servers: [
        { host: 's-west.ripple.com', port: 443, secure: true },
        { host: 's-east.ripple.com', port: 443, secure: true }
      ],

      blobvault : 'https://blobvault.payward.com',
      persistent_auth : false,
      transactions_per_page: 50,

      bridge: {
        out: {
          //    'bitcoin': 'localhost:3000'
          //    'bitcoin': 'https://www.bitstamp.net/ripple/bridge/out/bitcoin/'
        }
      }

    };
  });

  it('remote server initialization - url object', function() {
    var remote = new Remote({
      servers: [ { host: 's-west.ripple.com', port: 443, secure: true } ]
    });
    assert(Array.isArray(remote._servers));
    assert(remote._servers[0] instanceof Server);
    assert.strictEqual(remote._servers[0]._url, 'wss://s-west.ripple.com:443');
  });

  it('remote server initialization - url object - no secure property', function() {
    var remote = new Remote({
      servers: [ { host: 's-west.ripple.com', port: 443 } ]
    });
    assert(Array.isArray(remote._servers));
    assert(remote._servers[0] instanceof Server);
    assert.strictEqual(remote._servers[0]._url, 'wss://s-west.ripple.com:443');
  });

  it('remote server initialization - url object - secure: false', function() {
    var remote = new Remote({
      servers: [ { host: 's-west.ripple.com', port: 443, secure: false } ]
    });
    assert(Array.isArray(remote._servers));
    assert(remote._servers[0] instanceof Server);
    assert.strictEqual(remote._servers[0]._url, 'ws://s-west.ripple.com:443');
  });

  it('remote server initialization - url object - string port', function() {
    var remote = new Remote({
      servers: [ { host: 's-west.ripple.com', port: '443', secure: true } ]
    });
    assert(Array.isArray(remote._servers));
    assert(remote._servers[0] instanceof Server);
    assert.strictEqual(remote._servers[0]._url, 'wss://s-west.ripple.com:443');
  });

  it('remote server initialization - url object - invalid host', function() {
    assert.throws(
      function() {
      var remote = new Remote({
        servers: [ { host: '+', port: 443, secure: true } ]
      });
    }, Error);
  });

  it('remote server initialization - url object - invalid port', function() {
    assert.throws(
      function() {
      var remote = new Remote({
        servers: [ { host: 's-west.ripple.com', port: null, secure: true } ]
      });
    }, TypeError);
  });

  it('remote server initialization - url object - port out of range', function() {
    assert.throws(
      function() {
      var remote = new Remote({
        servers: [ { host: 's-west.ripple.com', port: 65537, secure: true } ]
      });
    }, Error);
  });

  it('remote server initialization - url string', function() {
    var remote = new Remote({
      servers: [ 'wss://s-west.ripple.com:443' ]
    });
    assert(Array.isArray(remote._servers));
    assert(remote._servers[0] instanceof Server);
    assert.strictEqual(remote._servers[0]._url, 'wss://s-west.ripple.com:443');
  });

  it('remote server initialization - url string - ws://', function() {
    var remote = new Remote({
      servers: [ 'ws://s-west.ripple.com:443' ]
    });
    assert(Array.isArray(remote._servers));
    assert(remote._servers[0] instanceof Server);
    assert.strictEqual(remote._servers[0]._url, 'ws://s-west.ripple.com:443');
  });

  it('remote server initialization - url string - invalid host', function() {
    assert.throws(
      function() {
      var remote = new Remote({
        servers: [ 'ws://+:443' ]
      });
    }, Error
    );
  });

  it('remote server initialization - url string - invalid port', function() {
    assert.throws(
      function() {
      var remote = new Remote({
        servers: [ 'ws://s-west.ripple.com:null' ]
      });
    }, Error
    );
  });

  it('remote server initialization - url string - port out of range', function() {
    assert.throws(
      function() {
      var remote = new Remote({
        servers: [ 'ws://s-west.ripple.com:65537:' ]
      });
    }, Error
    );
  });

  it('remote server initialization - set max_fee - number', function() {
    var remote = new Remote({
      max_fee: 10
    });
    assert.strictEqual(remote.max_fee, 10);

    remote = new Remote({
      max_fee: 1234567890
    });
    assert.strictEqual(remote.max_fee, 1234567890);
  });

  it('remote server initialization - set max_fee - string fails, should be number', function() {
    var remote = new Remote({
      max_fee: '1234567890'
    });
    assert.strictEqual(remote.max_fee, 1e6);
  });

  it('remote server initialization - max_fee - default', function() {
    var remote = new Remote({
      max_fee: void(0)
    });
    assert.strictEqual(remote.max_fee, 1e6);
    assert.strictEqual(remote.max_fee, 1000000);
    assert.strictEqual((new Remote()).max_fee, 1e6);
  });

  it('request ledger', function () {
    var request = new Remote(options).request_ledger(null, {}, callback);
    assert(request instanceof Request);
  });

  it('request server info', function () {
    var request = new Remote(options).request_server_info(null, {}, callback);
    assert(request instanceof Request);
  })

  it('request peers', function () {
    var request = new Remote(options).request_peers(null, {}, callback);
    assert(request instanceof Request);
  });

  it('request connect', function () {
    var request = new Remote(options).request_connect(null, {}, callback);
    assert(request instanceof Request);
  });

  it('request unl add', function () {
    var request = new Remote(options).request_unl_add(null, {}, callback);
    assert(request instanceof Request);
  });

  it('request unl list', function () {
    var request = new Remote(options).request_unl_list(null, {}, callback);
    assert(request instanceof Request);
  });

  it('request unl delete', function () {
    var request = new Remote(options).request_unl_delete(null, {}, callback);
    assert(request instanceof Request);
  });

  it('request account currencies -- with ledger index', function() {
    var request = new Remote(options).requestAccountCurrencies({account: ADDRESS});
    assert.strictEqual(request.message.command, 'account_currencies');
    assert.strictEqual(request.message.account, ADDRESS);
  });

  it('request account info -- with ledger index', function() {
    var request = new Remote(options).requestAccountInfo({account: ADDRESS, ledger: 9592219});
    assert.strictEqual(request.message.command, 'account_info');
    assert.strictEqual(request.message.account, ADDRESS);
    assert.strictEqual(request.message.ledger_index, 9592219);
  });
  it('request account info -- with ledger hash', function() {
    var request = new Remote(options).requestAccountInfo({account: ADDRESS, ledger: LEDGER_HASH});
    assert.strictEqual(request.message.command, 'account_info');
    assert.strictEqual(request.message.account, ADDRESS);
    assert.strictEqual(request.message.ledger_hash, LEDGER_HASH);
  });
  it('request account info -- with ledger identifier', function() {
    var request = new Remote(options).requestAccountInfo({account: ADDRESS, ledger: 'validated'});
    assert.strictEqual(request.message.command, 'account_info');
    assert.strictEqual(request.message.account, ADDRESS);
    assert.strictEqual(request.message.ledger_index, 'validated');
  });

  it('request account balance -- with ledger index', function() {
    var request = new Remote(options).requestAccountBalance(ADDRESS, 9592219);
    assert.strictEqual(request.message.command, 'ledger_entry');
    assert.strictEqual(request.message.account_root, ADDRESS);
    assert.strictEqual(request.message.ledger_index, 9592219);
  });
  it('request account balance -- with ledger hash', function() {
    var request = new Remote(options).requestAccountBalance(ADDRESS, LEDGER_HASH);
    assert.strictEqual(request.message.command, 'ledger_entry');
    assert.strictEqual(request.message.account_root, ADDRESS);
    assert.strictEqual(request.message.ledger_hash, LEDGER_HASH);
  });
  it('request account balance -- with ledger identifier', function() {
    var request = new Remote(options).requestAccountBalance(ADDRESS, 'validated');
    assert.strictEqual(request.message.command, 'ledger_entry');
    assert.strictEqual(request.message.account_root, ADDRESS);
    assert.strictEqual(request.message.ledger_index, 'validated');
  });
  it('request account balance -- with ledger identifier', function() {
    var request = new Remote(options).requestAccountBalance(ADDRESS, 'validated');
    assert.strictEqual(request.message.command, 'ledger_entry');
    assert.strictEqual(request.message.account_root, ADDRESS);
    assert.strictEqual(request.message.ledger_index, 'validated');
  });
  it('request account transactions', function() {
    var options = {
      account: ADDRESS,
      ledger_index_min: -1,
      ledger_index_max: -1
    };
    var request = new Remote(options).requestAccountTx(options);
    assert.strictEqual(request.message.command, 'account_tx');
    assert.strictEqual(request.message.ledger_index_min, -1);
    assert.strictEqual(request.message.ledger_index_max, -1);
    assert.strictEqual(request.message.binary, true);
    assert.strictEqual(options.parseBinary, true);
  });
  it('request account transactions -- without binary', function() {
    var options = {
      account: ADDRESS,
      binary: false,
      ledger_index_min: -1,
      ledger_index_max: -1
    };
    var request = new Remote(options).requestAccountTx(options);
    assert.strictEqual(request.message.command, 'account_tx');
    assert.strictEqual(request.message.ledger_index_min, -1);
    assert.strictEqual(request.message.ledger_index_max, -1);
    assert.strictEqual(request.message.binary, false);
    assert.strictEqual(options.parseBinary, void(0));
  });

  it('pagingAccountRequest', function() {
    var request = Remote.accountRequest('account_lines', {account: ADDRESS});
    assert.deepEqual(request.message, {
      command: 'account_lines',
      id: undefined,
      account: ADDRESS
    });
  });

  it('pagingAccountRequest - limit', function() {
    var request = Remote.accountRequest('account_lines', {account: ADDRESS, limit: 100});
    assert.deepEqual(request.message, {
      command: 'account_lines',
      id: undefined,
      account: ADDRESS,
      limit: 100
    });
  });

  it('pagingAccountRequest - limit, marker', function() {
    var request = Remote.accountRequest('account_lines', {account: ADDRESS, limit: 100, marker: PAGING_MARKER, ledger: 9592219});
    assert.deepEqual(request.message, {
      command: 'account_lines',
      id: undefined,
      account: ADDRESS,
      limit: 100,
      marker: PAGING_MARKER,
      ledger_index: 9592219
    });

    assert(!request.requested);
  });

  it('accountRequest - limit min', function() {
    assert.strictEqual(Remote.accountRequest('account_lines', {account: ADDRESS, limit: 0}).message.limit, 0);
    assert.strictEqual(Remote.accountRequest('account_lines', {account: ADDRESS, limit: -1}).message.limit, 0);
    assert.strictEqual(Remote.accountRequest('account_lines', {account: ADDRESS, limit: -1e9}).message.limit, 0);
    assert.strictEqual(Remote.accountRequest('account_lines', {account: ADDRESS, limit: -1e24}).message.limit, 0);
  });

  it('accountRequest - limit max', function() {
    assert.strictEqual(Remote.accountRequest('account_lines', {account: ADDRESS, limit: 1e9}).message.limit, 1e9);
    assert.strictEqual(Remote.accountRequest('account_lines', {account: ADDRESS, limit: 1e9+1}).message.limit, 1e9);
    assert.strictEqual(Remote.accountRequest('account_lines', {account: ADDRESS, limit: 1e10}).message.limit, 1e9);
    assert.strictEqual(Remote.accountRequest('account_lines', {account: ADDRESS, limit: 1e24}).message.limit, 1e9);
  });

  it('accountRequest - a valid ledger is required when using a marker', function() {
    assert.throws(function() {
      Remote.accountRequest('account_lines', {account: ADDRESS, marker: PAGING_MARKER})
    },'A ledger_index or ledger_hash must be provided when using a marker');

    assert.throws(function() {
      Remote.accountRequest('account_lines', {account: ADDRESS, marker: PAGING_MARKER, ledger:'validated'})
    },'A ledger_index or ledger_hash must be provided when using a marker');

    assert.throws(function() {
      Remote.accountRequest('account_lines', {account: ADDRESS, marker: PAGING_MARKER, ledger:NaN})
    },'A ledger_index or ledger_hash must be provided when using a marker');

    assert.throws(function() {
      Remote.accountRequest('account_lines', {account: ADDRESS, marker: PAGING_MARKER, ledger:LEDGER_HASH.substr(0,63)})
    },'A ledger_index or ledger_hash must be provided when using a marker');

    assert.throws(function() {
      Remote.accountRequest('account_lines', {account: ADDRESS, marker: PAGING_MARKER, ledger:LEDGER_HASH+'F'})
    },'A ledger_index or ledger_hash must be provided when using a marker');
  });

  it('requestAccountLines, account and callback', function() {
    var callback = function() {};
    var remote = new Remote({
      servers: [ { host: 's-west.ripple.com', port: 443, secure: true } ]
    });
    var request = remote.requestAccountLines(
      {account: ADDRESS},
      callback
    );

    assert.deepEqual(request.message, {
      command: 'account_lines',
      id: undefined,
      account: ADDRESS
    });

    assert(request.requested);
  });

  it('requestAccountLines, ledger, peer', function() {
    var callback = function() {};
    var remote = new Remote({
      servers: [ { host: 's-west.ripple.com', port: 443, secure: true } ]
    });
    var request = remote.requestAccountLines(
      {
      account: ADDRESS,
      ledger: LEDGER_HASH,
      peer: PEER_ADDRESS
    },
    callback
    );

    assert.deepEqual(request.message, {
      command: 'account_lines',
      id: undefined,
      account: ADDRESS,
      ledger_hash: LEDGER_HASH,
      peer: PEER_ADDRESS
    });

    assert(request.requested);
  });

  it('requestAccountLines, ledger, peer, limit and marker', function() {
    var callback = function() {};
    var remote = new Remote({
      servers: [ { host: 's-west.ripple.com', port: 443, secure: true } ]
    });
    var request = remote.requestAccountLines(
      {
      account: ADDRESS,
      ledger: LEDGER_INDEX,
      peer: PEER_ADDRESS,
      limit: 200,
      marker: PAGING_MARKER
    },
    callback
    );

    assert.deepEqual(request.message, {
      command: 'account_lines',
      id: undefined,
      account: ADDRESS,
      ledger_index: LEDGER_INDEX,
      peer: PEER_ADDRESS,
      limit: 200,
      marker: PAGING_MARKER
    });

    assert(request.requested);
  });

  it('requestAccountOffers, ledger, peer, limit and marker', function() {
    var callback = function() {};
    var remote = new Remote({
      servers: [ { host: 's-west.ripple.com', port: 443, secure: true } ]
    });
    var request = remote.requestAccountOffers(
      {
      account: ADDRESS,
      ledger: LEDGER_HASH,
      peer: PEER_ADDRESS,
      limit: 32,
      marker: PAGING_MARKER
    },
    callback
    );

    assert.deepEqual(request.message, {
      command: 'account_offers',
      id: undefined,
      account: ADDRESS,
      ledger_hash: LEDGER_HASH,
      peer: PEER_ADDRESS,
      limit: 32,
      marker: PAGING_MARKER
    });

    assert(request.requested);
  });
});
