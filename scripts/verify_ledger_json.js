var fs = require('fs');
var Ledger = require('../src/js/ripple/ledger').Ledger;

if (process.argc < 1) {
  console.error("Usage: scripts/verify_ledger_json path/to/ledger.json");
  process.exit(1);
}

var json = fs.readFileSync(process.argv[2], 'utf-8');
var ledger = Ledger.from_json(JSON.parse(json));

console.log("Calculated transaction hash: "+ledger.calc_tx_hash().to_hex())
console.log("Transaction hash in header:  "+ledger.ledger_json.transaction_hash);

