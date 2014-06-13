var assert      = require('assert');
var RippleTxt   = require('../src/js/ripple/rippletxt').RippleTxt;
var AuthInfo    = require('../src/js/ripple/authinfo').AuthInfo;
var VaultClient = require('../src/js/ripple/vaultclient').VaultClient;
var Blob        = require('../src/js/ripple/blob').Blob;
var UInt256     = require('../src/js/ripple/uint256').UInt256;
var sjcl        = require('../src/js/sjcl/sjcl.js');
var nock        = require('nock');
var online      = process.argv.indexOf('--online-blobvault') !== -1 ? true : false; 

var exampleData = {
  id: 'ef203d3e76552c0592384f909e6f61f1d1f02f61f07643ce015d8b0c9710dd2f',
  crypt: 'f0cc91a7c1091682c245cd8e13c246cc150b2cf98b17dd6ef092019c99dc9d82',
  unlock: '3e15fe3218a9c664835a6f585582e14480112110ddbe50e5028d05fc5bd9b5f4',
  username: 'exampleUser',
  password: 'pass word',
  domain: 'staging.ripple.com',
  blob: { 
    url: 'https://id.staging.ripple.com',
    id: 'ef203d3e76552c0592384f909e6f61f1d1f02f61f07643ce015d8b0c9710dd2f',
    key: 'f0cc91a7c1091682c245cd8e13c246cc150b2cf98b17dd6ef092019c99dc9d82',
    data: { 
      auth_secret: 'd0aa918e693080a6a8d0ddc7f4dcf4bc0eecc3c3e3235f16a98661ee9c2e7a58',
      account_id: 'raVUps4RghLYkVBcpMaRbVKRTTzhesPXd',
      email: 'example@example.com',
      contacts: [ ],
      created: '2014-05-20T23:39:52.538Z',
      apps: [ ],
      lastSeenTxDate: 1401925490000,
      identityVault: { },
      revision: 2199,
      encrypted_secret: 'APYqtqvjJk/J324rx2BGGzUiQ3mtmMMhMsbrUmgxb00W2aFVQzCC2mqd58Z17gzeUUcjtjAm'
    }
  }
};

var rippleTxtRes = "[authinfo_url]\r\nhttps://id.staging.ripple.com/v1/authinfo";

var authInfoRes = {
  body : {
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
  }
};

var signRes = '{"result":"success","signres":"64e9e46618fff0b720b8162e6caa209e046af128b929b766d3be421d3f048ba523453dad42597dcec01f23a5080c16695f6209d39a03668d46b782409e4a53821f70b5e6f7c8fd28eb641c504f9f9b2f378bf2ea7f19950790ac6a8832e2659800f5bb06b735bd450fa47b499fbcebeb3b0fc327619dd2171fa40fb0a41d9bcd69dd29567fa94e9466d4674b908f1cfc43822b38b94534cb37eead183b11b33761a73d78be6ba6f3a53291d4154ca0891fa59da58380e05a1e85b15a24d12406795385bcc5a6360a24ecbf068ff6f02097cd917281972d4895769f3a8668b852ea5d4232050200bcd03934f49ea0693d832980614dff1ead67ca2e0ce9073c25","modulus":"c7f1bc1dfb1be82d244aef01228c1409c198894eca9e21430f1669b4aa3864c9f37f3d51b2b4ba1ab9e80f59d267fda1521e88b05117993175e004543c6e3611242f24432ce8efa3b81f0ff660b4f91c5d52f2511a6f38181a7bf9abeef72db056508bbb4eeb5f65f161dd2d5b439655d2ae7081fcc62fdcb281520911d96700c85cdaf12e7d1f15b55ade867240722425198d4ce39019550c4c8a921fc231d3e94297688c2d77cd68ee8fdeda38b7f9a274701fef23b4eaa6c1a9c15b2d77f37634930386fc20ec291be95aed9956801e1c76601b09c413ad915ff03bfdc0b6b233686ae59e8caf11750b509ab4e57ee09202239baee3d6e392d1640185e1cd","alpha":"7283d19e784f48a96062271a4fa6e2c3addf14e6edf78a4bb61364856d580f13552008d7b9e3b60ebd9555e9f6c7778ec69f976757d206134e54d61ba9d588a7e37a77cf48060522478352d76db000366ef669a1b1ca93c5e3e05bc344afa1e8ccb15d3343da94180dccf590c2c32408c3f3f176c8885e95d988f1565ee9b80c12f72503ab49917792f907bbb9037487b0afed967fefc9ab090164597fcd391c43fab33029b38e66ff4af96cbf6d90a01b891f856ddd3d94e9c9b307fe01e1353a8c30edd5a94a0ebba5fe7161569000ad3b0d3568872d52b6fbdfce987a687e4b346ea702e8986b03b6b1b85536c813e46052a31ed64ec490d3ba38029544aa","exponent":"010001"}';

