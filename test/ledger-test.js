var assert           = require('assert');
var fs               = require('fs');

var utils            = require('./testutils');
var Ledger = utils.load_module('ledger').Ledger;
var config = require('./testutils').get_config();

/**
* @param ledger_index {Number}
* Expects a corresponding ledger dump in $repo/test/fixtures/ folder
*/
create_ledger_test = function (ledger_index) {
  describe(String(ledger_index), function () {

    var path = __dirname + '/fixtures/ledger-full-'+ledger_index+'.json';

    var ledger_raw   = fs.readFileSync(path),
        ledger_json  = JSON.parse(ledger_raw),
        ledger       = Ledger.from_json(ledger_json);

    it('has account_hash of '+ ledger_json.account_hash, function() {
      assert.equal(ledger_json.account_hash,
                   ledger.calc_account_hash({sanity_test:true}).to_hex());
    })
    it('has transaction_hash of '+ ledger_json.transaction_hash, function() {
      assert.equal(ledger_json.transaction_hash,
                   ledger.calc_tx_hash().to_hex());
    })
  })
}

describe('Ledger', function() {
  // This is the first recorded ledger with a non empty transaction set
  create_ledger_test(38129);
  // Because, why not.
  create_ledger_test(40000);
});

// vim:sw=2:sts=2:ts=8:et
