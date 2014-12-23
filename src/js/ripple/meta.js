var _ = require('lodash');
var extend  = require('extend');
var utils = require('./utils');
var UInt160 = require('./uint160').UInt160;
var Amount  = require('./amount').Amount;

/**
 * Meta data processing facility
 *
 * @constructor
 * @param {Object} transaction metadata
 */

function Meta(data) {
  this.nodes = [ ];

  if (typeof data !== 'object') {
    throw new TypeError('Missing metadata');
  }

  if (!Array.isArray(data.AffectedNodes)) {
    throw new TypeError('Metadata missing AffectedNodes');
  }

  data.AffectedNodes.forEach(this.addNode, this);
};

Meta.NODE_TYPES = [
  'CreatedNode',
  'ModifiedNode',
  'DeletedNode'
];

Meta.AMOUNT_FIELDS_AFFECTING_ISSUER = [
  'LowLimit',
  'HighLimit',
  'TakerPays',
  'TakerGets'
];

Meta.ACCOUNT_FIELDS = [
  'Account',
  'Owner',
  'Destination',
  'Issuer',
  'Target'
];

/**
 * @param {Object} node
 * @api private
 */

Meta.prototype.getNodeType = function(node) {
  var result = null;

  for (var i=0; i<Meta.NODE_TYPES.length; i++) {
    var type = Meta.NODE_TYPES[i];
    if (node.hasOwnProperty(type)) {
      result = type;
      break;
    }
  }

  return result;
};

/**
 * @param {String} field
 * @api private
 */

Meta.prototype.isAccountField = function(field) {
  return Meta.ACCOUNT_FIELDS.indexOf(field) !== -1;
};

/**
 * Add node to metadata
 *
 * @param {Object} node
 * @api private
 */

Meta.prototype.addNode = function(node) {
  this._affectedAccounts = void(0);
  this._affectedBooks = void(0);

  var result = { };

  if ((result.nodeType = this.getNodeType(node))) {
    node = node[result.nodeType];
    result.diffType    = result.nodeType;
    result.entryType   = node.LedgerEntryType;
    result.ledgerIndex = node.LedgerIndex;
    result.fields      = extend({ }, node.PreviousFields, node.NewFields, node.FinalFields);
    result.fieldsPrev  = node.PreviousFields || { };
    result.fieldsNew   = node.NewFields || { };
    result.fieldsFinal = node.FinalFields || { };

    // getAffectedBooks will set this
    // result.bookKey   = undefined;

    this.nodes.push(result);
  }
};

/**
 * Get affected nodes array
 *
 * @param {Object} filter options
 * @return {Array} nodes
 */

Meta.prototype.getNodes = function(options) {
  if (typeof options === 'object') {
    return this.nodes.filter(function(node) {
      if (options.nodeType && options.nodeType !== node.nodeType) {
        return false;
      }
      if (options.entryType && options.entryType !== node.entryType) {
        return false;
      }
      if (options.bookKey && options.bookKey !== node.bookKey) {
        return false;
      }
      return true;
    });
  } else {
    return this.nodes;
  }
};


Meta.prototype.getAffectedAccounts = function(from) {
  if (this._affectedAccounts) {
    return this._affectedAccounts;
  }

  var accounts = [ ];

  // This code should match the behavior of the C++ method:
  // TransactionMetaSet::getAffectedAccounts
  for (var i=0; i<this.nodes.length; i++) {
    var node = this.nodes[i];
    var fields = (node.nodeType === 'CreatedNode')
    ? node.fieldsNew
    : node.fieldsFinal;

    for (var fieldName in fields) {
      var field = fields[fieldName];

      if (this.isAccountField(fieldName) && UInt160.is_valid(field)) {
        accounts.push(field);
      } else if (~Meta.AMOUNT_FIELDS_AFFECTING_ISSUER.indexOf(fieldName)) {
        var amount = Amount.from_json(field);
        var issuer = amount.issuer();
        if (issuer.is_valid() && !issuer.is_zero()) {
          accounts.push(issuer.to_json());
        }
      }
    }
  }

  this._affectedAccounts = utils.arrayUnique(accounts);

  return  this._affectedAccounts;
};

Meta.prototype.getAffectedBooks = function() {
  if (this._affectedBooks) {
    return this._affectedBooks;
  }

  var books = [ ];

  for (var i=0; i<this.nodes.length; i++) {
    var node = this.nodes[i];

    if (node.entryType !== 'Offer') {
      continue;
    }

    var gets = Amount.from_json(node.fields.TakerGets);
    var pays = Amount.from_json(node.fields.TakerPays);
    var getsKey = gets.currency().to_json();
    var paysKey = pays.currency().to_json();

    if (getsKey !== 'XRP') {
      getsKey += '/' + gets.issuer().to_json();
    }

    if (paysKey !== 'XRP') {
      paysKey += '/' + pays.issuer().to_json();
    }

    var key = getsKey + ':' + paysKey;

    // Hell of a lot of work, so we are going to cache this. We can use this
    // later to good effect in OrderBook.notify to make sure we only process
    // pertinent offers.
    node.bookKey = key;

    books.push(key);
  }

  this._affectedBooks = utils.arrayUnique(books);

  return this._affectedBooks;
};


// TODO: migrate to external bignum library
function bignum(x) {
  return Amount.from_json({value: x.toString()});
};

