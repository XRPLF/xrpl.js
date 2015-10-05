'use strict';
const extend = require('extend');
const utils = require('./utils');
const Amount = require('./amount').Amount;
const ACCOUNT_ZERO = require('./constants').ACCOUNT_ZERO;
const {isValidAddress} = require('ripple-address-codec');

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
}

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
  let result = null;

  for (let i = 0; i < Meta.NODE_TYPES.length; i++) {
    const type = Meta.NODE_TYPES[i];
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
  this._affectedAccounts = undefined;
  this._affectedBooks = undefined;

  const result = { };

  result.nodeType = this.getNodeType(node);
  if (result.nodeType) {
    const _node = node[result.nodeType];
    result.diffType = result.nodeType;
    result.entryType = _node.LedgerEntryType;
    result.ledgerIndex = _node.LedgerIndex;
    result.fields = extend({ }, _node.PreviousFields,
      _node.NewFields, _node.FinalFields);
    result.fieldsPrev = _node.PreviousFields || { };
    result.fieldsNew = _node.NewFields || { };
    result.fieldsFinal = _node.FinalFields || { };

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
  }
  return this.nodes;
};

Meta.prototype.getAffectedAccounts = function() {
  if (this._affectedAccounts) {
    return this._affectedAccounts;
  }

  const accounts = [ ];

  // This code should match the behavior of the C++ method:
  // TransactionMetaSet::getAffectedAccounts
  for (let i = 0; i < this.nodes.length; i++) {
    const node = this.nodes[i];
    const fields = (node.nodeType === 'CreatedNode')
    ? node.fieldsNew
    : node.fieldsFinal;

    for (const fieldName in fields) {
      const field = fields[fieldName];

      if (this.isAccountField(fieldName) && isValidAddress(field)) {
        accounts.push(field);
      } else if (
          Meta.AMOUNT_FIELDS_AFFECTING_ISSUER.indexOf(fieldName) !== -1) {
        const amount = Amount.from_json(field);
        const issuer = amount.issuer();
        if (isValidAddress(issuer) && issuer !== ACCOUNT_ZERO) {
          accounts.push(issuer);
        }
      }
    }
  }

  this._affectedAccounts = utils.arrayUnique(accounts);

  return this._affectedAccounts;
};

Meta.prototype.getAffectedBooks = function() {
  if (this._affectedBooks) {
    return this._affectedBooks;
  }

  const books = [ ];

  for (let i = 0; i < this.nodes.length; i++) {
    const node = this.nodes[i];

    if (node.entryType !== 'Offer') {
      continue;
    }

    const gets = Amount.from_json(node.fields.TakerGets);
    const pays = Amount.from_json(node.fields.TakerPays);
    let getsKey = gets.currency().to_json();
    let paysKey = pays.currency().to_json();

    if (getsKey !== 'XRP') {
      getsKey += '/' + gets.issuer();
    }

    if (paysKey !== 'XRP') {
      paysKey += '/' + pays.issuer();
    }

    const key = getsKey + ':' + paysKey;

    // Hell of a lot of work, so we are going to cache this. We can use this
    // later to good effect in OrderBook.notify to make sure we only process
    // pertinent offers.
    node.bookKey = key;

    books.push(key);
  }

  this._affectedBooks = utils.arrayUnique(books);

  return this._affectedBooks;
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
