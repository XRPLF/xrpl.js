var assert    = require('assert'),
  RippleTxt   = require('../src/js/ripple/rippletxt'),
  AuthInfo    = require('../src/js/ripple/authinfo'),
  VaultClient = require('../src/js/ripple/vaultclient'),
  Blob        = require('../src/js/ripple/blob').Blob,
  UInt256     = require('../src/js/ripple/uint256').UInt256;

var exampleData = {
  id       : "ef203d3e76552c0592384f909e6f61f1d1f02f61f07643ce015d8b0c9710dd2f",
  crypt    : "f0cc91a7c1091682c245cd8e13c246cc150b2cf98b17dd6ef092019c99dc9d82",
  unlock   : "3e15fe3218a9c664835a6f585582e14480112110ddbe50e5028d05fc5bd9b5f4",
  blobURL  : "https://id.staging.ripple.com",
  username : "exampleUser",
  password : "pass word",
  domain   : "staging.ripple.com",
  encrypted_secret : "APYqtqvjJk/J324rx2BGGzUiQ3mtmMMhMsbrUmgxb00W2aFVQzCC2mqd58Z17gzeUUcjtjAm"
};


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";  //must be set for self signed certs


describe('Ripple Txt', function() {
  it('should get the context of a ripple.txt file from a given domain', function(done){
    var rt = new RippleTxt();
    rt.get(exampleData.domain, function(err, resp){
      assert.ifError(err);
      assert.equal(typeof resp, 'object');
      done();
    });
  });
});


describe('AuthInfo', function() {
  var auth = new AuthInfo();
  
  it ('should', function(done){
    auth.get(exampleData.domain, exampleData.user, function(err, resp){
      assert.ifError(err);
      assert.equal(typeof resp, 'object');
      done();
    }); 
  }); 
});

describe('VaultClient', function() {
  var client = new VaultClient(exampleData.domain);
  
  describe('initialization', function() {
    it('should be initialized with a domain', function() {
      var client = new VaultClient({ domain: exampleData.domain });
      assert.strictEqual(client.domain, exampleData.domain);
    });

    it('should default to ripple.com without a domain', function() {
      var client = new VaultClient();
      assert.strictEqual(client.domain, 'ripple.com');
    });
  });
  
  describe('#exists', function() {
    it('should determine if a username exists on the domain', function(done) {
      this.timeout(10000);
      client.exists(exampleData.username, function(err, resp) {
        
        assert.ifError(err);
        assert.equal(typeof resp, 'boolean');
        done();
      });
    });
  });
  
  describe('#login', function() {
    it('with username and password should retrive the blob, crypt key, and id', function(done) {
      this.timeout(10000);
      client.login(exampleData.username, exampleData.password, function(err, resp) {
        
        assert.ifError(err);
        assert.equal(typeof resp, 'object');
        assert(resp.blob instanceof Blob);
        assert.equal(typeof resp.blob.id, 'string');
        assert(UInt256.from_json(resp.blob.id).is_valid(), true);
        assert.equal(typeof resp.blob.key, 'string');
        assert(UInt256.from_json(resp.blob.key).is_valid(), true);
        assert.equal(typeof resp.username, 'string');
        assert.equal(typeof resp.verified, 'boolean');
        done();
      });
    });
  });
  
  
  describe('#relogin', function() {
    it('should retrieve the decrypted blob with blob vault url, id, and crypt key', function(done) {
      this.timeout(10000);
      client.relogin(exampleData.blobURL, exampleData.id, exampleData.crypt, function(err, resp) {
        
        assert.ifError(err);
        assert.equal(typeof resp, 'object');
        assert(resp.blob instanceof Blob);
        done();
      });
    });
  });

  describe('#unlock', function() {
    it('should access the wallet secret using encryption secret, username and password', function(done) {
      this.timeout(10000);
      client.unlock(exampleData.username, exampleData.password, exampleData.encrypted_secret, function(err, resp) {
        
        assert.ifError(err);
        assert.equal(typeof resp, 'object');
        assert.equal(typeof resp.keys, 'object');
        assert.equal(typeof resp.keys.unlock, 'string');
        assert(UInt256.from_json(resp.keys.unlock).is_valid(), true);
        done();
      });
    });
  });

  describe('#loginAndUnlock', function() {
    it('should get the decrypted blob and decrypted secret given name and password', function(done) {
      this.timeout(10000);
      client.loginAndUnlock(exampleData.username, exampleData.password, function(err, resp) {

        assert.ifError(err);
        assert.equal(typeof resp, 'object'); 
        assert(resp.blob instanceof Blob);
        assert.equal(typeof resp.blob.id, 'string');
        assert(UInt256.from_json(resp.blob.id).is_valid(), true);
        assert.equal(typeof resp.blob.key, 'string');
        assert(UInt256.from_json(resp.blob.key).is_valid(), true);
        assert.equal(typeof resp.unlock, 'string');
        assert(UInt256.from_json(resp.unlock).is_valid(), true);  
        assert.equal(typeof resp.secret, 'string');
        assert.equal(typeof resp.username, 'string');
        assert.equal(typeof resp.verified, 'boolean');
        done();
      });
    });
  });
});


describe('Blob', function() {
  var vaultClient;
  
  vaultClient = new VaultClient({ domain: exampleData.domain });
  vaultClient.login(exampleData.username, exampleData.password, function(err,resp){
    assert.ifError(err);
    var blob = resp.blob;


    describe('#set', function() {
      it('should set a new property in the blob', function(done) {
        this.timeout(10000)
  
        blob.extend("/testObject", {
          foo    : [],
        }, function(err, resp){
          assert.ifError(err);
          assert.equal(resp.result, 'success');
          done();
        });
      });
    }); 
    
    describe('#extend', function() {
      it('should extend an object in the blob', function(done) {
        this.timeout(10000)
  
        blob.extend("/testObject", {
          foobar : "baz",
        }, function(err, resp){
          assert.ifError(err);
          assert.equal(resp.result, 'success');
          done();
        });
      });
    }); 

    describe('#unset', function() {
      it('should remove a property from the blob', function(done) {
        this.timeout(10000)
  
        blob.unset("/testObject", function(err, resp){
          assert.ifError(err);
          assert.equal(resp.result, 'success');
          done();
        });
      });
    }); 
        
    describe('#unshift', function() {
      it('should prepend an item to an array in the blob', function(done) {
        this.timeout(10000)
  
        blob.unshift("/testArray", {
          name    : "bob",
          address : "1234"
        }, function(err, resp){
          assert.ifError(err);
          assert.equal(resp.result, 'success');
          done();
        });
      });
    });
    
    describe('#filter', function() {
      it('should find a specific entity in an array and apply subcommands to it', function(done) {
        this.timeout(10000)
  
        blob.filter('/testArray', 'name', 'bob', 'extend', '', {description:"Alice"}, function(err, resp){
          assert.ifError(err);
          assert.equal(resp.result, 'success');
          done();
        });
      });
    });    

    describe('#consolidate', function() {
      it('should consolidate and save changes to the blob', function(done) {
        this.timeout(10000)
        
        blob.unset('/testArray', function(err, resp){
          assert.ifError(err);
          assert.equal(resp.result, 'success');
                    
          blob.consolidate(function(err, resp){
            assert.ifError(err);
            assert.equal(resp.result, 'success');
            done();
          });          
        }); 
      });
    });    
  });
}); 
   