// Merge balance changes that have the same account, issuer, and currency
// by summing them together
function mergeBalanceChanges(balanceChanges) {
  var grouped = _.groupBy(balanceChanges, function(change) {
    return (change.address + '-' +
            change.balance_change.issuer().to_json().toString() + '-' +
            change.balance_change.currency().to_json().toString());
  });
  return _.compact(Object.keys(grouped).map(function(key) {
    var group = grouped[key];
    var valueSum = bignum(0);
    group.forEach(function(change) {
      valueSum = valueSum.add(bignum(change.balance_change.to_text()));
    });
    if (valueSum.is_zero()) {
      return null;      // do not report balance change if there was no change
    }
    var currency = group[0].balance_change.currency().to_json();
    var balanceChange = currency === 'XRP' ?
      Amount.from_json(valueSum.to_text()) :
      Amount.from_json({
        issuer:  group[0].balance_change.issuer().to_json(),
        currency: currency,
        value: valueSum.to_text()
      });
    return {
      address: group[0].address,
      balance_change: balanceChange
    };
  }));
};

function parseAccountRootBalanceChange(node, address) {
  if (!_.isEmpty(node.fieldsNew)) {
    return {
      address: node.fieldsNew.Account,
      balance_change: Amount.from_json(node.fieldsNew.Balance)
    };
  } else if (!_.isEmpty(node.fieldsFinal)) {
    var finalBal = bignum(node.fieldsFinal.Balance);
    var prevBal = (typeof node.fieldsPrev.Balance === 'string') ?
      bignum(node.fieldsPrev.Balance) : bignum(0);

    return {
      address: node.fieldsFinal.Account,
      balance_change: Amount.from_json(finalBal.subtract(prevBal).to_text())
    };
  }

  return null;
};

function isHighNodeIssuer(trustBalFinal, trustBalPrev, trustHigh, trustLow) {
  if (trustBalFinal.is_positive()) {
    return true;
  } else if (trustBalFinal.is_negative()) {
    return false;
  } else if (trustBalPrev.is_positive()) {
    return true;
  } else if (trustBalPrev.is_negative()) {
    return false;
  } else if (trustLow.is_zero() && trustHigh.is_positive()) {
    return false;    // high node cannot issue
  } else if (trustHigh.is_zero() && trustLow.is_positive()) {
    return true;     // low node cannot issue
  } else {
    return false;    // totally arbitrary
  }
};

function parseTrustlineBalanceChange(node, address) {
  if (!_.isEmpty(node.fieldsFinal)) {
    if (!(node.fieldsPrev.Balance)) {
      return null;    // setting a trustline limit, no balance change
    }
  }
  var finalFields = _.isEmpty(node.fieldsNew) ?
    node.fieldsFinal : node.fieldsNew;
  var trustHighIssuer = finalFields.HighLimit.issuer;
  var trustLowIssuer = finalFields.LowLimit.issuer;
  if (address !== trustLowIssuer && address !== trustHighIssuer) {
    return null;
  }
  var trustHigh = bignum(finalFields.HighLimit.value);
  var trustLow = bignum(finalFields.LowLimit.value);
  var trustBalFinal = bignum(finalFields.Balance.value);
  var trustBalPrev = node.fieldsPrev.Balance ?
    bignum(node.fieldsPrev.Balance.value) : bignum(0);
  var trustBalChange = trustBalFinal.subtract(trustBalPrev);
  var issuer = isHighNodeIssuer(trustBalFinal, trustBalPrev, trustHigh,
    trustLow) ? trustHighIssuer : trustLowIssuer;
  var balanceChange = (address === trustHighIssuer) ?
    trustBalChange.negate() : trustBalChange;

  return {
    address: address,
    balance_change: Amount.from_json({
      value: balanceChange.to_text(),
      currency: finalFields.Balance.currency,
      issuer: issuer
    })
  };
};

function parseTrustlineBalanceChanges(node) {
  var fields = _.isEmpty(node.fieldsNew) ? node.fieldsFinal : node.fieldsNew;
  return [parseTrustlineBalanceChange(node, fields.HighLimit.issuer),
          parseTrustlineBalanceChange(node, fields.LowLimit.issuer)];
};

Meta.prototype.parseBalanceChanges = function() {
  var balanceChanges = this.nodes.map(function(node) {
    if (node.entryType === 'AccountRoot') {
      // Look for XRP balance change in AccountRoot node
      return [parseAccountRootBalanceChange(node)];
    } else if (node.entryType === 'RippleState') {
      // Look for trustline balance change in RippleState node
      return parseTrustlineBalanceChanges(node);
    } else {
      return [ ];
    }
  });

  return mergeBalanceChanges(_.compact(_.flatten(balanceChanges)));
};

/**
 * Execute a function on each affected node.
 *
 * The callback is passed two parameters. The first is a node object which looks
 * like this:
 *
 *   {
 *     // Type of diff, e.g. CreatedNode, ModifiedNode
 *     nodeType: 'CreatedNode'
 *
 *     // Type of node affected, e.g. RippleState, AccountRoot
 *     entryType: 'RippleState',
 *
 *     // Index of the ledger this change occurred in
 *     ledgerIndex: '01AB01AB...',
 *
 *     // Contains all fields with later versions taking precedence
 *     //
 *     // This is a shorthand for doing things like checking which account
 *     // this affected without having to check the nodeType.
 *     fields: {...},
 *
 *     // Old fields (before the change)
 *     fieldsPrev: {...},
 *
 *     // New fields (that have been added)
 *     fieldsNew: {...},
 *
 *     // Changed fields
 *     fieldsFinal: {...}
 *   }
 */

[
 'forEach',
 'map',
 'filter',
 'every',
 'some',
 'reduce'
].forEach(function(fn) {
  Meta.prototype[fn] = function() {
    return Array.prototype[fn].apply(this.nodes, arguments);
  };
});

Meta.prototype.each = Meta.prototype.forEach;

exports.Meta = Meta;
