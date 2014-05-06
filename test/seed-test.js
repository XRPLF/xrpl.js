var assert = require('assert');
var utils  = require('./testutils');
var Seed   = utils.load_module('seed').Seed;
var config = require('./testutils').get_config();

describe('Seed', function() {
  it('can generate many addresses', function () {
    var seed = Seed.from_json("masterpassphrase");

    // Note: Created with jRippleAPI code
    // Link: https://github.com/pmarches/jRippleAPI/blob/master/src/jrippleapi/keys/RippleDeterministicKeyGenerator.java

    // To reviewer/merger: Even generating keypairs for thi this small amount of
    // addresses makes the test suite run SO SLOW. Consider cutting at the tail.
    var first_nth_addresses = [
          // 0th implied
          "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
          // 1th implied
          "r4bYF7SLUMD7QgSLLpgJx38WJSY12ViRjP",
          // 2th implied
          "rLpAd4peHUMBPbVJASMYK5GTBUSwXRD9nx",
          // ...
          "rN9HWHPAftXC6xNxJRqgVr1HexpUi6FBUa",
          "rhwPfeEkeQh2vqoKGPBpPyS9nKmKZdpypu",
          "rKdNfPfrzfisDCPCqK67YhDLezuVKGKXNm",
          "rsn4NeGzMRvMn5ABQxmt9VNEkSknVneBK4",
          "rUSJGFH1kQnaKpoAhkArfyw6HZVe8GT5w3",
          "r3EYp6isx2Row5pu19C4Ujvp68oEEabhuA",
          "rGiYpnAn9DTXiM78CCJcYAuL6QHEDdazHA",
          "rVrRVeqqEJHAove5B9TqBAHEXBTzMi5eu",
          "rJbarThDXYXxtCgDxRoTCDf2NoYdgSjuVk",
          "rfuWNJ1TkQzoZZcc4K8wmtsUiGwURFbed1",
          "rpuTqebfbZZdKEUV3bjecoViNL4W4gepWZ",
          "r42ywHUco4C2AjgaSmYM7uX13Kbz6GdDKp",
          "rnWb45MLd5hQiB6Arr94DdY2z95quL7XNf",
          "rMukaQ87bfAeddcT16RtgS3RbFmaQWrSGu",
          "rN6dMHU51K9y8eVMhjQMsQVp5gPwt3eYYx",
          "rfRFyeJDNqpfZVFmjNj9tNzFVsCNAWKtNc",
          "rMoGSX48KrT31HKx9KfMSnYhjvRw3YYzQW",
          "rfTiEfbeVsYU7QEe1Zfogiz7h43x6ChKGC"
    ]

    function assert_helper(account_id, expected) {
      var keypair = seed.get_key(account_id);
      assert.strictEqual(keypair.get_address().to_json(),
                         expected);
    }
    for (var nth = 0; nth < first_nth_addresses.length; nth++) {
      var expected = first_nth_addresses[nth], looking_for;

      //`seed.get_key($ripple_address)` is arguably an ill concieved feature
      // as it needs to generate `nth` many keypairs and generate hashed public
      // keys (addresses) for equality tests ??
      // Would need remote.set_secret(address, private_key_not_seed) ??
      assert_helper((looking_for = expected), expected)

      // This isn't too bad as it only needs to generate one keypair `seq`
      assert_helper((looking_for = nth), expected)
    };
  });
});

// vim:sw=2:sts=2:ts=8:et
