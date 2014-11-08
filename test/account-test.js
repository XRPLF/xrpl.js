var assert = require('assert');
var Account = require('../src/js/ripple/account').Account;

describe('Account', function(){

  describe('#_publicKeyToAddress()', function(){

    it('should throw an error if the key is invalid', function(){
      try {
        Account._publicKeyToAddress('not a real key');
      } catch (e) {
        assert(e);
      }
    });

    it('should return unchanged a valid UINT160', function(){
      assert('rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz' === Account._publicKeyToAddress('rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz'));
    });

    it('should parse a hex-encoded public key as a UINT160', function(){
      assert('rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz' === Account._publicKeyToAddress('025B32A54BFA33FB781581F49B235C0E2820C929FF41E677ADA5D3E53CFBA46332'));
    
      assert('rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM' === Account._publicKeyToAddress('03BFA879C00D58CF55F2B5975FF9B5293008FF49BEFB3EE6BEE2814247BF561A23'));
    
      assert('rP4yWwjoDGF2iZSBdAQAgpC449YDezEbT1' === Account._publicKeyToAddress('02DF0AB18930B6410CA9F55CB37541F1FED891B8EDF8AB1D01D8F23018A4B204A7'));

      assert('rLdfp6eoR948KVxfn6EpaaNTKwfwXhzSeQ' === Account._publicKeyToAddress('0310C451A40CAFFD39D6B8A3BD61BF65BCA55246E9DABC3170EBE431D30655B61F'));
    });

  });

  // XXX: clean up the stubbed out remote methods

  describe('#publicKeyIsActive()', function(){

    it('should respond true if the public key corresponds to the account address and the master key IS NOT disabled', function(){

      var account = new Account({
            on: function(){},
            requestAccountInfo: function(address, callback) {
              if (address === 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz') {
                callback(null, { account_data: { 
                  Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
                  Flags: 65536,
                  LedgerEntryType: 'AccountRoot'
                }});
              }
            }
          }, 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz');
      account.publicKeyIsActive('025B32A54BFA33FB781581F49B235C0E2820C929FF41E677ADA5D3E53CFBA46332', function(err, is_valid){
        assert(err === null);
        assert(is_valid === true);
      });

    });

    it('should respond false if the public key corresponds to the account address and the master key IS disabled', function(){

      var account = new Account({
            on: function(){},
            requestAccountInfo: function(address, callback) {
              if (address === 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz') {
                callback(null, { account_data: { 
                  Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
                  Flags: parseInt(65536 | 0x00100000),
                  LedgerEntryType: 'AccountRoot'
                }});
              }
            }
          }, 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz');
      account.publicKeyIsActive('025B32A54BFA33FB781581F49B235C0E2820C929FF41E677ADA5D3E53CFBA46332', function(err, is_valid){
        assert(err === null);
        assert(is_valid === false);
      });

    });

    it('should respond true if the public key corresponds to the regular key', function(){

      var account = new Account({
            on: function(){},
            requestAccountInfo: function(address, callback) {
              if (address === 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz') {
                callback(null, { account_data: { 
                  Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
                  Flags: parseInt(65536 | 0x00100000),
                  LedgerEntryType: 'AccountRoot',
                  RegularKey: 'rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r'
                }});
              }
            }
          }, 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz');
      account.publicKeyIsActive('02BE53B7ACBB0900E0BB7729C9CAC1033A0137993B17800BD1191BBD1B29D96A8C', function(err, is_valid){
        assert(err === null);
        assert(is_valid === true);
      });

    });

    it('should respond false if the public key does not correspond to an active public key for the account', function(){

      var account = new Account({
            on: function(){},
            requestAccountInfo: function(address, callback) {
              if (address === 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz') {
                callback(null, { account_data: { 
                  Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
                  Flags: parseInt(65536 | 0x00100000),
                  LedgerEntryType: 'AccountRoot',
                  RegularKey: 'rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r'
                }});
              }
            }
          }, 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz');
      account.publicKeyIsActive('032ECDA93970BC7E8872EF6582CB52A5557F117244A949EB4FA8AC7688CF24FBC8', function(err, is_valid){
        assert(err === null);
        assert(is_valid === false);
      });

    });

    it('should respond false if the public key is invalid', function(){

      var account = new Account({
            on: function(){},
            requestAccountInfo: function(address, callback) {
              if (address === 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz') {
                callback(null, { account_data: { 
                  Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
                  Flags: parseInt(65536 | 0x00100000),
                  LedgerEntryType: 'AccountRoot',
                  RegularKey: 'rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r'
                }});
              }
            }
          }, 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz');
      account.publicKeyIsActive('not a real public key', function(err, is_valid){
        assert(err);
      });

    });

    it('should assume the master key is valid for unfunded accounts', function(){

      var account = new Account({
            on: function(){},
            requestAccountInfo: function(address, callback) {
              if (address === 'rLdfp6eoR948KVxfn6EpaaNTKwfwXhzSeQ') {
                callback({ error: 'remoteError',
                  error_message: 'Remote reported an error.',
                  remote:
                   { account: 'rLdfp6eoR948KVxfn6EpaaNTKwfwXhzSeQ',
                     error: 'actNotFound',
                     error_code: 15,
                     error_message: 'Account not found.',
                     id: 3,
                     ledger_current_index: 6391106,
                     request:
                      { account: 'rLdfp6eoR948KVxfn6EpaaNTKwfwXhzSeQ',
                        command: 'account_info',
                        id: 3,
                        ident: 'rLdfp6eoR948KVxfn6EpaaNTKwfwXhzSeQ' },
                     status: 'error',
                     type: 'response' },
                  result: 'remoteError',
                  engine_result: 'remoteError',
                  result_message: 'Remote reported an error.',
                  engine_result_message: 'Remote reported an error.',
                  message: 'Remote reported an error.'
                });
              }
            }
          }, 'rLdfp6eoR948KVxfn6EpaaNTKwfwXhzSeQ');
      account.publicKeyIsActive('0310C451A40CAFFD39D6B8A3BD61BF65BCA55246E9DABC3170EBE431D30655B61F', function(err, is_valid){
        assert(!err);
        assert(is_valid);
      });

    });

  });

});
