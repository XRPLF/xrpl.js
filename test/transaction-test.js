var utils       = require('./testutils');
var assert      = require('assert');
var Transaction = utils.load_module('transaction').Transaction;

describe('Transaction', function() {
  it('Serialization', function() {
    var input_json = {
      Account : "r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
      Amount : {
        currency : "LTC",
        issuer : "r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
        value : "9.985"
      },
      Destination : "r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
      Fee : "15",
      Flags : 0,
      Paths : [
        [
          {
            account : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
            currency : "USD",
            issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
            type : 49,
            type_hex : "0000000000000031"
          },
          {
            currency : "LTC",
            issuer : "rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX",
            type : 48,
            type_hex : "0000000000000030"
          },
          {
            account : "rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX",
            currency : "LTC",
            issuer : "rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX",
            type : 49,
            type_hex : "0000000000000031"
          }
        ]
      ],
      SendMax : {
        currency : "USD",
        issuer : "r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
        value : "30.30993068"
      },
      Sequence : 415,
      SigningPubKey : "02854B06CE8F3E65323F89260E9E19B33DA3E01B30EA4CA172612DE77973FAC58A",
      TransactionType : "Payment",
      TxnSignature : "304602210096C2F385530587DE573936CA51CB86B801A28F777C944E268212BE7341440B7F022100EBF0508A9145A56CDA7FAF314DF3BBE51C6EE450BA7E74D88516891A3608644E"
    };
    var expected_hex = "1200002200000000240000019F61D4A3794DFA1510000000000000000000000000004C54430000000000EF7ED76B77750D79EC92A59389952E0E8054407668400000000000000F69D4CAC4AC112283000000000000000000000000005553440000000000EF7ED76B77750D79EC92A59389952E0E80544076732102854B06CE8F3E65323F89260E9E19B33DA3E01B30EA4CA172612DE77973FAC58A7448304602210096C2F385530587DE573936CA51CB86B801A28F777C944E268212BE7341440B7F022100EBF0508A9145A56CDA7FAF314DF3BBE51C6EE450BA7E74D88516891A3608644E8114EF7ED76B77750D79EC92A59389952E0E805440768314EF7ED76B77750D79EC92A59389952E0E80544076011231DD39C650A96EDA48334E70CC4A85B8B2E8502CD30000000000000000000000005553440000000000DD39C650A96EDA48334E70CC4A85B8B2E8502CD3300000000000000000000000004C5443000000000047DA9E2E00ECF224A52329793F1BB20FB1B5EA643147DA9E2E00ECF224A52329793F1BB20FB1B5EA640000000000000000000000004C5443000000000047DA9E2E00ECF224A52329793F1BB20FB1B5EA6400";
    var transaction = Transaction.from_json(input_json);

    assert.deepEqual(transaction.serialize().to_hex(), expected_hex);
  });

  it('Hashing', function() {
    var input_json = {
      Account : "r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
      Amount : {
        currency : "LTC",
        issuer : "r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
        value : "9.985"
      },
      Destination : "r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
      Fee : "15",
      Flags : 0,
      Paths : [
        [
          {
            account : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
            currency : "USD",
            issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
            type : 49,
            type_hex : "0000000000000031"
          },
          {
            currency : "LTC",
            issuer : "rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX",
            type : 48,
            type_hex : "0000000000000030"
          },
          {
            account : "rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX",
            currency : "LTC",
            issuer : "rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX",
            type : 49,
            type_hex : "0000000000000031"
          }
        ]
      ],
      SendMax : {
        currency : "USD",
        issuer : "r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
        value : "30.30993068"
      },
      Sequence : 415,
      SigningPubKey : "02854B06CE8F3E65323F89260E9E19B33DA3E01B30EA4CA172612DE77973FAC58A",
      TransactionType : "Payment",
      TxnSignature : "304602210096C2F385530587DE573936CA51CB86B801A28F777C944E268212BE7341440B7F022100EBF0508A9145A56CDA7FAF314DF3BBE51C6EE450BA7E74D88516891A3608644E"
    };
    var expected_hash = "87366146D381AD971B97DD41CFAC1AE4670B0E996AB574B0CE18CE6467811868";
    var transaction = Transaction.from_json(input_json);

    assert.deepEqual(transaction.hash(), expected_hash);
  });
});

// vim:sw=2:sts=2:ts=8:et
