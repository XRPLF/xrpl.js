var assert      = require('assert');
var RippleTxt   = require('../src/js/ripple/rippletxt').RippleTxt;
var AuthInfo    = require('../src/js/ripple/authinfo').AuthInfo;
var VaultClient = require('../src/js/ripple/vaultclient').VaultClient;
var Blob        = require('../src/js/ripple/blob').Blob;
var UInt256     = require('../src/js/ripple/uint256').UInt256;

var exampleData = {
  id: 'ef203d3e76552c0592384f909e6f61f1d1f02f61f07643ce015d8b0c9710dd2f',
  crypt: 'f0cc91a7c1091682c245cd8e13c246cc150b2cf98b17dd6ef092019c99dc9d82',
  unlock: '3e15fe3218a9c664835a6f585582e14480112110ddbe50e5028d05fc5bd9b5f4',
  blobURL: 'https://id.staging.ripple.com',
  username: 'exampleUser',
  password: 'pass word',
  domain: 'staging.ripple.com',
  encrypted_secret: 'APYqtqvjJk/J324rx2BGGzUiQ3mtmMMhMsbrUmgxb00W2aFVQzCC2mqd58Z17gzeUUcjtjAm'
};

var rippleTxtRes = {
  address: [ 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV' ],
  validation_public_key: [ 'n9KPnVLn7ewVzHvn218DcEYsnWLzKerTDwhpofhk4Ym1RUq4TeGw' ],
  domain: [ 'ripple.com' ],
  ips: [
    '23.21.167.100 51235',
    '23.23.201.55 51235',
    '107.21.116.214 51235'
  ],
  validators: [
    'n9KPnVLn7ewVzHvn218DcEYsnWLzKerTDwhpofhk4Ym1RUq4TeGw',
    'n9LFzWuhKNvXStHAuemfRKFVECLApowncMAM5chSCL9R5ECHGN4V',
    'n94rSdgTyBNGvYg8pZXGuNt59Y5bGAZGxbxyvjDaqD9ceRAgD85P',
    'redstem.com'
  ],
  authinfo_url: [
    'https://id.staging.ripple.com/v1/authinfo'
  ]
};

var authInfoRes = {
  body: {
    version: 3,
    blobvault: 'https://id.staging.ripple.com',
    pakdf: {
      modulus: 'c7f1bc1dfb1be82d244aef01228c1409c1988943ca9e21431f1669b4aa3864c9f37f3d51b2b4ba1ab9e80f59d267fda1521e88b05117993175e004543c6e3611242f24432ce8efa3b81f0ff660b4f91c5d52f2511a6f38181a7bf9abeef72db056508bbb4eeb5f65f161dd2d5b439655d2ae7081fcc62fdcb281520911d96700c85cdaf12e7d1f15b55ade867240722425198d4ce39019550c4c8a921fc231d3e94297688c2d77cd68ee8fdeda38b7f9a274701fef23b4eaa6c1a9c15b2d77f37634930386fc20ec291be95aed9956801e1c76601b09c413ad915ff03bfdc0b6b233686ae59e8caf11750b509ab4e57ee09202239baee3d6e392d1640185e1cd',
      alpha: '7283d19e784f48a96062271a5fa6e2c3addf14e6ezf78a4bb61364856d580f13552008d7b9e3b60ebd9555e9f6c7778ec69f976757d206134e54d61ba9d588a7e37a77cf48060522478352d76db000366ef669a1b1ca93c5e3e05bc344afa1e8ccb15d3343da94180dccf590c2c32408c3f3f176c8885e95d988f1565ee9b80c12f72503ab49917792f907bbb9037487b0afed967fefc9ab090164597fcd391c43fab33029b38e66ff4af96cbf6d90a01b891f856ddd3d94e9c9b307fe01e1353a8c30edd5a94a0ebba5fe7161569000ad3b0d3568872d52b6fbdfce987a687e4b346ea702e8986b03b6b1b85536c813e46052a31ed64ec490d3ba38029544aa',
      url: 'https://auth1.ripple.com/api/sign',
      exponent: '010001',
      host: 'auth1.ripple.com'
    },
    exists: true,
    username: 'exampleUser',
    address: 'raVUps4RghLYkVBcpMaRbVKRTTzhesPXd',
    emailVerified: true,
    reserved: false
  },
};

//must be set for self signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('Ripple Txt', function() {
  it('should get the content of a ripple.txt file from a given domain', function(done) {
    var rt = new RippleTxt();

    var requestedUrls = [ ];

    var testUrls = RippleTxt.urlTemplates.map(function(template) {
      return template.replace('{{domain}}', 'localhost');
    });

    rt.request = function(url, callback) {
      requestedUrls.push(url);
      callback(new Error());
    };

    rt.get('localhost', function(err, resp) {
      assert(err instanceof Error);
      assert.strictEqual(resp, void(0));
      assert.deepEqual(requestedUrls, testUrls);
      done();
    });
  });
});

