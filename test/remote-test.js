var assert = require('assert');
var utils  = require('./testutils');

var Remote = utils.load_module('remote').Remote;
var Server = utils.load_module('server').Server;
var Request = utils.load_module('request').Request;

var options, spy, mock, stub, remote, callback, database, tx;

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
      },

    };
  })

  it('remote server initialization - url object', function() {
    var remote = new Remote({
      servers: [ { host: 's-west.ripple.com', port: 443, secure: true } ],
    });
    assert(Array.isArray(remote._servers));
    assert(remote._servers[0] instanceof Server);
    assert.strictEqual(remote._servers[0]._url, 'wss://s-west.ripple.com:443');
  })

  it('remote server initialization - url object - no secure property', function() {
    var remote = new Remote({
      servers: [ { host: 's-west.ripple.com', port: 443 } ]
    });
    assert(Array.isArray(remote._servers));
    assert(remote._servers[0] instanceof Server);
    assert.strictEqual(remote._servers[0]._url, 'wss://s-west.ripple.com:443');
  })

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
  })

  it('remote server initialization - url object - invalid host', function() {
    assert.throws(
      function() {
      var remote = new Remote({
        servers: [ { host: '+', port: 443, secure: true } ]
      });
    }, Error);
  })

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

  it('request constructors', function () {
    beforeEach(function () {
      callback = function () {}
      remote = new Remote(options);
    });

    it('requesting a ledger', function () {
      var request = remote.request_ledger(null, {}, callback);
      assert(request instanceof Request);
    });

    it('requesting server info', function () {
      var request = remote.request_server_info(null, {}, callback);
      assert(request instanceof Request);
    })

    it('requesting peers', function () {
      var request = remote.request_peers(null, {}, callback);
      assert(request instanceof Request);
    });

    it('requesting a connection', function () {
      var request = remote.request_connect(null, {}, callback);
      assert(request instanceof Request);
    });

    it('making a unique node list add request', function () {
      var request = remote.request_unl_add(null, {}, callback);
      assert(request instanceof Request);
    });

    it('making a unique node list request', function () {
      var request = remote.request_unl_list(null, {}, callback);
      assert(request instanceof Request);
    });

    it('making a unique node list delete request', function () {
      var request = remote.request_unl_delete(null, {}, callback);
      assert(request instanceof Request);
    });
  })

  it('create remote and get pending transactions', function() {
    before(function() {
      tx =  [{
        tx_json: {
          Account : "r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
          Amount : {
            currency : "LTC",
            issuer : "r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
            value : "9.985"
          },
          Destination : "r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
          Fee : "15",
          Flags : 0,
          Paths : [
            [
              {
            account : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
            currency : "USD",
            issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
            type : 49,
            type_hex : "0000000000000031"
          },
          {
            currency : "LTC",
            issuer : "rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX",
            type : 48,
            type_hex : "0000000000000030"
          },
          {
            account : "rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX",
            currency : "LTC",
            issuer : "rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX",
            type : 49,
            type_hex : "0000000000000031"
          }
          ]
          ],
          SendMax : {
            currency : "USD",
            issuer : "r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
            value : "30.30993068"
          },
          Sequence : 415,
          SigningPubKey : "02854B06CE8F3E65323F89260E9E19B33DA3E01B30EA4CA172612DE77973FAC58A",
          TransactionType : "Payment",
          TxnSignature : "304602210096C2F385530587DE573936CA51CB86B801A28F777C944E268212BE7341440B7F022100EBF0508A9145A56CDA7FAF314DF3BBE51C6EE450BA7E74D88516891A3608644E"
        },
        clientID: '48631',
        state:    'pending',
        submitIndex: 1,
        submittedIDs: ["304602210096C2F385530587DE573936CA51CB86B801A28F777C944E268212BE7341440B7F022100EBF0508A9145A56CDA7FAF314DF3BBE51C6EE450BA7E74D88516891A3608644E"],
        secret: 'mysecret'
      }];
      database = {
        getPendingTransactions: function(callback) {
          callback(null, tx);
        }
      }
    })

    it('should set transaction members correct ', function(done) {
      remote = new Remote(options);
      remote.storage = database;
      remote.transaction = function() {
        return {
          clientID: function(id) {
            if (typeof id === 'string') {
              this._clientID = id;
            }
            return this;
          },
          submit: function() {
            assert.deepEqual(this._clientID, tx[0].clientID);
            assert.deepEqual(this.submittedIDs,[tx[0].tx_json.TxnSignature]);
            assert.equal(this.submitIndex, tx[0].submitIndex);
            assert.equal(this.secret, tx[0].secret);
            done();

          },
          parseJson: function(json) {}
        }
      }
      remote.getPendingTransactions();

    })
  })
})
