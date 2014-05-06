// Ledger

var Transaction = require('./transaction').Transaction;
var SHAMap = require('./shamap').SHAMap;
var SHAMapTreeNode = require('./shamap').SHAMapTreeNode;
var SerializedObject = require('./serializedobject').SerializedObject;
var stypes = require('./serializedtypes');

function Ledger()
{
  this.ledger_json = {};
}

Ledger.from_json = function (v) {
  var ledger = new Ledger();
  ledger.parse_json(v);
  return ledger;
};

Ledger.prototype.parse_json = function (v) {
  this.ledger_json = v;
};

Ledger.prototype.calc_tx_hash = function () {
  var tx_map = new SHAMap();

  this.ledger_json.transactions.forEach(function (tx_json) {
    var tx = Transaction.from_json(tx_json);
    var meta = SerializedObject.from_json(tx_json.metaData);

    var data = new SerializedObject();
    stypes.VariableLength.serialize(data, tx.serialize().to_hex());
    stypes.VariableLength.serialize(data, meta.to_hex());
    tx_map.add_item(tx.hash(), data, SHAMapTreeNode.TYPE_TRANSACTION_MD);
  });

  return tx_map.hash();
};

Ledger.prototype.calc_account_hash = function () {
  var account_map = new SHAMap();

  this.ledger_json.accountState.forEach(function (le) {
    var data = SerializedObject.from_json(le);

    account_map.add_item(le.index, data, SHAMapTreeNode.TYPE_ACCOUNT_STATE);
  });

  return account_map.hash();
};

exports.Ledger = Ledger;
