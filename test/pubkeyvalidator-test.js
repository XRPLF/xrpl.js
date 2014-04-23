var assert = require('assert');
var PubKeyValidator = require('../src/js/ripple/pubkeyvalidator');

describe('PubKeyValidator', function(){

  describe('._parsePublicKey()', function(){

    var pkv = new PubKeyValidator({});

    it('should throw an error if the key is invalid', function(){
      try {
        pkv._parsePublicKey('not a real key');
      } catch (e) {
        assert(e);
      }
    });

    it('should return unchanged a valid UINT160', function(){
      assert('rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz' === pkv._parsePublicKey('rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz'));
    });

    it('should parse a hex-encoded public key as a UINT160', function(){
      assert('rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz' === pkv._parsePublicKey('025B32A54BFA33FB781581F49B235C0E2820C929FF41E677ADA5D3E53CFBA46332'));
    
      assert('rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM' === pkv._parsePublicKey('03BFA879C00D58CF55F2B5975FF9B5293008FF49BEFB3EE6BEE2814247BF561A23'));
    
      assert('rP4yWwjoDGF2iZSBdAQAgpC449YDezEbT1' === pkv._parsePublicKey('02DF0AB18930B6410CA9F55CB37541F1FED891B8EDF8AB1D01D8F23018A4B204A7'));
    });

  });

  describe('.validate()', function(){

    it('should respond true if the public key corresponds to the account address and the master key IS NOT disabled', function(){

      var pkv = new PubKeyValidator({
        account: function(address){
          return {
            getInfo: function(callback) {
              if (address === 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz') {
                callback(null, { account_data: { 
                  Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
                  Flags: 65536,
                  LedgerEntryType: 'AccountRoot'
                }});
              }
            }
          }
        }
      });
      pkv.validate('rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz', '025B32A54BFA33FB781581F49B235C0E2820C929FF41E677ADA5D3E53CFBA46332', function(err, is_valid){
        assert(err === null);
        assert(is_valid === true);
      });

    });

    it('should respond false if the public key corresponds to the account address and the master key IS disabled', function(){

      var pkv = new PubKeyValidator({
        account: function(address){
          return {
            getInfo: function(callback) {
              if (address === 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz') {
                callback(null, { account_data: { 
                  Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
                  Flags: parseInt(65536 | 0x00100000),
                  LedgerEntryType: 'AccountRoot'
                }});
              }
            }
          }
        }
      });
      pkv.validate('rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz', '025B32A54BFA33FB781581F49B235C0E2820C929FF41E677ADA5D3E53CFBA46332', function(err, is_valid){
        assert(err === null);
        assert(is_valid === false);
      });

    });

    it('should respond true if the public key corresponds to the regular key', function(){

      var pkv = new PubKeyValidator({
        account: function(address){
          return {
            getInfo: function(callback) {
              if (address === 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz') {
                callback(null, { account_data: { 
                  Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
                  Flags: parseInt(65536 | 0x00100000),
                  LedgerEntryType: 'AccountRoot',
                  RegularKey: 'rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r'
                }});
              }
            }
          }
        }
      });
      pkv.validate('rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz', '02BE53B7ACBB0900E0BB7729C9CAC1033A0137993B17800BD1191BBD1B29D96A8C', function(err, is_valid){
        assert(err === null);
        assert(is_valid === true);
      });

    });

    it('should respond false if the public key does not correspond to an active public key for the account', function(){

      var pkv = new PubKeyValidator({
        account: function(address){
          return {
            getInfo: function(callback) {
              if (address === 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz') {
                callback(null, { account_data: { 
                  Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
                  Flags: parseInt(65536 | 0x00100000),
                  LedgerEntryType: 'AccountRoot',
                  RegularKey: 'rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r'
                }});
              }
            }
          }
        }
      });
      pkv.validate('rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz', '032ECDA93970BC7E8872EF6582CB52A5557F117244A949EB4FA8AC7688CF24FBC8', function(err, is_valid){
        assert(err === null);
        assert(is_valid === false);
      });

    });

    it('should respond false if the public key is invalid', function(){

      var pkv = new PubKeyValidator({
        account: function(address){
          return {
            getInfo: function(callback) {
              if (address === 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz') {
                callback(null, { account_data: { 
                  Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
                  Flags: parseInt(65536 | 0x00100000),
                  LedgerEntryType: 'AccountRoot',
                  RegularKey: 'rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r'
                }});
              }
            }
          }
        }
      });
      pkv.validate('rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz', 'not a real public key', function(err, is_valid){
        assert(err);
      });

    });

  });
});