var blobRes = {
  body : { 
    result: 'success',
    encrypted_secret: 'APYqtqvjJk/J324rx2BGGzUiQ3mtmMMhMsbrUmgxb00W2aFVQzCC2mqd58Z17gzeUUcjtjAm',
    blob: 'ALXga/k8mgvPpZCY0zJZdaqlptHUBL0E4V/90p4edvb7eCucU2M7aFsHIl3Z3UDu9MdlDnDU42/C+YKL1spkSTPb3rGWr0kXIFmRu8xDAd+OA3Ot7u3OBq0sN2BUHbEc47WiCue84XQHTgBh9tdeiRTqm90LJ7hZ1pD0oqr823YpFguwcC1inxFbSTNxIdWSoC3XCqZtRFM2Y5ALleWhaWKc3OwaFU6yPRcW05IBvTY/7a2SfZyklvXnJh7Bg+vfvz7ms8UCybmBgHlBPY/UqGOdZI6iFGrEQrDMFHgbxwf7bTTiaOM7Su3OsqhM1k90LvQgk3b1olb1VIMZ5J1UuTtOVTpLSsIlzgMvxxdUUyN2zMkeDE3t8kHOThhwWbLG6O+s9F9fktIv4NtoAm0dG9LtkSE1YXajk0qIYr/zrblJy7pEvNv+EzdSr+dpvssmPshgwxoHwvCwae0vL7UTmrCxIWLlHbsbU2uAzgvudJL0WOpX4W+R43U3sgMD2XysKgX783Sa7DLUWCk3Rk9eGp7c3k/XpI0IWvuKzMxID8VzdyMmXP0RE77uUufisBDtwr8gPGzS5kzU3Z/FG/dHJkfBLZdbHOffQTPKO9DKUjztWpx7CTAkN9O21XrdLK1FRAtWFTuvlA66sDYtHRaqglzFjt9DsJk7PAKi1odHeLBmYob/Bs5eK9yNnlLwu3JpHLH/jKxkuxcZ3NEdTm1WPjTdNlvT7kdGAIG9c0vIywEABkQh1kPDOe39h3GRGcUqVWJcMjJmdVDrQH7BBVV+VptCVtMOo1LviaD0MIWMiYdZyGeH5x+FkpAMjKDB3cCUkmxmis8lrDiMlnTZ5Czj+bDPp62Looc7cr2pTR2niFZRosYNgUPx6cAh7tn64RDaa/spAyv0mWyD1qRA8H0sEPmC7m7EPaBIQpODh1NFg/Bxunh+QGSmy9deINB78b9A9zLS6qWljrzg5fMDUN66xRUUKJMSD9+QJePsM4pb60vbnBBtbe04JzY7iOc/CxiT0Px6/1jlSmnY6SCtaFqtDgmQ5MLGTm1tA+aj6caT6FWsXrBboXt3eXRDPHTN+ciKELx7M3dpd4mKVWhBu7nnnVMEu1rSUrmtUStXQHod/C7vVRF2EU1hhTW7ou0hvLn+7xs9B76QeVG7iYFLiZH1qgs+upqnLCnmY3ug9yd9GQ6YwbVL1hbXJLadaOg7qhKst0KXjjjcE4G9AIEyI+UCxGdc/0PNPOCCeYEPshvonCgElGo/fAbaIuSSOFfusiovYffJ0rCkq1RagH0R/llWtUEFEDR5YFVlD3DqK6B22fQK',
    revision: 2191,
    email: 'example@example.com',
    quota: -2975,
    patches: [] 
  }
};


//must be set for self signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var mockRippleTxt;
var mockAuthSign;
var mockBlob;

if (!online) {
  mockRippleTxt = nock('https://' + exampleData.domain)
    .persist()
    .get('/ripple.txt')
    .reply(200, rippleTxtRes, {
      'Content-Type': 'text/plain'
    }); 
      
  mockBlob = nock('https://id.staging.ripple.com').persist();
  mockBlob.get('/v1/authinfo?domain=' + exampleData.domain + '&username=' + exampleData.username.toLowerCase())
    .reply(200, JSON.stringify(authInfoRes.body), {
      'Content-Type': 'application/json'
    });     
    
  mockBlob.filteringPath(/(blob\/.+)/g, 'blob/')
    .get('/v1/blob/')
    .reply(200, JSON.stringify(blobRes.body), {
      'Content-Type': 'application/json'
    }); 
            
  mockAuthSign = nock('https://auth1.ripple.com')
    .persist()
    .post('/api/sign')
    .reply(200, signRes, {
      'Content-Type': 'text/plain'
    });  
}
  
describe('Ripple Txt', function () {
  it('should get the content of a ripple.txt file from a given domain', function(done) {
    var rt = new RippleTxt();

    rt.get(exampleData.domain, function(err, resp) {
      assert.ifError(err);
      assert.equal(typeof resp, 'object');
      done();
    });
  });
});

