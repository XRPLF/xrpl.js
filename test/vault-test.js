var assert    = require('assert');
var RippleTxt = require('../src/js/ripple/rippletxt');
var AuthInfo  = require('../src/js/ripple/authinfo');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";  //must be set for self signed certs

describe('Vault Client', function() {

  describe('Ripple Txt', function() {

    it('should get the context of a ripple.txt file from a given domain', function(done){
      var rt = new RippleTxt();
      rt.get("ripple.com", function(err, resp){
        assert.ifError(err);
        assert.equal(typeof resp, 'object');
        done();
      });
    });
  });
  
  
  describe('AuthInfo', function() {
    var auth = new AuthInfo();
    it ('should', function(done){
      auth.get("staging.ripple.com", "testUser", function(err, resp){
        assert.ifError(err);
        assert.equal(typeof resp, 'object');
        done();
      }); 
    }); 
  });
});    
