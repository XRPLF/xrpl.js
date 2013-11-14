var assert = require('assert');
var utils  = require('./testutils');
var sinon = require('sinon');

var Remote = utils.load_module('remote').Remote;
var Server = utils.load_module('server').Server;
var Request = utils.load_module('request').Request;

var options, spy, mock, stub, remote, callback;

describe("Remote", function () {
  describe("initialing a remote with options", function () {
    beforeEach(function () {
      options = {
        server: {
          trace :         true,
          trusted:        true,
          local_signing:  true,
          secure: true,
          servers: [
            { host: 's_west.ripple.com', port: 443, secure: true },
            { host: 's_east.ripple.com', port: 443, secure: true }
          ],

          connection_offset: 0
        },


        host: 's_west.ripple.com', port: 443, secure: true,
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
    it("should add a server for each specified", function (done) {
      var remote = new Remote(options);
      done();
    })
  })

  describe("functions that return request objects", function () {
    beforeEach(function () {
      callback = function () {}
      remote = new Remote(options);
    });

    describe("requesting a ledger", function () {
      it("should return a request", function (done) {
        var request = remote.request_ledger(null, {}, callback);
        assert(request instanceof Request);
        done();
      })
    });

    describe('requesting server info', function () {
      it('should return a request object', function (done) {
        var request = remote.request_server_info(null, {}, callback);
        assert(request instanceof Request);
        done();
      })
    })

    describe('requesting peers', function () {
      it('should return a request object', function (done) {
        var request = remote.request_peers(null, {}, callback);
        assert(request instanceof Request);
        done();
      });
    });

    describe('requesting a connection', function () {
      it('should return a request object', function (done) {
        var request = remote.request_connect(null, {}, callback);
        assert(request instanceof Request);
        done();
      });
    });

    describe('making a unique node list add request', function () {
      it('should return a request object', function (done) {
        var request = remote.request_unl_add(null, {}, callback);
        assert(request instanceof Request);
        done();
      });
    });

    describe('making a unique node list request', function () {
      it('should return a request object', function (done) {
        var request = remote.request_unl_list(null, {}, callback);
        assert(request instanceof Request);
        done();
      });
    });

    describe('making a unique node list delete request', function () {
      it('should return a request object', function (done) {
        var request = remote.request_unl_delete(null, {}, callback);
        assert(request instanceof Request);
        done();
      });
    });
  })
})