describe('AuthInfo', function() {  
  it('should get auth info', function(done) {
    var auth = new AuthInfo();

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
        if (online) {
          assert.ifError(err);
          assert.equal(typeof resp, 'object');
          assert(resp.blob instanceof Blob);
          assert.equal(typeof resp.blob.id, 'string');
          assert(UInt256.from_json(resp.blob.id).is_valid(), true);
          assert.equal(typeof resp.blob.key, 'string');
          assert(UInt256.from_json(resp.blob.key).is_valid(), true);
          assert.equal(typeof resp.username, 'string');
          assert.equal(typeof resp.verified, 'boolean');
        } else {
          assert(err instanceof Error);
          assert.strictEqual(resp, void(0));
        }
        
        done();
      });
    });
  });

  describe('#relogin', function() {
    it('should retrieve the decrypted blob with blob vault url, id, and crypt key', function(done) {
      this.timeout(10000);
      client.relogin(exampleData.blob.url, exampleData.id, exampleData.crypt, function(err, resp) {
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
      client.unlock(exampleData.username, exampleData.password, exampleData.blob.data.encrypted_secret, function(err, resp) {
        if (online) {
          assert.ifError(err);
          assert.equal(typeof resp, 'object');
          assert.equal(typeof resp.keys, 'object');
          assert.equal(typeof resp.keys.unlock, 'string');
          assert(UInt256.from_json(resp.keys.unlock).is_valid(), true);
        } else {
          assert.equal(err.toString(), 'CORRUPT: ccm: tag doesn\'t match');
          assert.strictEqual(resp, void(0));
        }
        
        done();
      });
    });
  });

  describe('#loginAndUnlock', function () {
    it('should get the decrypted blob and decrypted secret given name and password', function (done) {
      this.timeout(10000);
      client.loginAndUnlock(exampleData.username, exampleData.password, function(err, resp) {
        if (online) {
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
        } else {
          assert(err instanceof Error);
          assert.strictEqual(resp, void(0));
        }
        done();
      });
    });
  });
});

describe('Blob', function () {

  var vaultClient;
  var resp;
  var blob;

  vaultClient = new VaultClient({ domain: exampleData.domain });

  before(function(done) {
    if (online) {
      this.timeout(10000);
  
      vaultClient.login(exampleData.username, exampleData.password, function(err, res) {
        resp = res;
        blob = res.blob;
        done();
      });
    } else { 
       
      mockBlob.filteringPath(/(blob\/.+)/g, 'blob/')
        .post('/v1/blob/')
        .reply(200, {result:'success'}, {
          'Content-Type': 'application/json'
        });        

      blob = new Blob();
      blob.url  = exampleData.blob.url;
      blob.id   = exampleData.blob.id;
      blob.key  = exampleData.blob.key;
      blob.data = exampleData.blob.data;
      done();
    }
  });

  it('#set', function(done) {
    this.timeout(10000)
    blob.extend('/testObject', {
      foo: [],
    }, function(err, resp) {

      assert.ifError(err);
      assert.equal(resp.result, 'success');
      done();
    });
  });

  it('#extend', function(done) {
    this.timeout(10000)
    blob.extend('/testObject', {
      foobar: 'baz',
    }, function(err, resp){
      assert.ifError(err);
      assert.equal(resp.result, 'success');
      done();
    });
  });

  it('#unset', function(done) {
    this.timeout(10000)
    blob.unset('/testObject', function(err, resp){
      assert.ifError(err);
      assert.equal(resp.result, 'success');
      done();
    });
  });

  it('#unshift', function(done) {
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

  it('#filter', function(done) {
    this.timeout(10000)

    blob.filter('/testArray', 'name', 'bob', 'extend', '', {description:'Alice'}, function(err, resp){
      assert.ifError(err);
      assert.equal(resp.result, 'success');
      done();
    });
  });

  it('#consolidate', function(done) {
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

  describe('identity', function() {
    it('#identity_set', function (done) {
      this.timeout(10000);

      blob.identity.set('address', exampleData.unlock, {city:"San Francisco", region:"CA"}, function (err, resp) {
        assert.ifError(err);
        assert.equal(resp.result, 'success');
        done();          
      });
    });  

    it('#identity_get', function () {
      var property = blob.identity.get('address', exampleData.unlock);
      assert.ifError(property.error);   
      assert.equal(typeof property.encrypted, 'boolean');     
      assert.notEqual(typeof property.value, 'undefined');  
    });      

    it('#identity_getAll', function () {
      var obj = blob.identity.getAll(exampleData.unlock);  
      assert.equal(typeof obj, 'object');       
    }); 

    it('#identity_getFullAddress', function () {
      var address = blob.identity.getFullAddress(exampleData.unlock);  
      assert.equal(typeof address, 'string');       
    });      

    it('#identity_unset', function (done) {
      this.timeout(10000);

      blob.identity.unset('name', exampleData.unlock, function (err, resp) {
        assert.ifError(err);
        assert.equal(resp.result, 'success');
        done();          
      });
    });      
  });
  
  if (!online) {
    after(function () {
      nock.restore();
    });
  }
});
