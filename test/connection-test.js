/* eslint-disable max-nested-callbacks */
'use strict';

const _ = require('lodash');
const net = require('net');
const assert = require('assert-diff');
const setupAPI = require('./setup-api');
const RippleAPI = require('ripple-api').RippleAPI;
const utils = RippleAPI._PRIVATE.ledgerUtils;


function unused() {
}

function createServer() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('listening', function() {
      resolve(server);
    });
    server.on('error', function(error) {
      reject(error);
    });
    server.listen(0, '0.0.0.0');
  });
}

describe('Connection', function() {
  beforeEach(setupAPI.setup);
  afterEach(setupAPI.teardown);

  it('default options', function() {
    const connection = new utils.common.Connection('url');
    assert.strictEqual(connection._url, 'url');
    assert(_.isUndefined(connection._proxyURL));
    assert(_.isUndefined(connection._authorization));
  });

  it('trace', function() {
    const connection = new utils.common.Connection('url', {trace: true});
    const message1 = '{"type": "transaction"}';
    const message2 = '{"type": "path_find"}';
    const messages = [];
    connection._console = {
      log: function(message) {
        messages.push(message);
      }
    };
    connection._onMessage(message1);
    connection._send(message2);

    assert.deepEqual(messages, [message1, message2]);
  });

  it('with proxy', function(done) {
    createServer().then((server) => {
      const port = server.address().port;
      const expect = 'CONNECT localhost';
      server.on('connection', (socket) => {
        socket.on('data', (data) => {
          const got = data.toString('ascii', 0, expect.length);
          assert.strictEqual(got, expect);
          server.close();
          done();
        });
      });

      const options = {
        proxy: 'ws://localhost:' + port,
        authorization: 'authorization',
        trustedCertificates: ['path/to/pem']
      };
      const connection =
        new utils.common.Connection(this.api.connection._url, options);
      connection.connect().catch(done);
      connection.connect().catch(done);
    }, done);
  });

  it('Multiply disconnect calls', function() {
    this.api.disconnect();
    return this.api.disconnect();
  });

  it('reconnect', function() {
    return this.api.connection.reconnect();
  });

  it('NotConnectedError', function() {
    const connection = new utils.common.Connection('url');
    return connection.getLedgerVersion().then(() => {
      assert(false, 'Should throw NotConnectedError');
    }).catch(error => {
      assert(error instanceof this.api.errors.NotConnectedError);
    });
  });

  it('DisconnectedError', function() {
    this.api.connection._send = function() {
      this._ws.close();
    };
    return this.api.getServerInfo().then(() => {
      assert(false, 'Should throw DisconnectedError');
    }).catch(error => {
      assert(error instanceof this.api.errors.DisconnectedError);
    });
  });

  it('TimeoutError', function() {
    this.api.connection._send = function() {
      return Promise.resolve({});
    };
    const request = {command: 'server_info'};
    return this.api.connection.request(request, 1).then(() => {
      assert(false, 'Should throw TimeoutError');
    }).catch(error => {
      assert(error instanceof this.api.errors.TimeoutError);
    });
  });

  it('DisconnectedError on send', function() {
    this.api.connection._ws.send = function(message, options, callback) {
      unused(message, options);
      callback({message: 'not connected'});
    };
    return this.api.getServerInfo().then(() => {
      assert(false, 'Should throw DisconnectedError');
    }).catch(error => {
      assert(error instanceof this.api.errors.DisconnectedError);
      assert.strictEqual(error.message, 'not connected');
    });
  });

  it('ResponseFormatError', function() {
    this.api.connection._send = function(message) {
      const parsed = JSON.parse(message);
      setTimeout(() => {
        this._ws.emit('message', JSON.stringify({
          id: parsed.id,
          type: 'response',
          status: 'unrecognized'
        }));
      }, 2);
      return new Promise(() => {});
    };
    return this.api.getServerInfo().then(() => {
      assert(false, 'Should throw ResponseFormatError');
    }).catch(error => {
      assert(error instanceof this.api.errors.ResponseFormatError);
    });
  });

  it('reconnect on unexpected close ', function(done) {
    this.api.connection.on('connected', () => {
      done();
    });

    setTimeout(() => {
      this.api.connection._ws.close();
    }, 1);
  });

  it('Multiply connect calls', function() {
    return this.api.connect().then(() => {
      return this.api.connect();
    });
  });

  it('hasLedgerVersion', function() {
    return this.api.connection.hasLedgerVersion(8819951).then((result) => {
      assert(result);
    });
  });

  it('Cannot connect because no server', function() {
    const connection = new utils.common.Connection();
    return connection.connect().then(() => {
      assert(false, 'Should throw ConnectionError');
    }).catch(error => {
      assert(error instanceof this.api.errors.ConnectionError);
    });
  });

  it('connect multiserver error', function() {
    const options = {
      servers: ['wss://server1.com', 'wss://server2.com']
    };
    assert.throws(function() {
      const api = new RippleAPI(options);
      unused(api);
    }, this.api.errors.RippleError);
  });

  it('connect throws error', function(done) {
    this.api.once('error', (type, info) => {
      assert.strictEqual(type, 'type');
      assert.strictEqual(info, 'info');
      done();
    });
    this.api.connection.emit('error', 'type', 'info');
  });

  it('emit stream messages', function(done) {
    let transactionCount = 0;
    let pathFindCount = 0;
    this.api.connection.on('transaction', () => {
      transactionCount++;
    });
    this.api.connection.on('path_find', () => {
      pathFindCount++;
    });
    this.api.connection.on('1', () => {
      assert.strictEqual(transactionCount, 1);
      assert.strictEqual(pathFindCount, 1);
      done();
    });

    this.api.connection._onMessage(JSON.stringify({
      type: 'transaction'
    }));
    this.api.connection._onMessage(JSON.stringify({
      type: 'path_find'
    }));
    this.api.connection._onMessage(JSON.stringify({
      type: 'response', id: 1
    }));
  });

  it('invalid message id', function(done) {
    this.api.on('error', (errorCode, errorMessage, message) => {
      assert.strictEqual(errorCode, 'badMessage');
      assert.strictEqual(errorMessage, 'valid id not found in response');
      assert.strictEqual(message,
        '{"type":"response","id":"must be integer"}');
      done();
    });
    this.api.connection._onMessage(JSON.stringify({
      type: 'response', id: 'must be integer'
    }));
  });

  it('propagate error message', function(done) {
    this.api.on('error', (errorCode, errorMessage, data) => {
      assert.strictEqual(errorCode, 'slowDown');
      assert.strictEqual(errorMessage, 'slow down');
      assert.deepEqual(data, {error: 'slowDown', error_message: 'slow down'});
      done();
    });
    this.api.connection._onMessage(JSON.stringify({
      error: 'slowDown', error_message: 'slow down'
    }));
  });

  it('unrecognized message type', function(done) {
    this.api.on('error', (errorCode, errorMessage, message) => {
      assert.strictEqual(errorCode, 'badMessage');
      assert.strictEqual(errorMessage, 'unrecognized message type: unknown');
      assert.strictEqual(message, '{"type":"unknown"}');
      done();
    });

    this.api.connection._onMessage(JSON.stringify({type: 'unknown'}));
  });
});
