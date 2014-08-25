var assert = require('assert');
var utils  = require('./testutils');
var Seed   = utils.load_module('seed').Seed;
var config = require('./testutils').get_config();

describe('Seed', function() {
  it('can generate many addresses', function () {
    var seed = Seed.from_json("masterpassphrase");

    var test_data = [
      // Format:
      // [passphrase, address, nth-for-seed, expected-public-key]
      ["masterpassphrase", "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", 0,
       "0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020"],
      ["masterpassphrase", "r4bYF7SLUMD7QgSLLpgJx38WJSY12ViRjP", 1,
       "02CD8C4CE87F86AAD1D9D18B03DE28E6E756F040BD72A9C127862833EB90D60BAD"],
      ["masterpassphrase", "rLpAd4peHUMBPbVJASMYK5GTBUSwXRD9nx", 2,
       "0259A57642A6F4AEFC9B8062AF453FDEEEAC5572BA602BB1DBD5EF011394C6F9FC"],
      ["otherpassphrase", "rpe3YWSVwGU2PmUzebAPg2deBXHtmba7hJ", 0,
       "022235A3DB2CAE57C60B7831929611D58867F86D28C0AD3C82473CC4A84990D01B"],
      ["otherpassphrase", "raAPC2gALSmsTkXR4wUwQcPgX66kJuLv2S", 5,
       "03F0619AFABE08D22D98C8721895FE3673B6174168949976F2573CE1138C124994"],
      ["yetanotherpassphrase", "rKnM44fS48qrGiDxB5fB5u64vHVJwjDPUo", 0,
       "0385AD049327EF7E5EC429350A15CEB23955037DE99660F6E70C11C5ABF4407036"],
      ["yetanotherpassphrase", "rMvkT1RHPfsZwTFbKDKBEisa5U4d2a9V8n", 1,
       "023A2876EA130CBE7BBA0573C2DB4C4CEB9A7547666915BD40366CDC6150CF54DC"]
    ];

    function assert_helper(seed_json, address_or_nth, expected) {
      var seed = Seed.from_json(seed_json);
      var keypair = seed.get_key(address_or_nth);
      assert.strictEqual(keypair.to_hex_pub(),
                         expected);
    }
    for (var nth = 0; nth < test_data.length; nth++) {
      var seed_json = test_data[nth][0];
      var address = test_data[nth][1];
      var nth_for_seed = test_data[nth][2];
      var expected = test_data[nth][3];

      //`seed.get_key($ripple_address)` is arguably an ill concieved feature
      // as it needs to generate `nth` many keypairs and generate hashed public
      // keys (addresses) for equality tests ??
      // Would need remote.set_secret(address, private_key_not_seed) ??
      assert_helper(seed_json, address, expected);

      // This isn't too bad as it only needs to generate one keypair `seq`
      assert_helper(seed_json, nth_for_seed, expected);
    };
  });
});

// vim:sw=2:sts=2:ts=8:et
