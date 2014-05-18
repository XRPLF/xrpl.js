var fs = require('fs');
var Ledger = require('../src/js/ripple/ledger').Ledger;

function parse_options(from, flags) {
  var argv = from.slice(),
      opts = {argv:argv};

  flags.forEach(function(f) {
    // Do we have the flag?
    var flag_index = argv.indexOf('--' + f);
    // normalize the name of the flag
    f = f.replace('-', '_');
    // opts has Boolean value for normalized flag key
    opts[f] = !!~flag_index;
    if (opts[f]) {
      // remove the flag from the argv
      argv.splice(flag_index, 1);
    }
  });
  return opts;
}

var opts = parse_options(process.argv.slice(2), // remove `node` and `this.js`
                        ['sanity-test']);

if (opts.argv.length < 1) {
  console.error("Usage: scripts/verify_ledger_json path/to/ledger.json");
  console.error("       optional: --sanity-test (json>binary>json>binary)");
  process.exit(1);
}

var json = fs.readFileSync(opts.argv[0], 'utf-8');
var ledger = Ledger.from_json(JSON.parse(json));

// This will serialize each accountState object to binary and then back to json
// before finally serializing for hashing. This is mostly to expose any issues
// with ripple-libs binary <--> json codecs.
if (opts.sanity_test) {
    console.log("All accountState nodes will be processed from " +
                "json->binary->json->binary. This may take some time " +
                "with large ledgers.");
}

console.log("Transaction hash in header:    " + ledger.ledger_json.transaction_hash);
console.log("Calculated transaction hash:   " + ledger.calc_tx_hash().to_hex());
console.log("Account state hash in header:  " + ledger.ledger_json.account_hash);
console.log("Calculated account state hash: " + ledger.calc_account_hash(
                                                 {sanity_test:opts.sanity_test})
                                                   .to_hex());
