var assert  = require('assert');
var sjcl    = require('../build/sjcl');
var Message = require('../src/js/ripple/message').Message;
var Seed    = require('../src/js/ripple/seed').Seed;
var Remote  = require('../src/js/ripple/remote').Remote;

describe('Message', function(){

  describe('signMessage', function(){

    it('should prepend the MAGIC_BYTES, call the HASH_FUNCTION, and then call signHash', function(){

      var normal_signHash = Message.signHash;

      var message_text = 'Hello World!';

      var signHash_called = false;
      Message.signHash = function(hash) {
        signHash_called = true;
        assert.deepEqual(hash, Message.HASH_FUNCTION(Message.MAGIC_BYTES + message_text));
      };

      Message.signMessage(message_text);
      assert(signHash_called);

      Message.signHash = normal_signHash;

    });

  });

  describe('signHash', function(){

    it('should accept the hash as either a hex string or a bitArray', function(){

      var normal_random = sjcl.random.randomWords;

      sjcl.random.randomWords = function(num_words){
        var words = [];
        for (var w = 0; w < num_words; w++) {
          words.push(sjcl.codec.hex.toBits('00000000'));
        }
        return words;
      };

      var secret_string = 'safRpB5euNL52PZPTSqrE9gvuFwTC';
      // var address = 'rLLzaq61D633b5hhbNXKM9CkrYHboobVv3';
      var hash = 'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778';

      var signature1 = Message.signHash(hash, secret_string);
      var signature2 = Message.signHash(sjcl.codec.hex.toBits(hash), secret_string);

      assert.strictEqual(signature1, signature2);

      sjcl.random.randomWords = normal_random;

    });

    it('should accept the secret as a string or scjl.ecc.ecdsa.secretKey object', function(){

      var normal_random = sjcl.random.randomWords;

      sjcl.random.randomWords = function(num_words){
        var words = [];
        for (var w = 0; w < num_words; w++) {
          words.push(sjcl.codec.hex.toBits('00000000'));
        }
        return words;
      };

      var secret_string = 'safRpB5euNL52PZPTSqrE9gvuFwTC';
      // var address = 'rLLzaq61D633b5hhbNXKM9CkrYHboobVv3';
      var hash = 'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778';

      var signature1 = Message.signHash(hash, secret_string);
      var signature2 = Message.signHash(hash, Seed.from_json(secret_string).get_key()._secret);

      assert.strictEqual(signature1, signature2);

      sjcl.random.randomWords = normal_random;

    });

    it('should throw an error if given an invalid secret key', function(){
      // Annoyingly non hex can be fed to the BigInteger(s, 16) constructor and
      // it will parse as a number. Before the commit of this comment, this test
      // involved a fixture of 32 chars, which was assumed to be hex. The test
      // passed, but for the wrong wreasons. There was a bug in Seed.parse_json.

      // Seed.from_json only creates invalid seeds from empty strings or invalid
      // base58 starting with an s, which it tries to base 58 decode/check sum.
      // The rest will be assumed to be a passphrase.

      // This is a bad b58 seed
      var secret_string = 'sbadsafRpB5euNL52PZPTSqrE9gvuFwTC';
      var hash = 'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778';

      assert.throws(function(){
        Message.signHash(hash, secret_string);
      }, /Cannot\ generate\ keys\ from\ invalid\ seed/);

    });

    it('should throw an error if the parameters are reversed', function(){

      var secret_string = 'safRpB5euNL52PZPTSqrE9gvuFwTC';
      var hash = 'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778';

      assert.throws(function(){
        Message.signHash(secret_string, hash);
      }, Error);

      assert.throws(function(){
        Message.signHash(secret_string, sjcl.codec.hex.toBits(hash));
      }, Error);

      assert.throws(function(){
        Message.signHash(Seed.from_json(secret_string).get_key()._secret, hash);
      }, Error);

      assert.throws(function(){
        Message.signHash(Seed.from_json(secret_string).get_key()._secret, sjcl.codec.hex.toBits(hash));
      }, Error);

    });

    it('should produce a base64-encoded signature', function(){
      var REGEX_BASE64 = /^([A-Za-z0-9\+]{4})*([A-Za-z0-9\+]{2}==)|([A-Za-z0-9\+]{3}=)?$/;

      var normal_random = sjcl.random.randomWords;

      sjcl.random.randomWords = function(num_words){
        var words = [];
        for (var w = 0; w < num_words; w++) {
          words.push(sjcl.codec.hex.toBits('00000000'));
        }
        return words;
      };

      var secret_string = 'safRpB5euNL52PZPTSqrE9gvuFwTC';
      // var address = 'rLLzaq61D633b5hhbNXKM9CkrYHboobVv3';
      var hash = 'e865bcc63a86ef21585ac8340a7cc8590ed85175a2a718c6fb2bfb2715d13778';

      var signature = Message.signHash(hash, secret_string);

      assert(REGEX_BASE64.test(signature));

      sjcl.random.randomWords = normal_random;
    });

  });

  describe('verifyMessageSignature', function(){

    it('should prepend the MAGIC_BYTES, call the HASH_FUNCTION, and then call verifyHashSignature', function(){

      var normal_verifyHashSignature = Message.verifyHashSignature;

      var data = {
        message: 'Hello world!',
        signature: 'AAAAGzFa1pYjhssCpDFZgFSnYQ8qCnMkLaZrg0mXZyNQ2NxgMQ8z9U3ngYerxSZCEt3Q4raMIpt03db7jDNGbfmHy8I='
      };

      var verifyHashSignature_called = false;
      Message.verifyHashSignature = function(vhs_data, remote, callback) {
        verifyHashSignature_called = true;

        assert.deepEqual(vhs_data.hash, Message.HASH_FUNCTION(Message.MAGIC_BYTES + data.message));
        assert.strictEqual(vhs_data.signature, data.signature);
        callback();

      };

      Message.verifyMessageSignature(data, {}, function(err){
        assert(!err);
      });
      assert(verifyHashSignature_called);

      Message.verifyHashSignature = normal_verifyHashSignature;

    });

  });

  describe('verifyHashSignature', function(){

    it('should throw an error if a callback function is not supplied', function(){

      var data = {
        message: 'Hello world!',
        hash: '861844d6704e8573fec34d967e20bcfef3d424cf48be04e6dc08f2bd58c729743371015ead891cc3cf1c9d34b49264b510751b1ff9e537937bc46b5d6ff4ecc8',
        signature: 'AAAAHOUJQzG/7BO82fGNt1TNE+GGVXKuQQ0N2nTO+iJETE69PiHnaAkkOzovM177OosxbKjpt3KvwuJflgUB2YGvgjk=',
        account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz'
      };

      //Remote.prototype.addServer = function(){};
      var test_remote = new Remote();

      assert.throws(function(){
        Message.verifyHashSignature(data);
      }, /(?=.*callback\ function).*/);
    });

    it('should respond with an error if the hash is missing or invalid', function(done){

      var data = {
        message: 'Hello world!',
        signature: 'AAAAHOUJQzG/7BO82fGNt1TNE+GGVXKuQQ0N2nTO+iJETE69PiHnaAkkOzovM177OosxbKjpt3KvwuJflgUB2YGvgjk=',
        account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz'
      };

      //Remote.prototype.addServer = function(){};
      var test_remote = new Remote();
      test_remote.state = 'online';

      Message.verifyHashSignature(data, test_remote, function(err, valid){
        assert(/hash/i.test(err.message));
        done();
      });

    });

    it('should respond with an error if the account is missing or invalid', function(done){

      var data = {
        message: 'Hello world!',
        hash: '861844d6704e8573fec34d967e20bcfef3d424cf48be04e6dc08f2bd58c729743371015ead891cc3cf1c9d34b49264b510751b1ff9e537937bc46b5d6ff4ecc8',
        signature: 'AAAAHOUJQzG/7BO82fGNt1TNE+GGVXKuQQ0N2nTO+iJETE69PiHnaAkkOzovM177OosxbKjpt3KvwuJflgUB2YGvgjk='
      };

      //Remote.prototype.addServer = function(){};
      var test_remote = new Remote();
      test_remote.state = 'online';

      Message.verifyHashSignature(data, test_remote, function(err, valid){
        assert(/account|address/i.test(err.message));
        done();
      });

    });

    it('should respond with an error if the signature is missing or invalid', function(done){

      var data = {
        message: 'Hello world!',
        hash: '861844d6704e8573fec34d967e20bcfef3d424cf48be04e6dc08f2bd58c729743371015ead891cc3cf1c9d34b49264b510751b1ff9e537937bc46b5d6ff4ecc8',
        account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz'
      };

      //Remote.prototype.addServer = function(){};
      var test_remote = new Remote();
      test_remote.state = 'online';

      Message.verifyHashSignature(data, test_remote, function(err, valid){
        assert(/signature/i.test(err.message));
        done();
      });

    });

    it('should respond true if the signature is valid and corresponds to an active public key for the account', function(done){

      var data = {
        message: 'Hello world!',
        hash: 'e9a82ea40514787918959b1100481500a5d384030f8770575c6a587675025fe212e6623e25643f251666a7b8b23af476c2850a8ea92153de5724db432892c752',
        account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
        signature: 'AAAAHMIPCQGLgdnpX1Ccv1wHb56H4NggxIM6U08Qkb9mUjN2Vn9pZ3CHvq1yWLBi6NqpW+7kedLnmfu4VG2+y43p4Xs='
      };

      //Remote.prototype.addServer = function(){};
      var test_remote = new Remote();
      test_remote.state = 'online';
      test_remote.requestAccountInfo = function(options, callback) {
        var account = options.account;
        if (account === data.account) {
          callback(null, {
            "account_data": {
              "Account": "rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz",
              "Flags": 1114112,
              "LedgerEntryType": "AccountRoot",
              "RegularKey": "rHq2wyUtLkAad3vURUk33q9gozd97skhSf"
            }
          });
        } else {
          callback(new Error('wrong account'));
        }
      };

      Message.verifyHashSignature(data, test_remote, function(err, valid){
        assert(!err);
        assert(valid);
        done();
      });

    });

    it('should respond false if a key can be recovered from the signature but it does not correspond to an active public key', function(done){

      // Signature created by disabled master key
      var data = {
        message: 'Hello world!',
        hash: 'e9a82ea40514787918959b1100481500a5d384030f8770575c6a587675025fe212e6623e25643f251666a7b8b23af476c2850a8ea92153de5724db432892c752',
        account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
        signature: 'AAAAG+dB/rAjZ5m8eQ/opcqQOJsFbKxOu9jq9KrOAlNO4OdcBDXyCBlkZqS9Xr8oZI2uh0boVsgYOS3pOLJz+Dh3Otk='
      };

      //Remote.prototype.addServer = function(){};
      var test_remote = new Remote();
      test_remote.state = 'online';
      test_remote.requestAccountInfo = function(options, callback) {
        var account = options.account;
        if (account === data.account) {
          callback(null, {
            "account_data": {
              "Account": "rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz",
              "Flags": 1114112,
              "LedgerEntryType": "AccountRoot",
              "RegularKey": "rHq2wyUtLkAad3vURUk33q9gozd97skhSf"
            }
          });
        } else {
          callback(new Error('wrong account'));
        }
      };

      Message.verifyHashSignature(data, test_remote, function(err, valid){
        assert(!err);
        assert(!valid);
        done();
      });

    });

  });

});
