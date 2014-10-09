var assert      = require('assert');
var RippleTxt   = require('../src/js/ripple/rippletxt').RippleTxt;
var AuthInfo    = require('../src/js/ripple/authinfo').AuthInfo;
var VaultClient = require('../src/js/ripple/vaultclient').VaultClient;
var Blob        = require('../src/js/ripple/blob').Blob;
var UInt256     = require('../src/js/ripple/uint256').UInt256;
var sjcl        = require('../build/sjcl');
var nock        = require('nock');
var online      = process.argv.indexOf('--online-blobvault') !== -1 ? true : false; 

var exampleData = {
  id: 'ef203d3e76552c0592384f909e6f61f1d1f02f61f07643ce015d8b0c9710dd2f',
  crypt: 'f0cc91a7c1091682c245cd8e13c246cc150b2cf98b17dd6ef092019c99dc9d82',
  unlock: '3e15fe3218a9c664835a6f585582e14480112110ddbe50e5028d05fc5bd9b5f4',
  username: 'exampleUser',
  new_username : 'exampleUser-rename',
  password: 'pass word',
  domain: 'staging.ripple.com',
  masterkey : 'ssize4HrSYZShMWBtK6BhALGEk8VH',
  email_token : '77825040-9096-4695-9cbc-76720f6a8649',
  activateLink : 'https://staging.ripple.com/client/#/register/activate/',
  device_id : "ac1b6f6dbca98190eb9687ba06f0e066",
  identity_id : "17fddb71-a5c2-44ce-8b50-4b381339d4f2",
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

var authInfoNewUsernameRes = {
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
    exists: false,
    username: exampleData.new_username,
    emailVerified: false,
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

var recoverRes = {
  body: { 
    encrypted_secret: 'AAd69B9En2OF4O4LsjD+pFNeJHEGIuLh2hbla58zGvN7qU/16bDfy0QlFj8/Gu++AdFwH5U6',
    revision: 2403,
    blob_id: 'ef203d3e76552c0592384f909e6f61f1d1f02f61f07643ce015d8b0c9710dd2f',
    blob: 'AFfW9vuHJ2J5UMnEl4WrVIT9z2d+PPVNNHkqzN64b3pKDQcRPFp8vVEqL9B+YVs/KHhFVFNxxCNyVXwO/yGg4BAslYl8Ioo11IODmOltJmb94oKR/JVyfaY4bDWaOzAoa5N/c9LHpmd0L+9igK1o260MK5OZW4BQ6EG7I+8cYi5uM2CLguiddySu2yTEnyHW47zspWP33y2deh6p5mHtLdii/tmlm7b2rKpzrRVuLN/J09jqilhMxlCEr4X065YZLlQapJ45UWvpifejEw/6Qgl1WngZxwifHa504aR/QYhb1XCNeYbkjQ1MmkTmTef47Al4r/Irzoe//pDbAFA70XXkBUVUMAXWiOxU5V6gHO4yhXbTFEn7922JZlY7PIjo2Q+BxLkozMzuh8MZdoeadqffZX1fOuyTRWfPlqi7vIYgnUyTmThKe2EZv1LsB5ZUaX3KSArKDv1xPTKS0nexGNZoFckwEfVr6B2PGbMx8LPLYEEEmd95kh8NAKN1wkOPuBehLAtbMtcnLpTsotY6diqWdW4V9BSst0KDMTxZVfeesWD7/7ga9hzNvAWO1MN3aAvDCiQVufb44i4Qfu6fLS7+nxtcDCN2PqPHcANcW0cUhUNB50ajzNwRXN8B92CiY0zkS61CzWeooHOslGp0Acau1CJy8iHGyjzbPS4ui8F2h2TbDUuInOoMqiRjXFvRTxA=',
    encrypted_blobdecrypt_key: 'AA9vUokfQ1WXEOArl2DUwY3cxgXGKj9uNEqrJQzUu0hqXIWRu1V+6l1qqxXKPnm9BNscMpm0BMSbxUz++lfV50c1B4akvrzIBH+MUUgNyyPcHR7JBgjEYt0=',
    patches: [],
    result: 'success' 
    }
  }
 
var getProfileRes = {
  "result":"success",
  "addresses":[],
  "attributes":[{
    "attribute_id":"4034e477-ffc9-48c4-bcbc-058293f081d8",
    "identity_id":"17fddb71-a5c2-44ce-8b50-4b381339d4f2",
    "name":"email",
    "type":"default",
    "domain":null,
    "value":"example@example.com",
    "visibility":"public",
    "updated":null
    }
  ]
};

var blob = new Blob();
  blob.url       = exampleData.blob.url;
  blob.id        = exampleData.blob.id;
  blob.device_id = exampleData.device_id;
  blob.key       = exampleData.blob.key;
  blob.identity_id = exampleData.blob.identity_id;
  blob.data      = exampleData.blob.data;
  blob.revision  = exampleData.blob.data.revision;
  
//must be set for self signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
while(!sjcl.random.isReady()) {
  sjcl.random.addEntropy(require('crypto').randomBytes(128).toString('base64')); //add entropy to seed the generator
}

var mockRippleTxt;
var mockRippleTxt2;
var mockAuthSign;
var mockRegister;
var mockBlob;
var mockRename;
var mockUpdate;
var mockRecover;
var mockVerify;
var mockEmail;
var mockProfile;
var mockDelete;

if (!online) {
  mockRippleTxt = nock('https://ripple.com')
    .get('/ripple.txt')
    .reply(200, rippleTxtRes, {
      'Content-Type': 'text/plain'
    }); 
      
  mockRippleTxt2 = nock('https://' + exampleData.domain)
    .get('/ripple.txt')
    .reply(200, rippleTxtRes, {
      'Content-Type': 'text/plain'
    }); 
    
  mockAuthSign = nock('https://auth1.ripple.com')
    .persist()
    .post('/api/sign')
    .reply(200, signRes, {
      'Content-Type': 'text/plain'
    });   
 
  mockRegister = nock('https://id.staging.ripple.com');
  mockRegister.filteringPath(/(v1\/user\?signature(.+))/g, 'register/')
    .post('/register/')
    .reply(200, { result: 'error', message: 'User already exists' }, {
      'Content-Type': 'application/json'
    });   

  mockDelete = nock('https://id.staging.ripple.com');
  mockDelete.filteringPath(/(v1\/user\/(.+))/g, 'delete/')
    .delete('/delete/')
    .reply(200, { result: 'success' }, {
      'Content-Type': 'application/json'
    });  
            
  mockBlob = nock('https://id.staging.ripple.com');
  mockBlob.get('/v1/authinfo?domain=' + exampleData.domain + '&username=' + exampleData.username.toLowerCase())
    .reply(200, JSON.stringify(authInfoRes.body), {
      'Content-Type': 'application/json'
    });   
    
  mockBlob.get('/v1/authinfo?domain=' + exampleData.domain + '&username=' + exampleData.new_username.toLowerCase())
    .reply(200, JSON.stringify(authInfoNewUsernameRes.body), {
      'Content-Type': 'application/json'
    });   
    
  mockBlob.filteringPath(/(blob\/.+)/g, 'blob/')
    .persist()
    .get('/v1/blob/')
    .reply(200, JSON.stringify(blobRes.body), {
      'Content-Type': 'application/json'
    });    

  mockRename = nock('https://id.staging.ripple.com/v1/user/');
  mockRename.filteringPath(/((.+)\/rename(.+))/g, 'rename/')
    .post('rename/')
    .reply(200, {result:'success',message:'rename'}, {
      'Content-Type': 'application/json'
    });  
  
  mockUpdate = nock('https://id.staging.ripple.com/v1/user/');
  mockUpdate.filteringPath(/((.+)\/updatekeys(.+))/g, 'update/')
    .post('update/')
    .reply(200, {result:'success',message:'updateKeys'}, {
      'Content-Type': 'application/json'
    });  
    
  mockRecover = nock('https://id.staging.ripple.com/')
  mockRecover.filteringPath(/((.+)user\/recov\/(.+))/g, 'recov/')
    .get('recov/')
    .reply(200, recoverRes.body, {
      'Content-Type': 'application/json'
    });  
       
  mockVerify = nock('https://id.staging.ripple.com/v1/user/');
  mockVerify.filteringPath(/((.+)\/verify(.+))/g, 'verify/')
    .get('verify/')
    .reply(200, {result:'error', message:'invalid token'}, {
      'Content-Type': 'application/json'
    });                     

  mockEmail = nock('https://id.staging.ripple.com/v1/user');
  mockEmail.filteringPath(/((.+)\/email(.+))/g, 'email/')
    .post('email/')
    .reply(200, {result:'success'}, {
      'Content-Type': 'application/json'
    });  
}

describe('Ripple Txt', function () {
  it('should get the content of a ripple.txt file from a given domain', function(done) {
    RippleTxt.get(exampleData.domain, function(err, resp) {
      assert.ifError(err);
      assert.strictEqual(typeof resp, 'object');
      done();
    });
  });
  
  it('should get currencies from a ripple.txt file for a given domain', function(done) {
    RippleTxt.getCurrencies(exampleData.domain, function(err, currencies) {
      assert.ifError(err);
      assert(Array.isArray(currencies));
      done();
    });
  });
  
  it('should get the domain from a given url', function() {
    var domain = RippleTxt.extractDomain("http://www.example.com");
    assert.strictEqual(typeof domain, 'string');
  });  
});

describe('AuthInfo', function() {  
  it('should get auth info', function(done) {
    AuthInfo.get(exampleData.domain, exampleData.username, function(err, resp) {
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
      client.login(exampleData.username, exampleData.password, exampleData.device_id, function(err, resp) {
        if (online) {
          assert.ifError(err);
          assert.strictEqual(typeof resp, 'object');
          assert(resp.blob instanceof Blob);
          assert.strictEqual(typeof resp.blob.id, 'string');
          assert(UInt256.from_json(resp.blob.id).is_valid());
          assert.strictEqual(typeof resp.blob.key, 'string');
          assert(UInt256.from_json(resp.blob.key).is_valid());
          assert.strictEqual(typeof resp.username, 'string');
          assert.strictEqual(typeof resp.verified, 'boolean');
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
      client.relogin(exampleData.blob.url, exampleData.id, exampleData.crypt, exampleData.device_id, function(err, resp) {
        assert.ifError(err);
        assert.strictEqual(typeof resp, 'object');
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
          assert.strictEqual(typeof resp, 'object');
          assert.strictEqual(typeof resp.keys, 'object');
          assert.strictEqual(typeof resp.keys.unlock, 'string');
          assert(UInt256.from_json(resp.keys.unlock).is_valid());
        } else {
          assert.strictEqual(err.toString(), 'CORRUPT: ccm: tag doesn\'t match');
          assert.strictEqual(resp, void(0));
        }
        
        done();
      });
    });
  });

  describe('#loginAndUnlock', function () {
    it('should get the decrypted blob and decrypted secret given name and password', function (done) {
      this.timeout(10000);
      client.loginAndUnlock(exampleData.username, exampleData.password, exampleData.device_id, function(err, resp) {
        if (online) {
          assert.ifError(err);
          assert.strictEqual(typeof resp, 'object');
          assert(resp.blob instanceof Blob);
          assert.strictEqual(typeof resp.blob.id, 'string');
          assert(UInt256.from_json(resp.blob.id).is_valid());
          assert.strictEqual(typeof resp.blob.key, 'string');
          assert(UInt256.from_json(resp.blob.key).is_valid());
          assert.strictEqual(typeof resp.unlock, 'string');
          assert(UInt256.from_json(resp.unlock).is_valid());
          assert.strictEqual(typeof resp.secret, 'string');
          assert.strictEqual(typeof resp.username, 'string');
          assert.strictEqual(typeof resp.verified, 'boolean');
        } else {
          assert(err instanceof Error);
          assert.strictEqual(resp, void(0));
        }
        done();
      });
    });
  });
 
  describe('#register', function () {
    it('should create a new blob', function (done) {
      this.timeout(10000);
      var options = {
        username     : exampleData.username,
        password     : exampleData.password,
        email        : exampleData.blob.data.email,
        activateLink : exampleData.activateLink
      }
      
      client.register(options, function(err, resp) {
        
        //fails, user already exists
        assert(err instanceof Error);
        assert.strictEqual(resp, void(0));
        done();
      });
    });
  });


  describe('#deleteBlob', function () {
    it('should remove an existing blob', function (done) {
      this.timeout(10000);
      
      var options = {
        url         : exampleData.blob.url,
        blob_id     : exampleData.blob.id,
        username    : online ? "" : exampleData.username,
        account_id  : exampleData.blob.data.account_id,
        masterkey   : exampleData.masterkey
      }
      
      client.deleteBlob(options, function(err, resp) {
        if (online) {
          //removing the username will result in an error from the server
          assert(err instanceof Error);
          assert.strictEqual(resp, void(0));  
        } else {
          assert.ifError(err);  
          assert.strictEqual(typeof resp, 'object');
          assert.strictEqual(typeof resp.result,  'string');          
        }
        done();
      });
    });
  });

/*  
  describe('#updateProfile', function () {
    it('should update profile parameters associated with a blob', function (done) {
      this.timeout(10000);
      
      var options = {
        url         : exampleData.blob.url,
        blob_id     : exampleData.blob.id,
        username    : exampleData.username,
        auth_secret : exampleData.blob.data.auth_secret,
        profile : {
          city : "San Francisco",
          phone : "555-555-5555"
        }
      }
      
      client.updateProfile(options, function(err, resp) {
        assert.ifError(err);  
        assert.strictEqual(typeof resp, 'object');
        assert.strictEqual(typeof resp.result,  'string');
        done();
      });
    });
  });  
*/    
  
});


describe('Blob', function () {
  var client;
  var resp;

  client = new VaultClient({ domain: exampleData.domain });

  before(function(done) {
    if (online) {
      this.timeout(10000);
  
      client.login(exampleData.username, exampleData.password, exampleData.device_id, function(err, res) {
        resp = res;
        blob = res.blob;
        done();
      });
    } else { 
       
      mockBlob.filteringPath(/(blob\/.+)/g, 'blob/')
        .persist()
        .post('/v1/blob/')
        .reply(200, {result:'success'}, {
          'Content-Type': 'application/json'
        });        
 
      done();
    }
  });

  describe('#rename', function () {
    it('should change the username of a blob', function (done) {
      this.timeout(20000);

      var options = {
        username     : exampleData.username,
        new_username : exampleData.new_username,
        password     : exampleData.password,
        masterkey    : exampleData.masterkey,
        blob         : blob
      }
      
       
      client.rename(options, function(err, resp) {
        assert.ifError(err);
        assert.strictEqual(typeof resp, 'object');
        assert.strictEqual(typeof resp.result,  'string');
        assert.strictEqual(typeof resp.message, 'string');
        
        if (online) {  
          options.username     = exampleData.new_username;
          options.new_username = exampleData.username;
          
          //change it back
          client.rename(options, function(err,resp){
            assert.ifError(err);
            assert.strictEqual(typeof resp, 'object');
            assert.strictEqual(typeof resp.result,  'string');
            assert.strictEqual(typeof resp.message, 'string');
            done();
          });
          
        } else {
          done();
        }
      });
    });
  });  
   
  describe('#changePassword', function () {
    it('should change the password and keys of a blob', function (done) {
      this.timeout(10000);

      var options = {
        username     : exampleData.username,
        password     : exampleData.password,
        masterkey    : exampleData.masterkey,
        blob         : blob
      }
        
      client.changePassword(options, function(err, resp) {
        assert.ifError(err);
        assert.strictEqual(typeof resp, 'object');
        assert.strictEqual(typeof resp.result,  'string');
        assert.strictEqual(typeof resp.message, 'string');    
        done();
      });
    });
  });  
  
  describe('#recoverBlob', function () {
    it('should recover the blob given a username and secret', function (done) {
      this.timeout(10000);

      var options = {
        url       : exampleData.blob.url,  
        username  : exampleData.username,
        masterkey : exampleData.masterkey,
      }
        
      client.recoverBlob(options, function(err, blob) {
        assert.ifError(err);
        assert(blob instanceof Blob);   
        done();
      });
    });
  }); 
 
  describe('#verifyEmail', function () {
    it('should verify an email given a username and token', function (done) {
      this.timeout(10000);

      client.verify(exampleData.username, exampleData.email_token, function(err, resp) {
        //result will be error, because of invalid token
        assert(err instanceof Error);
        assert.strictEqual(resp, void(0));
        done();
      });
    });
  }); 
  
  describe('#resendVerifcationEmail', function () {
    it('should resend a verification given options', function (done) {
      this.timeout(10000);

      var options = {
        url          : exampleData.blob.url,
        id           : exampleData.blob.id,
        username     : exampleData.username,
        account_id   : exampleData.blob.data.account_id,
        email        : exampleData.blob.data.email,
        activateLink : exampleData.activateLink,
        masterkey    : exampleData.masterkey
      }
      client.resendEmail(options, function(err, resp) {
        assert.ifError(err);  
        assert.strictEqual(typeof resp, 'object');
        assert.strictEqual(typeof resp.result,  'string');
        done();
      });
    });
  });   
  
  it('#set', function(done) {
    this.timeout(10000)
    blob.extend('/testObject', {
      foo: [],
    }, function(err, resp) {

      assert.ifError(err);
      assert.strictEqual(resp.result, 'success');
      done();
    });
  });

  it('#extend', function(done) {
    this.timeout(10000)
    blob.extend('/testObject', {
      foobar: 'baz',
    }, function(err, resp){
      assert.ifError(err);
      assert.strictEqual(resp.result, 'success');
      done();
    });
  });

  it('#unset', function(done) {
    this.timeout(10000)
    blob.unset('/testObject', function(err, resp){
      assert.ifError(err);
      assert.strictEqual(resp.result, 'success');
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
      assert.strictEqual(resp.result, 'success');
      done();
    });
  });

  it('#filter', function(done) {
    this.timeout(10000)

    blob.filter('/testArray', 'name', 'bob', 'extend', '', {description:'Alice'}, function(err, resp){
      assert.ifError(err);
      assert.strictEqual(resp.result, 'success');
      done();
    });
  });

  it('#consolidate', function(done) {
    this.timeout(10000)
    blob.unset('/testArray', function(err, resp){
      assert.ifError(err);
      assert.strictEqual(resp.result, 'success');
      blob.consolidate(function(err, resp){
        assert.ifError(err);
        assert.strictEqual(resp.result, 'success');
        done();
      });
    });
  });  

  describe('identity', function() {
    it('#identity_set', function (done) {
      this.timeout(10000);

      blob.identity.set('address', exampleData.unlock, {city:"San Francisco", region:"CA"}, function (err, resp) {
        assert.ifError(err);
        assert.strictEqual(resp.result, 'success');
        done();          
      });
    });  

    it('#identity_get', function () {
      var property = blob.identity.get('address', exampleData.unlock);
      assert.ifError(property.error);   
      assert.strictEqual(typeof property.encrypted, 'boolean');     
      assert.notEqual(typeof property.value, 'undefined');  
    });      

    it('#identity_getAll', function () {
      var obj = blob.identity.getAll(exampleData.unlock);  
      assert.strictEqual(typeof obj, 'object');       
    }); 

    it('#identity_getFullAddress', function () {
      var address = blob.identity.getFullAddress(exampleData.unlock);  
      assert.strictEqual(typeof address, 'string');       
    });      

    it('#identity_unset', function (done) {
      this.timeout(10000);

      blob.identity.unset('name', exampleData.unlock, function (err, resp) {
        assert.ifError(err);
        assert.strictEqual(resp.result, 'success');
        done();          
      });
    });      
  });

  describe('identityVault', function() {
    it('#identity - Get Attestation', function (done) {
      var options = {
        url         : blob.url,
        auth_secret : blob.data.auth_secret,
        blob_id     : blob.id,
      };
      
      options.type = 'identity';
      
      nock('https://id.staging.ripple.com')
        .filteringPath(/(v1\/attestation\/identity(.+))/g, '')
        .post('/')
        .reply(200, {
          result: 'success', 
          status: 'verified', 
          attestation: 'eyJ6IjoieiJ9.eyJ6IjoieiJ9.sig', 
          blinded:'eyJ6IjoieiJ9.eyJ6IjoieiJ9.sig'
        },  {'Content-Type': 'application/json'}); 
      
      client.getAttestation(options, function(err, resp) {
        assert.ifError(err);
        assert.strictEqual(resp.result, 'success');
        assert.strictEqual(typeof resp.attestation, 'string'); 
        assert.strictEqual(typeof resp.blinded, 'string'); 
        assert.deepEqual(resp.decoded, {"header":{"z":"z"},"payload":{"z":"z"},"signature":"sig"})
        done();
      });
    });
    
    it('#identity - Update Attestation', function (done) {

      var options = {
        url         : blob.url,
        auth_secret : blob.data.auth_secret,
        blob_id     : blob.id,
      };
      
      options.type = 'identity';
      
      nock('https://id.staging.ripple.com')
        .filteringPath(/(v1\/attestation\/identity\/update(.+))/g, '')
        .post('/')
        .reply(200, {
          result: 'success', 
          status: 'verified', 
          attestation: 'eyJ6IjoieiJ9.eyJ6IjoieiJ9.sig', 
          blinded:'eyJ6IjoieiJ9.eyJ6IjoieiJ9.sig'
        },  {'Content-Type': 'application/json'});       
      
      client.updateAttestation(options, function(err, resp) {
        assert.ifError(err);
        assert.strictEqual(resp.result, 'success');
        assert.strictEqual(typeof resp.attestation, 'string'); 
        assert.strictEqual(typeof resp.blinded, 'string'); 
        assert.deepEqual(resp.decoded, {"header":{"z":"z"},"payload":{"z":"z"},"signature":"sig"})
        done();
      });
    }); 
        
    it('#identity - Get Attestation Summary', function (done) {

      var options = {
        url         : blob.url,
        auth_secret : blob.data.auth_secret,
        blob_id     : blob.id,
      };
      
      nock('https://id.staging.ripple.com')
        .filteringPath(/(v1\/attestation\/summary(.+))/g, '')
        .get('/')
        .reply(200, {
          result: 'success', 
          attestation: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjY2ZGI3MzgxIn0%3D.eyJwcm9maWxlX3ZlcmlmaWVkIjpmYWxzZSwiaWRlbnRpdHlfdmVyaWZpZWQiOmZhbHNlLCJpc3MiOiJodHRwczovL2lkLnJpcHBsZS5jb20iLCJzdWIiOiIwNDMzNTA0ZS0yYTRmLTQ1NjktODQwMi1lYWI2YTU0YTgzYjUiLCJleHAiOjE0MTI4MTc2NjksImlhdCI6MTQxMjgxNTgwOX0%3D.Jt14Y2TsM7fKqGWn0j16cPldlYqRr7%2F2dptBsdZuZhRGRTREO4TSpZZhBaU95WL3M9eXIfaoSs8f2pTOa%2BBGAYHZSZK4%2FLqeWdDH8zz8Bx9YFqGije1KmHQR%2FeoWSp1GTEfcq5Oho4nSHozHhGNN8IrDkl8woMvWb%2FE1938Y5Zl2vyv7wjlNUF4ND33XWzJkvQjzIK15uYfaB%2FUIsNW32udfHAdkigesdMDNm%2BRGBqHMDZeAMdVxzrDzE3m8oWKDMJXbcaLmk75COfJrLWYiZCHd7VcReyPEZegwEucetZJ9uDnoBcvw0%2B6hIRmjTN6Gy1eeBoJaiDYsWuOwInbIlw%3D%3D', 
        },  {'Content-Type': 'application/json'});       
      
      client.getAttestationSummary(options, function(err, resp) {
        assert.ifError(err);
        assert.strictEqual(resp.result, 'success');
        assert.strictEqual(typeof resp.attestation, 'string'); 
        assert.strictEqual(typeof resp.decoded.header, 'object'); 
        assert.strictEqual(typeof resp.decoded.payload, 'object'); 
        assert.strictEqual(typeof resp.decoded.signature, 'string'); 
        done();
      });
    });            
  });
    
  //only do these offline
  if (!online) {
  
    describe('2FA', function() {

    it('#2FA_set2FA', function (done) {
      blob.set2FA({masterkey:exampleData.masterkey}, function(err, resp){
        assert.ifError(err);  
        assert.strictEqual(typeof resp, 'object');
        assert.strictEqual(typeof resp.result,  'string');
        done();    
      });  
    }); 
    
    it('#2FA_get2FA', function (done) {
      blob.get2FA(function(err, resp) {
        assert.ifError(err);  
        assert.strictEqual(typeof resp, 'object');
        assert.strictEqual(typeof resp.result,  'string');
        done();
      });
    }); 
    
      it('#2FA_requestToken', function (done) {
        client.requestToken(exampleData.blob.url, exampleData.blob.id, function(err, resp){
          assert.ifError(err);  
          assert.strictEqual(typeof resp, 'object');
          assert.strictEqual(typeof resp.result,  'string');
          done();
        });
      });       

      it('#2FA_verifyToken', function (done) {
        var options = {
          url         : exampleData.blob.url,
          id          : exampleData.blob.id,
          device_id   : client.generateDeviceID(),
          token       : "5555",
          remember_me : true
         }

        client.verifyToken(options, function(err, resp){
          assert.ifError(err);  
          assert.strictEqual(typeof resp, 'object');
          assert.strictEqual(typeof resp.result,  'string');
          done();          
        });
      });     
    });
  }
  
  if (!online) {
    after(function () {
      nock.restore();
    });
  }
});