describe('AuthInfo', function() {
  it('should get auth info', function(done) {
    var auth = new AuthInfo();

    auth._getRippleTxt = function(domain, callback) {
      assert.strictEqual(domain, 'staging.ripple.com');
      callback(null, rippleTxtRes);
    };

    auth._getUser = function(url, callback) {
      assert.strictEqual(url, 'https://id.staging.ripple.com/v1/authinfo?domain=staging.ripple.com&username=exampleUser');
      callback(null, authInfoRes);
    };

    auth.get(exampleData.domain, exampleData.username, function(err, resp) {
      assert.ifError(err);
      Object.keys(authInfoRes.body).forEach(function(prop) {
        assert(resp.hasOwnProperty(prop));
      });
      done();
    });
  });
});

describe('VaultClient', function () {
  var client = new VaultClient(exampleData.domain);

  describe('#initialization', function() {
    it('should be initialized with a domain', function() {
      var client = new VaultClient({ domain: exampleData.domain });
      assert.strictEqual(client.domain, exampleData.domain);
    });

    it('should default to ripple.com without a domain', function () {
      var client = new VaultClient();
      assert.strictEqual(client.domain, 'ripple.com');
    });
  });

  describe('#exists', function() {
    it('should determine if a username exists on the domain', function(done) {
      this.timeout(10000);
      client.exists(exampleData.username, function(err, resp) {
        assert.ifError(err);
        assert.strictEqual(typeof resp, 'boolean');
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
    it('should access the wallet secret using encryption secret, username and password', function (done) {
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

  describe('#loginAndUnlock', function () {
    it('should get the decrypted blob and decrypted secret given name and password', function (done) {
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


describe('Blob', function () {
  var vaultClient;

  vaultClient = new VaultClient({ domain: exampleData.domain });

  vaultClient.login(exampleData.username, exampleData.password, function(err,resp) {
    assert.ifError(err);
    var blob = resp.blob;
    describe('#set', function() {
      it('should set a new property in the blob', function(done) {
        this.timeout(10000)
        blob.extend('/testObject', {
          foo: [],
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
        blob.extend('/testObject', {
          foobar: 'baz',
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
        blob.unset('/testObject', function(err, resp){
          assert.ifError(err);
          assert.equal(resp.result, 'success');
          done();
        });
      });
    });

    describe('#unshift', function() {
      it('should prepend an item to an array in the blob', function(done) {
        this.timeout(10000)
        blob.unshift('/testArray', {
          name: 'bob',
          address: '1234'
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

        blob.filter('/testArray', 'name', 'bob', 'extend', '', {description:'Alice'}, function(err, resp){
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
    
    /********* Identity tests ***********/
    describe('#identity_set', function () {
      it('should set an identity property', function (done) {
        this.timeout(10000);
        
        blob.identity.set('address', exampleData.unlock, {city:"San Francisco", region:"CA"}, function (err, resp) {
          assert.ifError(err);
          assert.equal(resp.result, 'success');
          done();          
        });
      });      
    });  

    describe('#identity_get', function () {
      it('should retreive an identity property given the property name and encryption key', function () {
        
        var property = blob.identity.get('address', exampleData.unlock);
        assert.ifError(property.error);   
        assert.equal(typeof property.encrypted, 'boolean');     
        assert.notEqual(typeof property.value, 'undefined');  
      });      
    }); 

    describe('#identity_getAll', function () {
      it('should retreive all identity properties given the encryption key', function () {
        
        var obj = blob.identity.getAll(exampleData.unlock);  
        assert.equal(typeof obj, 'object');       
      });      
    }); 

    describe('#identity_getFullAddress', function () {
      it('should retreive the address as a string', function () {
        
        var address = blob.identity.getFullAddress(exampleData.unlock);  
        assert.equal(typeof address, 'string');       
      });      
    }); 
                
    describe('#identity_unset', function () {
      it('should remove an identity property', function (done) {
        this.timeout(10000);
        
        blob.identity.unset('name', exampleData.unlock, function (err, resp) {
          assert.ifError(err);
          assert.equal(resp.result, 'success');
          done();          
        });
      });      
    });        
  });
});
