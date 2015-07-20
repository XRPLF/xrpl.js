var Transaction = require('ripple-lib').Transaction;
var keyPairFromSeed = require('../').keyPairFromSeed;

var SIGNING_PREFIX = [0x53, 0x54, 0x58, 0x00];

function prettyJSON(obj) {
  return JSON.stringify(obj, undefined, 2);
}

function signingData(tx) {
  return SIGNING_PREFIX.concat(tx.serialize().buffer);
}

function signTxJson(seed, json) {
  var keyPair = keyPairFromSeed(seed);
  var tx = Transaction.from_json(json);
  var tx_json = tx.tx_json;

  tx_json.SigningPubKey = keyPair.pubKeyHex();
  tx_json.TxnSignature = keyPair.signHex(signingData(tx));

  var serialized = tx.serialize();

  var id = tx.hash('HASH_TX_ID', /* Uint256: */ false , /* pre: */ serialized);

  return {
    hash: id,
    tx_blob: serialized.to_hex(),
    tx_json: tx_json
  };
}

var seed = 'sEd7t79mzn2dwy3vvpvRmaaLbLhvme6';
var tx_json = {
  Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
  Amount: '1000',
  Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  Fee: '10',
  Flags: 2147483648,
  Sequence: 1,
  TransactionType: 'Payment',
};

console.log('unsigned', prettyJSON(tx_json));
console.log('signed', prettyJSON(signTxJson(seed, tx_json)));
