/* eslint-disable no-var */
'use strict';

var fs = require('fs');
var ripple = require('../dist/npm')._DEPRECATED;
var Amount = ripple.Amount;
var Ledger = ripple.Ledger;

function parse_options(from, flags) {
  var argv = from.slice();
  var opts_ = {argv: argv};

  flags.forEach(function(f) {
    // Do we have the flag?
    var flag_index = argv.indexOf('--' + f);
    // normalize the name of the flag
    var flag = f.replace('-', '_');
    // opts_ has Boolean value for normalized flag key
    opts_[flag] = flag_index !== -1;
    if (opts_[flag]) {
      // remove the flag from the argv
      argv.splice(flag_index, 1);
    }
  });
  return opts_;
}

var opts = parse_options(process.argv.slice(2), // remove `node` and `this.js`
                        ['sanity-test']);

if (opts.argv.length < 1) {
  console.error('Usage: scripts/verify_ledger_json path/to/ledger.json');
  console.error('       optional: --sanity-test (json>binary>json>binary)');
  process.exit(1);
}

var json = fs.readFileSync(opts.argv[0], 'utf-8');
var ledger = Ledger.from_json(JSON.parse(json));

// This will serialize each accountState object to binary and then back to json
// before finally serializing for hashing. This is mostly to expose any issues
// with ripple-libs binary <--> json codecs.
if (opts.sanity_test) {
  console.log('All accountState nodes will be processed from ' +
              'json->binary->json->binary. This may take some time ' +
              'with large ledgers.');
}

// To recompute the hashes of some ledgers, we must allow values that slipped in
// before strong policies were in place.
Amount.strict_mode = false;

console.log('Transaction hash in header:    ' +
             ledger.ledger_json.transaction_hash);
console.log('Calculated transaction hash:   ' +
             ledger.calc_tx_hash().to_hex());

console.log('Account state hash in header:  ' +
             ledger.ledger_json.account_hash);

if (ledger.ledger_json.accountState) {
  console.log('Calculated account state hash: ' +
               ledger.calc_account_hash({sanity_test: opts.sanity_test})
                                                      .to_hex());
} else {
  console.log('Ledger has no accountState');
}
