var fs = require('fs');
var Ledger = require('../src/js/ripple/ledger').Ledger;

if (process.argc < 1) {
  console.error("Usage: scripts/verify_ledger_json path/to/ledger.json");
  process.exit(1);
}

var json = fs.readFileSync(process.argv[2], 'utf-8');
var ledger = Ledger.from_json(JSON.parse(json));

// This will serialize each accountState object to binary and then back to json
// before finally serializing for hashing. This is mostly for verifying that
// ripple-libs binary codecs are working.
// Must obviously go after process.argv[2] used to specify ledger json
var hardcore = ~process.argv.indexOf('--hardcore')

console.log("Transaction hash in header:  "+ledger.ledger_json.transaction_hash);
console.log("Calculated transaction hash: "+ledger.calc_tx_hash().to_hex());



console.log("Account state hash in header:  "+ledger.ledger_json.account_hash);
hardcore && console.log("Standby, we are going hardcore!, this may take some time");
console.log("Calculated account state hash: "+ledger.calc_account_hash(hardcore).to_hex());
