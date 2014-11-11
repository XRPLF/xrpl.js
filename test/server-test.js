var assert = require('assert');
var ws = require('ws');
var utils = require('./testutils');
var Remote  = utils.load_module('remote').Remote;
var Server = utils.load_module('server').Server;
var Request = utils.load_module('request').Request;
var Transaction = utils.load_module('transaction').Transaction;

describe('Server', function() {
  it('Server constructor - invalid options', function() {
    assert.throws(function() {
      var server = new Server(new Remote());
    });
  });

  it('Message listener', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');

    server._handleMessage = function(message) {
      assert.strictEqual(typeof message, 'string');
      assert.deepEqual(JSON.parse(message).result, {});
      done();
    };

    server.emit('message', JSON.stringify({result: {}}));
  });

  it('Subscribe response listener', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');

    server._handleResponseSubscribe = function(message) {
      assert.strictEqual(typeof message, 'string');
      assert.deepEqual(JSON.parse(message).result, {});
      done();
    };

    server.emit('response_subscribe', JSON.stringify({result: {}}));
  });

  it('Activity listener', function(done) {
    // Activity listener should be enabled
    var server = new Server(new Remote(), 'wss://localhost:5006');

    server.emit('ledger_closed');

    var interval = setInterval(function(){}, Infinity);

    assert.deepEqual(server._activityInterval.__proto__, interval.__proto__);

    clearInterval(interval);

    done();
  });

  it('Reconnect activity listener', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');

    server.emit('ledger_closed');

    var interval = setInterval(function(){}, Infinity);

    assert.deepEqual(server._activityInterval.__proto__, interval.__proto__);

    server.once('disconnect', function() {
      // Interval should clear
      assert.deepEqual(server._activityInterval.__proto__, interval.__proto__);
      assert.strictEqual(server._activityInterval._onTimeout, null)

      server.once('ledger_closed', function() {
        // Interval should be reset
        assert.deepEqual(server._activityInterval.__proto__, interval.__proto__);
        assert.strictEqual(typeof server._activityInterval._onTimeout, 'function');

        done();
      });

      server.emit('ledger_closed');
    });

    server.emit('disconnect');
  });

  it('Update server score ledger close listener', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');

    var ledger = {
      type: 'ledgerClosed',
      fee_base: 10,
      fee_ref: 10,
      ledger_hash: 'D29E1F2A2617A88E9DAA14F468B169E6875092ECA0B3B1FA2BE1BC5524DE7CB2',
      ledger_index: 7035609,
      ledger_time: 455327690,
      reserve_base: 20000000,
      reserve_inc: 5000000,
      txn_count: 1,
      validated_ledgers: '32570-7035609'
    };

    server._updateScore = function(type, data) {
      assert.strictEqual(type, 'ledgerclose');
      assert.deepEqual(data, ledger);
      done();
    };

    server._remote.emit('ledger_closed', ledger);
  });

  it('Update server score ping listener', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');

    var ping = {
      time: 500
    };

    server._updateScore = function(type, data) {
      assert.strictEqual(type, 'response');
      assert.deepEqual(data, ping);
      done();
    };

    server.emit('response_ping', {}, ping);
  });

  it('Update server score load listener', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');

    var load = {
      fee_base: 10,
      fee_ref: 10
    };

    server._updateScore = function(type, data) {
      assert.strictEqual(type, 'loadchange');
      assert.deepEqual(data, load);
      done();
    };

    server.emit('load_changed', load);
  });

  it('Websocket constructor', function() {
    assert.strictEqual(Server.websocketConstructor(), require('ws'));
  });

  it('Set state online', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');

    server._state = 'offline';

    server.once('connect', function() {
      assert(server._connected);
      done();
    });

    server._setState('online');
  });

  it('Set state offline', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');

    server._state = 'online';

    server.once('disconnect', function() {
      assert(!server._connected);
      done();
    });

    server._setState('offline');
  });

  it('Set state same state', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');

    server._state = 'online';

    server.once('state', function(state) {
      assert(!server._connected);
      assert.strictEqual(state, 'offline');
      done();
    });

    server._setState('online');
    server._setState('offline');
  });

  it('Check activity - inactive', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');
    server._connected = true;

    server.reconnect = function() {
      done();
    };

    server._lastLedgerClose = Date.now() - 1000 * 30;
    server._checkActivity();
  });

  it('Check activity - unconnected', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');
    server._connected = false;

    server.reconnect = function() {
      assert(false, 'Should not reconnect');
    };

    server._lastLedgerClose = Date.now() - 1000 * 30;
    server._checkActivity();
    setImmediate(function() {
      done();
    });
  });

  it('Check activity - uninitialized', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');
    server._connected = false;

    server.reconnect = function() {
      assert(false, 'Should not reconnect');
    };

    //server._lastLedgerClose = Date.now() - 1000 * 30;
    server._checkActivity();
    setImmediate(function() {
      done();
    });
  });

  it('Check activity - sufficient ledger close', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');
    server._connected = false;

    server.reconnect = function() {
      assert(false, 'Should not reconnect');
    };

    server._lastLedgerClose = Date.now() - 1000 * 20;
    server._checkActivity();
    setImmediate(function() {
      done();
    });
  });

  it('Update score - response', function() {
    var server = new Server(new Remote(), 'wss://localhost:5006');
    server._connected = true;

    assert.deepEqual(server._scoreWeights, {
      ledgerclose: 5,
      response: 1
    });

    assert.strictEqual(server._score, 0);

    server._updateScore('response', { time: Date.now() - 1000 });

    // 1000ms second ping / 200ms * weight of 1
    assert.strictEqual(server._score, 5);
  });

  it('Update score - ledger', function() {
    var server = new Server(new Remote(), 'wss://localhost:5006');
    server._connected = true;
    server._lastLedgerIndex = 1;

    assert.deepEqual(server._scoreWeights, {
      ledgerclose: 5,
      response: 1
    });

    assert.strictEqual(server._score, 0);

    server._updateScore('ledgerclose', { ledger_index: 5 });

    // Four ledgers behind the leading ledger * weight of 5
    assert.strictEqual(server._score, 20);
  });

  it('Update score - load', function() {
    var server = new Server(new Remote(), 'wss://localhost:5006');
    server._connected = true;
    server._fee_cushion = 1;

    assert.deepEqual(server._scoreWeights, {
      ledgerclose: 5,
      response: 1
    });

    assert.strictEqual(server._fee, 10);

    server.emit('message', {
      type: 'serverStatus',
      load_base: 256 * 1,
      load_factor: 256 * 10,
      server_status: 'full'
    });

    //server._updateScore('loadchange', { });

    assert.strictEqual(server._fee, 100);
  });

  it('Update score - reaching reconnect threshold', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');
    server._lastLedgerIndex = 1;
    server._connected = true;

    server.reconnect = function() {
      done();
    };

    assert.deepEqual(server._scoreWeights, {
      ledgerclose: 5,
      response: 1
    });

    assert.strictEqual(server._score, 0);

    server._updateScore('ledgerclose', { ledger_index: 250 });

    // Four ledgers behind the leading ledger * weight of 5
    assert.strictEqual(server._score, 1245);
  });

  it('Get remote address', function() {
    var server = new Server(new Remote(), 'wss://localhost:5006');
    server._connected = true;
    server._ws = {
      _socket: {
        remoteAddress: '127.0.0.1'
      }
    };
    assert.strictEqual(server._remoteAddress(), '127.0.0.1');
  });

  it('Disconnect', function(done) {
    var server = new Server(new Remote(), 'wss://localhost:5006');
    server._connected = true;

    server._ws = {
      close: function() {
        assert(!server._shouldConnect);
        assert.strictEqual(server._state, 'offline');
        done();
      }
    };

    server.disconnect();
  });

  it('Connect', function(done) {
    var wss = new ws.Server({ port: 5748  });

    wss.once('connection', function(ws) {
      ws.once('message', function(message) {
        var m = JSON.parse(message);

        assert.deepEqual(m, {
          command: 'subscribe',
          id: 0,
          streams: [ 'ledger', 'server' ]
        });

        ws.send(JSON.stringify({
          id: 0,
          status: 'success',
          type: 'response',
          result: {
            fee_base: 10,
            fee_ref: 10,
            ledger_hash: '1838539EE12463C36F2C53B079D807C697E3D93A1936B717E565A4A912E11776',
            ledger_index: 7053695,
            ledger_time: 455414390,
            load_base: 256,
            load_factor: 256,
            random: 'E56C9154D9BE94D49C581179356C2E084E16D18D74E8B09093F2D61207625E6A',
            reserve_base: 20000000,
            reserve_inc: 5000000,
            server_status: 'full',
            validated_ledgers: '32570-7053695'
          }
        }));

        wss.close();
      });
    });

    var server = new Server(new Remote(), 'ws://localhost:5748');

    server.once('connect', function() {
      server.once('disconnect', function() {
        done();
      });
      server.disconnect();
    });

    server.connect();
  });

  it('Connect - already connected', function(done) {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._connected = true;

    server.once('connect', function() {
      assert(false, 'Should not connect');
    });

    server.connect();

    setImmediate(function() {
      done();
    });
  });

  it.skip('Connect - prior WebSocket connection exists', function(done) {
    var wss = new ws.Server({ port: 5748  });

    wss.once('connection', function(ws) {
      ws.once('message', function(message) {
        var m = JSON.parse(message);

        assert.deepEqual(m, {
          command: 'subscribe',
          id: 0,
          streams: [ 'ledger', 'server' ]
        });

        ws.send(JSON.stringify({
          id: 0,
          status: 'success',
          type: 'response',
          result: {
            fee_base: 10,
            fee_ref: 10,
            ledger_hash: '1838539EE12463C36F2C53B079D807C697E3D93A1936B717E565A4A912E11776',
            ledger_index: 7053695,
            ledger_time: 455414390,
            load_base: 256,
            load_factor: 256,
            random: 'E56C9154D9BE94D49C581179356C2E084E16D18D74E8B09093F2D61207625E6A',
            reserve_base: 20000000,
            reserve_inc: 5000000,
            server_status: 'full',
            validated_ledgers: '32570-7053695'
          }
        }));

        wss.close();
      });
    });

    var server = new Server(new Remote(), 'ws://localhost:5748');

    server.once('connect', function() {
      server.once('disconnect', function() {
        done();
      });
      server.disconnect();
    });

    server.connect();
    server.connect();
  });

  it('Connect - no WebSocket constructor', function() {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._connected = false;

    var websocketConstructor = Server.websocketConstructor;

    Server.websocketConstructor = function() {
      return void(0);
    };

    assert.throws(function() {
      server.connect();
    }, Error);

    Server.websocketConstructor = websocketConstructor;
  });

  it('Connect - partial history disabled', function(done) {
    var wss = new ws.Server({ port: 5748  });

    wss.once('connection', function(ws) {
      ws.once('message', function(message) {
        var m = JSON.parse(message);

        assert.deepEqual(m, {
          command: 'subscribe',
          id: 0,
          streams: [ 'ledger', 'server' ]
        });

        ws.send(JSON.stringify({
          id: 0,
          status: 'success',
          type: 'response',
          result: {
            fee_base: 10,
            fee_ref: 10,
            ledger_hash: '1838539EE12463C36F2C53B079D807C697E3D93A1936B717E565A4A912E11776',
            ledger_index: 7053695,
            ledger_time: 455414390,
            load_base: 256,
            load_factor: 256,
            random: 'E56C9154D9BE94D49C581179356C2E084E16D18D74E8B09093F2D61207625E6A',
            reserve_base: 20000000,
            reserve_inc: 5000000,
            server_status: 'syncing',
            validated_ledgers: '3175520-3176615'
          }
        }));

        wss.close();
      });
    });

    var server = new Server(new Remote({ allow_partial_history: false }), 'ws://localhost:5748');

    server.reconnect = function() {
      setImmediate(function() {
        done();
      });
    };

    server.once('connect', function() {
      assert(false, 'Should not connect');
    });

    server.connect();
  });

  it('Connect - syncing state', function(done) {
    // Test that fee and load defaults are not overwritten by
    // undefined properties on server subscribe response
    var wss = new ws.Server({ port: 5748  });

    wss.once('connection', function(ws) {
      ws.once('message', function(message) {
        var m = JSON.parse(message);

        assert.deepEqual(m, {
          command: 'subscribe',
          id: 0,
          streams: [ 'ledger', 'server' ]
        });

        ws.send(JSON.stringify({
          id: 0,
          status: 'success',
          type: 'response',
          result: {
            load_base: 256,
            load_factor: 256,
            server_status: 'syncing'
          }
        }));

        wss.close();
      });
    });

    var server = new Server(new Remote(), 'ws://localhost:5748');

    server.once('connect', function() {
      assert(server.isConnected());
      assert.strictEqual(server._load_base, 256);
      assert.strictEqual(server._load_factor, 256);
      assert.strictEqual(server._fee_base, 10);
      assert.strictEqual(server._fee_ref, 10);
      done();
    });

    server.connect();
  });


  it('Reconnect', function(done) {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._connected = true;
    server._shouldConnect = true;
    server._ws = { };

    var disconnected = false;

    server.disconnect = function() {
      disconnected = true;
      server.emit('disconnect');
    };

    server.connect = function() {
      assert(disconnected);
      done();
    };

    server.reconnect();
  });

  it('Retry connect', function(done) {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._connected = false;
    server._shouldConnect = true;

    server.connect = function() {
      done();
    };

    server._retryConnect();

    var timeout = setTimeout(function(){}, Infinity);

    assert.deepEqual(server._retryTimer.__proto__, timeout.__proto__);

    clearTimeout(timeout);
  });

  it('Handle close', function() {
    var server = new Server(new Remote(), 'ws://localhost:5748');

    server._ws = { };

    server._handleClose();

    var noOp = (function noOp(){}).toString();

    var coverageRE = /__cov_.+;/;

    assert.strictEqual(server._ws.onopen.toString().replace(coverageRE, ''), noOp);
    assert.strictEqual(server._ws.onclose.toString().replace(coverageRE, ''), noOp);
    assert.strictEqual(server._ws.onmessage.toString().replace(coverageRE, ''), noOp);
    assert.strictEqual(server._ws.onerror.toString().replace(coverageRE, ''), noOp);
    assert.strictEqual(server._state, 'offline');
  });

  it('Handle error', function(done) {
    var wss = new ws.Server({ port: 5748  });

    wss.once('connection', function(ws) {
      ws.once('message', function(message) {
        var m = JSON.parse(message);

        assert.deepEqual(m, {
          command: 'subscribe',
          id: 0,
          streams: [ 'ledger', 'server' ]
        });

        ws.send(JSON.stringify({
          id: 0,
          status: 'success',
          type: 'response',
          result: {
            fee_base: 10,
            fee_ref: 10,
            ledger_hash: '1838539EE12463C36F2C53B079D807C697E3D93A1936B717E565A4A912E11776',
            ledger_index: 7053695,
            ledger_time: 455414390,
            load_base: 256,
            load_factor: 256,
            random: 'E56C9154D9BE94D49C581179356C2E084E16D18D74E8B09093F2D61207625E6A',
            reserve_base: 20000000,
            reserve_inc: 5000000,
            server_status: 'full',
            validated_ledgers: '32570-7053695'
          }
        }));
      });
    });

    var server = new Server(new Remote(), 'ws://localhost:5748');

    server.once('disconnect', function() {
      done();
    });

    server.once('connect', function() {
      server._retryConnect = function(){
        wss.close();
      };
      server._ws.emit('error', new Error());
    });

    server.connect();
  });

  it('Handle message - ledgerClosed', function(done) {
    var server = new Server(new Remote(), 'ws://localhost:5748');

    var ledger = {
      type: 'ledgerClosed',
      ledger_index: 1
    };

    server.once('ledger_closed', function(message) {
      assert.strictEqual(server._lastLedgerIndex, ledger.ledger_index);
      done();
    });

    server.emit('message', ledger);
  });

  it('Handle message - serverStatus', function(done) {
    var remote = new Remote();
    var server = new Server(remote, 'ws://localhost:5748');
    var events = 3;
    var receivedEvents = 0;

    var status = {
      type: 'serverStatus',
      load_base: 256,
      load_factor: 256 * 2
    };

    server.once('load', function(message) {
      assert.deepEqual(message, status);
      if (++receivedEvents == events) {
        done();
      }
    });

    server.once('load_changed', function(message) {
      assert.deepEqual(message, status);
      if (++receivedEvents == events) {
        done();
      }
    });

    remote.once('load_changed', function(message) {
      assert.deepEqual(message, status);
      if (++receivedEvents == events) {
        done();
      }
    });

    server.emit('message', status);
  });

  it('Handle message - serverStatus - no load', function(done) {
    var remote = new Remote();
    var server = new Server(remote, 'ws://localhost:5748');
    var events = 3;
    var receivedEvents = 0;

    var status = {
      type: 'serverStatus'
    };

    server.once('load', function(message) {
      assert.deepEqual(message, status);
    });

    server.once('load_changed', function(message) {
      assert(false, 'Non-load status should not trigger events');
    });

    remote.once('load_changed', function(message) {
      assert(false, 'Non-load status should not trigger events');
    });

    server.emit('message', status);

    setImmediate(function() {
      done();
    });
  });

  it('Handle message - response - success', function(done) {
    var remote = new Remote();
    var server = new Server(remote, 'ws://localhost:5748');
    var request = new Request(remote, 'server_info');
    var id = 1;

    assert(request instanceof process.EventEmitter);

    server._requests[id] = request;

    var response = {
      id: id,
      type: 'response',
      status: 'success',
      result: {
        info: {
          build_version: "0.25.2-rc1",
          complete_ledgers: "32570-7623483",
          hostid: "MAC",
          io_latency_ms: 1,
          last_close: {
            converge_time_s: 2.052,
            proposers: 5
          },
          load_factor: 1,
          peers: 50,
          pubkey_node: "n94pSqypSfddzAVj9qoezHyUoetsrMnwgNuBqRJ3WHvM8aMMf7rW",
          server_state: "full",
          validated_ledger: {
            age: 5,
            base_fee_xrp: 0.00001,
            hash: "AB575193C623179078BE7CC42965FD4262EE8611D1CE7F839CEEBFFEF4B653B6",
            reserve_base_xrp: 20,
            reserve_inc_xrp: 5,
            seq: 7623483
          },
          validation_quorum: 3
        }
      }
    };

    var receivedEvents = 0;
    var emitters = 3;

    request.once('success', function(message) {
      assert.deepEqual(message, response.result);
      if (++receivedEvents === emitters) {
        done();
      }
    });

    server.once('response_server_info', function(message) {
      assert.deepEqual(message, response.result);
      if (++receivedEvents === emitters) {
        done();
      }
    });

    remote.once('response_server_info', function(message) {
      assert.deepEqual(message, response.result);
      if (++receivedEvents === emitters) {
        done();
      }
    });

    server.emit('message', response);
  });

  it('Handle message - response - error', function(done) {
    var remote = new Remote();
    var server = new Server(remote, 'ws://localhost:5748');
    var request = new Request(remote, 'server_info');
    var id = 1;

    assert(request instanceof process.EventEmitter);

    server._requests[id] = request;

    var response = {
      id: id,
      type: 'response',
      status: 'error',
      error: {
        test: 'property'
      }
    };

    var receivedEvents = 0;

    request.once('error', function(message) {
      assert.deepEqual(message, {
        error: 'remoteError',
        error_message: 'Remote reported an error.',
        remote: response
      });
      done();
    });

    server.emit('message', response);
  });

  it('Handle message - response - no request', function(done) {
    var remote = new Remote();
    var server = new Server(remote, 'ws://localhost:5748');

    var response = {
      id: 1,
      type: 'response',
      status: 'success',
      result: { }
    };

    Object.defineProperty(response, 'status', {
      get: function() {
        assert(false, 'Response status should not be checked');
      }
    });

    server.emit('message', response);

    setImmediate(function() {
      done();
    });
  });

  it('Handle message - path_find', function(done) {
    var server = new Server(new Remote(), 'ws://localhost:5748');

    server._handlePathFind = function() {
      done();
    };

    server.emit('message', { type: 'path_find' });
  });

  it('Handle message - invalid message', function(done) {
    var server = new Server(new Remote(), 'ws://localhost:5748');

    server.once('unexpected', function() {
      done();
    });

    server.emit('message', { butt: 'path_find' });
  });

  it('Send message', function(done) {
    var server = new Server(new Remote(), 'ws://localhost:5748');

    var request = {
      id: 1,
      message: {
        command: 'server_info'
      }
    };

    server._ws = {
      send: function(message) {
        assert.deepEqual(JSON.parse(message), request);
        done();
      }
    };

    server._sendMessage(request);
  });

  it('Request', function(done) {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._connected = true;

    server._ws = { };

    var request = {
      message: {
        command: 'server_info'
      }
    };

    server._sendMessage = function(message) {
      done();
    };

    server._request(request);
  });

  it('Request - delayed connect', function(done) {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._connected = false;

    server._ws = { };

    var request = {
      message: {
        command: 'server_info'
      }
    };

    server._request(request);

    setImmediate(function() {
      server._sendMessage = function(message) {
        done();
      };

      server.emit('connect');
    });
  });

  it('Request - no WebSocket', function(done) {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._connected = true;

    server._ws = void(0);

    var request = {
      message: {
        command: 'server_info'
      }
    };

    server._sendMessage = function(message) {
      assert(false, 'Should not send message if WebSocket does not exist');
    };

    server._request(request);

    setImmediate(function() {
      done();
    });
  });

  it('Check connectivity', function() {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._connected = false;
    server._ws = { readyState: 1 };

    assert(!server._isConnected());

    server._connected = true;

    assert(server._isConnected());
  });

  it('Compute fee - fee units', function() {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    var transaction = new Transaction();
    assert.strictEqual(server._computeFee(10), '12');
  });

  it('Compute fee - bad arg', function() {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    var transaction = new Transaction();
    assert.throws(function() {
      server._computeFee('asdf');
    });
  });

  it('Compute fee - increased load', function() {
    var server = new Server(new Remote(), 'ws://localhost:5748');

    server._load_base = 256;
    server._load_factor = 256 * 4;

    var transaction = new Transaction();
    assert.strictEqual(server._computeFee(10), '48');
  });

  it('Compute reserve', function() {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._reserve_base = 20000000;
    server._reserve_inc =  5000000;
    assert.strictEqual(server._reserve().to_json(), '20000000');
  });

  it('Cache hostid', function(done) {
    var wss = new ws.Server({ port: 5748  });

    wss.once('connection', function(ws) {
      function sendServerInfo(message) {
        ws.send(JSON.stringify({
          id: message.id,
          status: 'success',
          type: 'response',
          result: {
            info: {
              build_version: "0.25.2-rc1",
              complete_ledgers: "32570-7623483",
              hostid: "MAC",
              io_latency_ms: 1,
              last_close: {
                converge_time_s: 2.052,
                proposers: 5
              },
              load_factor: 1,
              peers: 50,
              pubkey_node: "n94pSqypSfddzAVj9qoezHyUoetsrMnwgNuBqRJ3WHvM8aMMf7rW",
              server_state: "full",
              validated_ledger: {
                age: 5,
                base_fee_xrp: 0.00001,
                hash: "AB575193C623179078BE7CC42965FD4262EE8611D1CE7F839CEEBFFEF4B653B6",
                reserve_base_xrp: 20,
                reserve_inc_xrp: 5,
                seq: 7623483
              },
              validation_quorum: 3
            }
          }
        }));
      };

      function sendSubscribe(message) {
        ws.send(JSON.stringify({
          id: message.id,
          status: 'success',
          type: 'response',
          result: {
            fee_base: 10,
            fee_ref: 10,
            ledger_hash: '1838539EE12463C36F2C53B079D807C697E3D93A1936B717E565A4A912E11776',
            ledger_index: 7053695,
            ledger_time: 455414390,
            load_base: 256,
            load_factor: 256,
            random: 'E56C9154D9BE94D49C581179356C2E084E16D18D74E8B09093F2D61207625E6A',
            reserve_base: 20000000,
            reserve_inc: 5000000,
            server_status: 'full',
            validated_ledgers: '32570-7053695'
          }
        }));
      };

      ws.on('message', function(message) {
        var m = JSON.parse(message);

        switch (m.command) {
          case 'subscribe':
            assert.strictEqual(m.command, 'subscribe');
            assert.deepEqual(m.streams, [ 'ledger', 'server' ]);
            sendSubscribe(m);
            break;
          case 'server_info':
            assert.strictEqual(m.command, 'server_info');
            sendServerInfo(m);
            wss.close();
            break;
        }
      });
    });

    var server = new Server(new Remote(), 'ws://localhost:5748');

    server.once('connect', function() {
      var receivedSubscribe = false;

      server.once('response_server_info', function() {
        receivedSubscribe = true;
      });

      server.once('disconnect', function() {
        assert(receivedSubscribe);
        assert.strictEqual(server.getServerID(), 'ws://localhost:5748 (n94pSqypSfddzAVj9qoezHyUoetsrMnwgNuBqRJ3WHvM8aMMf7rW)');
        done();
      });
    });

    server.connect();
  });
});
