// Ledger

var Transaction = require('./transaction').Transaction;
var SHAMap = require('./shamap').SHAMap;
var SHAMapTreeNode = require('./shamap').SHAMapTreeNode;
var SerializedObject = require('./serializedobject').SerializedObject;
var stypes = require('./serializedtypes');
var UInt160 = require('./uint160').UInt160;
var Currency = require('./currency').Currency;
var stypes = require('./serializedtypes');
var sjcl  = require('./utils').sjcl;
var Crypt = require('./crypt').Crypt;

function Ledger()
{
  this.ledger_json = {};
}

Ledger.from_json = function (v) {
  var ledger = new Ledger();
  ledger.parse_json(v);
  return ledger;
};

Ledger.space = require('./ledgerspaces');

/**
 * Generate the key for an AccountRoot entry.
 *
 * @param {String|UInt160} account Ripple Account
 * @return {UInt256}
 */
Ledger.calcAccountRootEntryHash =
Ledger.prototype.calcAccountRootEntryHash = function (account) {
  account = UInt160.from_json(account);

  var index = new SerializedObject();

  index.append([0, Ledger.space.account.charCodeAt(0)]);
  index.append(account.to_bytes());

  return index.hash();
};

/**
 * Generate the key for an Offer entry.
 *
 * @param {String|UInt160} account Ripple Account
 * @param {Number} sequence Sequence number of the OfferCreate transaction
 *   that instantiated this offer.
 * @return {UInt256}
 */
Ledger.calcOfferEntryHash =
Ledger.prototype.calcOfferEntryHash = function (account, sequence) {
  account = UInt160.from_json(account);
  sequence = parseInt(sequence);

  var index = new SerializedObject();

  index.append([0, Ledger.space.offer.charCodeAt(0)]);
  index.append(account.to_bytes());
  stypes.Int32.serialize(index, sequence);

  return index.hash();
};

/**
 * Generate the key for a RippleState entry.
 *
 * The ordering of the two account parameters does not matter.
 *
 * @param {String|UInt160} account1 First Ripple Account
 * @param {String|UInt160} account2 Second Ripple Account
 * @param {String|Currency} currency The currency code
 * @return {UInt256}
 */
Ledger.calcRippleStateEntryHash =
Ledger.prototype.calcRippleStateEntryHash = function (account1, account2, currency) {
  currency = Currency.from_json(currency);
  account1 = UInt160.from_json(account1);
  account2 = UInt160.from_json(account2);

  if (!account1.is_valid()) {
    throw new Error("Invalid first account");
  }
  if (!account2.is_valid()) {
    throw new Error("Invalid second account");
  }
  if (!currency.is_valid()) {
    throw new Error("Invalid currency");
  }

  // The lower ID has to come first
  if (account1.to_bn().greaterEquals(account2.to_bn())) {
    var tmp = account2;
    account2 = account1;
    account1 = tmp;
  }

  var index = new SerializedObject();

  index.append([0, Ledger.space.rippleState.charCodeAt(0)]);
  index.append(account1.to_bytes());
  index.append(account2.to_bytes());
  index.append(currency.to_bytes());

  return index.hash();
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

/**
* @param options.sanity_test {Boolean}
*
*   If `true`, will serialize each accountState item to binary and then back to
*   json before finally serializing for hashing. This is mostly to expose any
*   issues with ripple-lib's binary <--> json codecs.
*
*/
Ledger.prototype.calc_account_hash = function (options) {
  var account_map = new SHAMap();
  var erred;

  this.ledger_json.accountState.forEach(function (le) {
    var data = SerializedObject.from_json(le);

    if (options != null && options.sanity_test) {
      try {
        var json = data.to_json();
        data = SerializedObject.from_json(json);
      } catch (e) {
        console.log("account state item: ", le);
        console.log("to_json() ",json);
        console.log("exception: ", e);
        erred = true;
      }
    };

    account_map.add_item(le.index, data, SHAMapTreeNode.TYPE_ACCOUNT_STATE);
  });

  if (erred) {
    throw new Error("There were errors with sanity_test"); // all logged above
  }

  return account_map.hash();
};

exports.Ledger = Ledger;
