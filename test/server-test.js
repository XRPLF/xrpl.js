var assert = require('assert');
var ws = require('ws');
var utils = require('./testutils');
var Remote  = utils.load_module('remote').Remote;
var Server = utils.load_module('server').Server;
var Request = utils.load_module('request').Request;
var Transaction = utils.load_module('transaction').Transaction;

describe('Server', function() {
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
      "type": "ledgerClosed",
      "fee_base": 10,
      "fee_ref": 10,
      "ledger_hash": "D29E1F2A2617A88E9DAA14F468B169E6875092ECA0B3B1FA2BE1BC5524DE7CB2",
      "ledger_index": 7035609,
      "ledger_time": 455327690,
      "reserve_base": 20000000,
      "reserve_inc": 5000000,
      "txn_count": 1,
      "validated_ledgers": "32570-7035609"
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
      "fee_base": 10,
      "fee_ref": 10
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

  it('Get remote address', function() {
    var server = new Server(new Remote(), 'wss://localhost:5006');
    server._connected = true;
    server._ws = {
      _socket: {
        remoteAddress: '127.0.0.1'
      }
    };
    assert.strictEqual(server.getRemoteAddress(), '127.0.0.1');
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
          "id": 0,
          "status": "success",
          "type": "response",
          "result": {
            "fee_base": 10,
            "fee_ref": 10,
            "ledger_hash": "1838539EE12463C36F2C53B079D807C697E3D93A1936B717E565A4A912E11776",
            "ledger_index": 7053695,
            "ledger_time": 455414390,
            "load_base": 256,
            "load_factor": 256,
            "random": "E56C9154D9BE94D49C581179356C2E084E16D18D74E8B09093F2D61207625E6A",
            "reserve_base": 20000000,
            "reserve_inc": 5000000,
            "server_status": "full",
            "validated_ledgers": "32570-7053695"
          }
        }));
      });
    });

    var server = new Server(new Remote(), 'ws://localhost:5748');

    server.once('connect', function() {
      done();
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

  it('Connect - prior WebSocket connection exists', function(done) {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._connected = false;

    server._ws = {
      close: function() {
        done();
      }
    };

    server.connect();
  });

  it('Connect - no WebSocket constructor', function() {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._connected = false;

    Server.websocketConstructor = function() {
      return void(0);
    };

    assert.throws(function() {
      server.connect();
    }, Error);
  });

  it('Reconnect', function() {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._connected = true;

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

    function noOp() {};

    assert.strictEqual(server._ws.onopen.toString(), noOp.toString());
    assert.strictEqual(server._ws.onclose.toString(), noOp.toString());
    assert.strictEqual(server._ws.onmessage.toString(), noOp.toString());
    assert.strictEqual(server._ws.onerror.toString(), noOp.toString());
    assert.strictEqual(server._state, 'offline');
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
        test: 'property'
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

  it('Check connectivity', function() {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    server._connected = false;
    server._ws = { readyState: 1 };

    assert(!server._isConnected());
    assert(!server._isConnected({ message: { command: 'ping' } }));
    assert(server._isConnected({ message: { command: 'subscribe' } }));

    server._connected = true;

    assert(server._isConnected());
  });

  it('Compute fee - transaction', function() {
    var server = new Server(new Remote(), 'ws://localhost:5748');
    var transaction = new Transaction();
    assert.strictEqual(server._computeFee(transaction), '12');
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
    assert.strictEqual(server._computeFee(transaction), '48');
  });
});
