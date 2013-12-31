var extend  = require('extend');
var utils   = require('./utils');
var UInt160 = require('./uint160').UInt160;
var Amount  = require('./amount').Amount;

/**
 * Meta data processing facility
 */

function Meta(raw_data) {
  var self = this;

  this.nodes = [ ];

  raw_data.AffectedNodes.forEach(function(an) {
    var result = { };

    if (result.diffType = self.diffType(an)) {
      an = an[result.diffType];

      result.entryType   = an.LedgerEntryType;
      result.ledgerIndex = an.LedgerIndex;
      result.fields      = extend({}, an.PreviousFields, an.NewFields, an.FinalFields);
      result.fieldsPrev  = an.PreviousFields || {};
      result.fieldsNew   = an.NewFields || {};
      result.fieldsFinal = an.FinalFields || {};

      self.nodes.push(result);
    }
  });
};

Meta.node_types = [
  'CreatedNode',
  'ModifiedNode',
  'DeletedNode'
];

Meta.prototype.diffType = function(an) {
  var result = false;

  for (var i=0; i<Meta.node_types.length; i++) {
    var x = Meta.node_types[i];
    if (an.hasOwnProperty(x)) {
      result = x;
      break;
    }
  }

  return result;
};

/**
 * Execute a function on each affected node.
 *
 * The callback is passed two parameters. The first is a node object which looks
 * like this:
 *
 *   {
 *     // Type of diff, e.g. CreatedNode, ModifiedNode
 *     diffType: 'CreatedNode'
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
 *     // this affected without having to check the diffType.
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
 *
 * The second parameter to the callback is the index of the node in the metadata
 * (first entry is index 0).
 */
Meta.prototype.each = function (fn) {
  for (var i = 0, l = this.nodes.length; i < l; i++) {
    fn(this.nodes[i], i);
  }
};

([
 'forEach',
 'map',
 'filter',
 'every',
 'reduce'
]).forEach(function(fn) {
  Meta.prototype[fn] = function() {
    return Array.prototype[fn].apply(this.nodes, arguments);
  }
});

var amountFieldsAffectingIssuer = [
  'LowLimit',
  'HighLimit',
  'TakerPays',
  'TakerGets'
];

Meta.prototype.getAffectedAccounts = function () {
  var accounts = [ ];

  // This code should match the behavior of the C++ method:
  // TransactionMetaSet::getAffectedAccounts
  this.nodes.forEach(function (an) {
    var fields = (an.diffType === 'CreatedNode') ? an.fieldsNew : an.fieldsFinal;
    for (var i in fields) {
      var field = fields[i];
      if (typeof field === 'string' && UInt160.is_valid(field)) {
        accounts.push(field);
      } else if (amountFieldsAffectingIssuer.indexOf(i) !== -1) {
        var amount = Amount.from_json(field);
        var issuer = amount.issuer();
        if (issuer.is_valid() && !issuer.is_zero()) {
          accounts.push(issuer.to_json());
        }
      }
    }
  });

  return utils.arrayUnique(accounts);
};

Meta.prototype.getAffectedBooks = function () {
  var books = [ ];

  this.nodes.forEach(function (an) {
    if (an.entryType !== 'Offer') return;

    var gets = Amount.from_json(an.fields.TakerGets);
    var pays = Amount.from_json(an.fields.TakerPays);

    var getsKey = gets.currency().to_json();
    if (getsKey !== 'XRP') getsKey += '/' + gets.issuer().to_json();

    var paysKey = pays.currency().to_json();
    if (paysKey !== 'XRP') paysKey += '/' + pays.issuer().to_json();

    var key = [ getsKey, paysKey ].join(':');

    books.push(key);
  });

  return utils.arrayUnique(books);
};

exports.Meta = Meta;
