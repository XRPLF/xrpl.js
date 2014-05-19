var assert    = require('assert');
var RippleTxt = require('../src/js/ripple/rippletxt');


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
});    
