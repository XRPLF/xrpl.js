var util             = require('util');
var assert           = require('assert');
var EventEmitter     = require('events').EventEmitter;
var utils            = require('./utils');
var sjcl             = require('./utils').sjcl;
var Amount           = require('./amount').Amount;
var Currency         = require('./amount').Currency;
var UInt160          = require('./amount').UInt160;
var Seed             = require('./seed').Seed;
var SerializedObject = require('./serializedobject').SerializedObject;
var RippleError      = require('./rippleerror').RippleError;
var hashprefixes     = require('./hashprefixes');
var config           = require('./config');

/**
 * @constructor Transaction
 *
 * Notes:
 * All transactions including those with local and malformed errors may be
 * forwarded anyway.
 *
 * A malicous server can:
 *  - may or may not forward
 *  - give any result
 *    + it may declare something correct as incorrect or something incorrect
 *      as correct
 *    + it may not communicate with the rest of the network
 */

function Transaction(remote) {
  EventEmitter.call(this);

  var self = this;
  var remoteExists = (typeof remote === 'object');

  this.remote = remote;
  this.tx_json = { Flags: 0 };
  this._secret = void(0);
  this._build_path = false;
  this._maxFee = remoteExists ? this.remote.max_fee : void(0);
  this.state = 'unsubmitted';
  this.finalized = false;
  this.previousSigningHash = void(0);
  this.submitIndex = void(0);
  this.canonical = remoteExists ? this.remote.canonical_signing : true;
  this.submittedIDs = [ ];
  this.attempts = 0;
  this.submissions = 0;
  this.responses = 0;

  this.once('success', function(message) {
    // Transaction definitively succeeded
    self.setState('validated');
    self.finalize(message);
    if (self._successHandler) {
      self._successHandler(message);
    }
  });

  this.once('error', function(message) {
    // Transaction definitively failed
    self.setState('failed');
    self.finalize(message);
    if (self._errorHandler) {
      self._errorHandler(message);
    }
  });

  this.once('submitted', function() {
    // Transaction was submitted to the network
    self.setState('submitted');
  });

  this.once('proposed', function() {
    // Transaction was submitted successfully to the network
    self.setState('pending');
  });
};

util.inherits(Transaction, EventEmitter);

// XXX This needs to be determined from the network.
Transaction.fee_units = {
  default: 10
};

Transaction.flags = {
  // Universal flags can apply to any transaction type
  Universal: {
    FullyCanonicalSig:  0x80000000
  },

  AccountSet: {
    RequireDestTag:     0x00010000,
    OptionalDestTag:    0x00020000,
    RequireAuth:        0x00040000,
    OptionalAuth:       0x00080000,
    DisallowXRP:        0x00100000,
    AllowXRP:           0x00200000
  },

  TrustSet: {
    SetAuth:            0x00010000,
    NoRipple:           0x00020000,
    SetNoRipple:        0x00020000,
    ClearNoRipple:      0x00040000,
    SetFreeze:          0x00100000,
    ClearFreeze:        0x00200000
  },

  OfferCreate: {
    Passive:            0x00010000,
    ImmediateOrCancel:  0x00020000,
    FillOrKill:         0x00040000,
    Sell:               0x00080000
  },

  Payment: {
    NoRippleDirect:     0x00010000,
    PartialPayment:     0x00020000,
    LimitQuality:       0x00040000
  }
};

// The following are integer (as opposed to bit) flags
// that can be set for particular transactions in the
// SetFlag or ClearFlag field
Transaction.set_clear_flags = {
  AccountSet: {
    asfRequireDest:    1,
    asfRequireAuth:    2,
    asfDisallowXRP:    3,
    asfDisableMaster:  4,
    asfNoFreeze:       6,
    asfGlobalFreeze:   7
  }
};

Transaction.MEMO_TYPES = {
};

Transaction.ASCII_REGEX = /^[\x00-\x7F]*$/;

Transaction.formats = require('./binformat').tx;

Transaction.prototype.consts = {
  telLOCAL_ERROR:  -399,
  temMALFORMED:    -299,
  tefFAILURE:      -199,
  terRETRY:        -99,
  tesSUCCESS:      0,
  tecCLAIMED:      100
};

Transaction.prototype.isTelLocal = function(ter) {
  return ter >= this.consts.telLOCAL_ERROR && ter < this.consts.temMALFORMED;
};

Transaction.prototype.isTemMalformed = function(ter) {
  return ter >= this.consts.temMALFORMED && ter < this.consts.tefFAILURE;
};

Transaction.prototype.isTefFailure = function(ter) {
  return ter >= this.consts.tefFAILURE && ter < this.consts.terRETRY;
};

Transaction.prototype.isTerRetry = function(ter) {
  return ter >= this.consts.terRETRY && ter < this.consts.tesSUCCESS;
};

Transaction.prototype.isTepSuccess = function(ter) {
  return ter >= this.consts.tesSUCCESS;
};

Transaction.prototype.isTecClaimed = function(ter) {
  return ter >= this.consts.tecCLAIMED;
};

Transaction.prototype.isRejected = function(ter) {
  return this.isTelLocal(ter) || this.isTemMalformed(ter) || this.isTefFailure(ter);
};

Transaction.from_json = function(j) {
  return (new Transaction()).parseJson(j);
};

Transaction.prototype.parseJson = function(v) {
  this.tx_json = v;
  return this;
};

/**
 * Set state on the condition that the state is different
 *
 * @param {String} state
 */

Transaction.prototype.setState = function(state) {
  if (this.state !== state) {
    this.state = state;
    this.emit('state', state);
  }
};

/**
 * Finalize transaction. This will prevent future activity
 *
 * @param {Object} message
 * @api private
 */

Transaction.prototype.finalize = function(message) {
  this.finalized = true;

  if (this.result) {
    this.result.ledger_index = message.ledger_index;
    this.result.ledger_hash  = message.ledger_hash;
  } else {
    this.result = message;
    this.result.tx_json = this.tx_json;
  }

  this.emit('cleanup');
  this.emit('final', message);

  if (this.remote && this.remote.trace) {
    log.info('transaction finalized:',
             this.tx_json, this.getManager()._pending.getLength());
  }

  return this;
};

/**
 * Get transaction Account
 *
 * @return {Account}
 */

Transaction.prototype.getAccount = function() {
  return this.tx_json.Account;
};

/**
 * Get TransactionType
 *
 * @return {String}
 */

Transaction.prototype.getTransactionType = function() {
  return this.tx_json.TransactionType;
};

/**
 * Get transaction TransactionManager
 *
 * @param [String] account
 * @return {TransactionManager]
 */

Transaction.prototype.getManager = function(account) {
  if (!this.remote) {
    return void(0);
  }

  if (!account) {
    account = this.tx_json.Account;
  }

  return this.remote.account(account)._transactionManager;
};

/**
 * Get transaction secret
 *
 * @param [String] account
 */

Transaction.prototype.getSecret =
Transaction.prototype._accountSecret = function(account) {
  if (!this.remote) {
    return void(0);
  }

  if (!account) {
    account = this.tx_json.Account;
  }

  return this.remote.secrets[account];
};

/**
 * Returns the number of fee units this transaction will cost.
 *
 * Each Ripple transaction based on its type and makeup costs a certain number
 * of fee units. The fee units are calculated on a per-server basis based on the
 * current load on both the network and the server.
 *
 * @see https://ripple.com/wiki/Transaction_Fee
 *
 * @return {Number} Number of fee units for this transaction.
 */

Transaction.prototype._getFeeUnits =
Transaction.prototype.feeUnits = function() {
  return Transaction.fee_units['default'];
};

/**
 * Compute median server fee
 *
 * @return {String} median fee
 */

Transaction.prototype._computeFee = function() {
  if (!this.remote) {
    return void(0);
  }

  var servers = this.remote._servers;
  var fees = [ ];

  for (var i=0; i<servers.length; i++) {
    var server = servers[i];
    if (server._connected) {
      fees.push(Number(server._computeFee(this._getFeeUnits())));
    }
  }

  switch (fees.length) {
    case 0: return;
    case 1: return String(fees[0]);
  }

  fees.sort(function ascending(a, b) {
    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    } else {
      return 0;
    }
  });

  var midInd = Math.floor(fees.length / 2);

  var median = fees.length % 2 === 0
  ? Math.floor(0.5 + (fees[midInd] + fees[midInd - 1]) / 2)
  : fees[midInd];

  return String(median);
};

/**
 * Attempts to complete the transaction for submission.
 *
 * This function seeks to fill out certain fields, such as Fee and
 * SigningPubKey, which can be determined by the library based on network
 * information and other fields.
 *
 * @return {Boolean|Transaction} If succeeded, return transaction. Otherwise
 * return `false`
 */

Transaction.prototype.complete = function() {
  if (this.remote) {
    if (!this.remote.trusted && !this.remote.local_signing) {
      this.emit('error', new RippleError(
        'tejServerUntrusted', 'Attempt to give secret to untrusted server'));
      return false;
    }
  }

  // Try to auto-fill the secret
  if (!this._secret && !(this._secret = this.getSecret())) {
    this.emit('error', new RippleError('tejSecretUnknown', 'Missing secret'));
    return false;
  }

  if (typeof this.tx_json.SigningPubKey === 'undefined') {
    try {
      var seed = Seed.from_json(this._secret);
      var key  = seed.get_key(this.tx_json.Account);
      this.tx_json.SigningPubKey = key.to_hex_pub();
    } catch(e) {
      this.emit('error', new RippleError(
        'tejSecretInvalid', 'Invalid secret'));
      return false;
    }
  }

  // If the Fee hasn't been set, one needs to be computed by
  // an assigned server
  if (this.remote && typeof this.tx_json.Fee === 'undefined') {
    if (this.remote.local_fee || !this.remote.trusted) {
      if (!(this.tx_json.Fee = this._computeFee())) {
        this.emit('error', new RippleError('tejUnconnected'));
        return false;
      }
    }
  }

  if (Number(this.tx_json.Fee) > this._maxFee) {
    this.emit('error', new RippleError(
      'tejMaxFeeExceeded', 'Max fee exceeded'));
    return false;
  }

  // Set canonical flag - this enables canonicalized signature checking
  if (this.remote && this.remote.local_signing && this.canonical) {
    this.tx_json.Flags |= Transaction.flags.Universal.FullyCanonicalSig;

    // JavaScript converts operands to 32-bit signed ints before doing bitwise
    // operations. We need to convert it back to an unsigned int.
    this.tx_json.Flags = this.tx_json.Flags >>> 0;
  }

  return this.tx_json;
};

Transaction.prototype.serialize = function() {
  return SerializedObject.from_json(this.tx_json);
};

Transaction.prototype.signingHash = function() {
  return this.hash(config.testnet ? 'HASH_TX_SIGN_TESTNET' : 'HASH_TX_SIGN');
};

Transaction.prototype.hash = function(prefix, asUINT256, serialized) {
  if (typeof prefix === 'string') {
    if (typeof hashprefixes[prefix] === 'undefined') {
      throw new Error('Unknown hashing prefix requested.');
    }
    prefix = hashprefixes[prefix];
  } else if (!prefix) {
    prefix = hashprefixes.HASH_TX_ID;
  }

  var hash = (serialized || this.serialize()).hash(prefix);

  return asUINT256 ? hash : hash.to_hex();
};

Transaction.prototype.sign = function() {
  var seed = Seed.from_json(this._secret);

  var prev_sig = this.tx_json.TxnSignature;
  delete this.tx_json.TxnSignature;

  var hash = this.signingHash();

  // If the hash is the same, we can re-use the previous signature
  if (prev_sig && hash === this.previousSigningHash) {
    this.tx_json.TxnSignature = prev_sig;
    return this;
  }

  var key = seed.get_key(this.tx_json.Account);
  var sig = key.sign(hash, 0);
  var hex = sjcl.codec.hex.fromBits(sig).toUpperCase();

  this.tx_json.TxnSignature = hex;
  this.previousSigningHash = hash;

  return this;
};

/**
 * Add an ID to cached list of submitted IDs
 *
 * @param {String} transaction id
 * @api private
 */

Transaction.prototype.addId = function(id) {
  if (this.submittedIDs.indexOf(id) === -1) {
    this.submittedIDs.unshift(id);
  }
};

/**
 * Find ID within cached received (validated) IDs. If this transaction has
 * an ID that is within the cache, it has been seen validated, so return the
 * received message
 *
 * @param {Object} cache
 * @return {Object} message
 * @api private
 */

Transaction.prototype.findId = function(cache) {
  var result;

  for (var i=0; i<this.submittedIDs.length; i++) {
    var hash = this.submittedIDs[i];
    if ((result = cache[hash])) {
      break;
    }
  }

  return result;
};

/**
 * Set build_path to have server blindly construct a path for Payment
 *
 *  "blindly" because the sender has no idea of the actual cost must be less
 *  than send max.
 *
 * XXX Abort if not a Payment
 *
 *  @param {Boolean} build path
 */

Transaction.prototype.setBuildPath =
Transaction.prototype.buildPath = function(build) {
  this._build_path = build;
  return this;
};

/**
 * Set SourceTag
 *
 * tag should be undefined or a 32 bit integer.
 * YYY Add range checking for tag
 *
 * @param {Number} source tag
 */

Transaction.prototype.sourceTag = function(tag) {
  if (typeof tag === 'number' && isFinite(tag)) {
    this.tx_json.SourceTag = tag;
  }
  return this;
};

/**
 * Set DestinationTag for Payment transaction
 *
 * tag should be undefined or a 32 bit integer.
 * YYY Add range checking for tag.
 *
 * XXX Abort if not a Payment
 *
 * @param {Number} destination tag
 */

Transaction.prototype.setDestinationTag =
Transaction.prototype.destinationTag = function(tag) {
  if (typeof tag === 'number' && isFinite(tag)) {
    this.tx_json.DestinationTag = tag;
  }
  return this;
};

/**
 * Set InvoiceID for Payment transaction
 *
 * XXX Abort if not a Payment
 *
 * @param {String} id
 */

Transaction.prototype.setInvoiceID =
Transaction.prototype.invoiceID = function(id) {
  if (typeof id === 'string') {
    while (id.length < 64) {
      id += '0';
    }
    this.tx_json.InvoiceID = id;
  }
  return this;
};

/**
 * Set client ID. This is an identifier specified by the user of the API to
 * identify a transaction in the event of a disconnect. It is not currently
 * persisted in the transaction itself, but used offline for identification.
 * In applications that require high reliability, client-specified ID should
 * be persisted such that one could map it to submitted transactions. Use
 * .summary() for a consistent transaction summary output for persisitng. In
 * the future, this ID may be stored in the transaction itself (in the ledger)
 *
 * @param {String} id
 */

Transaction.prototype.setClientID =
Transaction.prototype.clientID = function(id) {
  if (typeof id === 'string') {
    this._clientID = id;
  }
  return this;
};

/**
 * Set LastLedgerSequence as the absolute last ledger sequence the transaction
 * is valid for. LastLedgerSequence is set automatically if not set using this
 * method
 *
 * @param {Number} ledger index
 */

Transaction.prototype.setLastLedger =
Transaction.prototype.lastLedger = function(sequence) {
  if (typeof sequence === 'number' && isFinite(sequence)) {
    this._setLastLedger = true;
    this.tx_json.LastLedgerSequence = sequence;
  }

  return this;
};

/**
 * Set max fee. Submission will abort if this is exceeded. Specified fee must
 * be >= 0.
 *
 * @param {Number} fee The proposed fee
 */

Transaction.prototype.maxFee = function(fee) {
  if (typeof fee === 'number' && fee >= 0) {
    this._setMaxFee = true;
    this._maxFee = fee;
  }
  return this;
};

/*
 * Set the fee user will pay to the network for submitting this transaction. 
 * Specified fee must be >= 0.
 *
 * @param {Number} fee The proposed fee
 *
 * @returns {Transaction} calling instance for chaining
 */
Transaction.prototype.setFixedFee = function(fee) {
  if (typeof fee === 'number' && fee >= 0) {
    this._setFixedFee = true;
    this.tx_json.Fee = String(fee);
  }

  return this;
};

/**
 * Filter invalid properties from path objects in a path array
 *
 * Valid properties are:
 * - account
 * - currency
 * - issuer
 * - type_hex
 *
 * @param {Array} path
 * @return {Array} filtered path
 */

Transaction._rewritePath = function(path) {
  if (!Array.isArray(path)) {
    throw new Error('Path must be an array');
  }

  var newPath = path.map(function(node) {
    var newNode = { };

    if (node.hasOwnProperty('account')) {
      newNode.account = UInt160.json_rewrite(node.account);
    }

    if (node.hasOwnProperty('issuer')) {
      newNode.issuer = UInt160.json_rewrite(node.issuer);
    }

    if (node.hasOwnProperty('currency')) {
      newNode.currency = Currency.json_rewrite(node.currency);
    }

    if (node.hasOwnProperty('type_hex')) {
      newNode.type_hex = node.type_hex;
    }

    return newNode;
  });

  return newPath;
};

/**
 * Add a path for Payment transaction
 *
 * XXX Abort if not a Payment
 *
 * @param {Array} path
 */

Transaction.prototype.addPath =
Transaction.prototype.pathAdd = function(path) {
  if (Array.isArray(path)) {
    this.tx_json.Paths = this.tx_json.Paths || [ ];
    this.tx_json.Paths.push(Transaction._rewritePath(path));
  }
  return this;
};

/**
 * Set paths for Payment transaction
 *
 * XXX Abort if not a Payment
 *
 * @param {Array} paths
 */

Transaction.prototype.setPaths =
Transaction.prototype.paths = function(paths) {
  if (Array.isArray(paths)) {
    for (var i=0, l=paths.length; i<l; i++) {
      this.addPath(paths[i]);
    }
  }
  return this;
};

/**
 * Set secret If the secret has been set with Remote.setSecret, it does not
 * need to be provided
 *
 * @param {String} secret
 */

Transaction.prototype.setSecret =
Transaction.prototype.secret = function(secret) {
  if (typeof secret === 'string') {
    this._secret = secret;
  }
  return this;
};

/**
 * Set SendMax for Payment
 *
 * @param {String|Object} send max amount
 */

Transaction.prototype.setSendMax =
Transaction.prototype.sendMax = function(send_max) {
  if (send_max) {
    this.tx_json.SendMax = Amount.json_rewrite(send_max);
  }
  return this;
};

/**
 * Set TransferRate for AccountSet
 *
 * @param {Number} transfer raate
 */

Transaction.prototype.transferRate = function(rate) {
  if (typeof rate === 'number' && rate >= 1e9) {
    this.tx_json.TransferRate = rate;
  }
  return this;
};

/**
 * Set Flags. You may specify flags as a number, as the string name of the
 * flag, or as an array of strings.
 *
 * setFlags(Transaction.flags.AccountSet.RequireDestTag)
 * setFlags('RequireDestTag')
 * setFlags('RequireDestTag', 'RequireAuth')
 * setFlags([ 'RequireDestTag', 'RequireAuth' ])
 *
 * @param {Number|String|Array} flags
 */

Transaction.prototype.setFlags = function(flags) {
  if (flags === void(0)) {
    return this;
  }

  if (typeof flags === 'number') {
    this.tx_json.Flags = flags;
    return this;
  }

  var transaction_flags = Transaction.flags[this.getTransactionType()] || { };
  var flag_set = Array.isArray(flags) ? flags : [].slice.call(arguments);

  for (var i=0, l=flag_set.length; i<l; i++) {
    var flag = flag_set[i];

    if (transaction_flags.hasOwnProperty(flag)) {
      this.tx_json.Flags += transaction_flags[flag];
    } else {
      return this.emit('error', new RippleError('tejInvalidFlag'));
    }
  }

  return this;
};

/**
 * Add a Memo to transaction.
 *
 * @param {String} memoType
 * - describes what the data represents, needs to be valid ASCII
 * * @param {String} memoFormat
 * - describes what format the data is in, MIME type, needs to be valid ASCII
 * @param {String} memoData
 * - data for the memo, can be any JS object. Any object other than string will
 *   be stringified (JSON) for transport
 */

Transaction.prototype.addMemo = function(memoType, memoFormat, memoData) {

  if (typeof memoType === 'object') {
    var opts = memoType;
    memoType = opts.memoType;
    memoFormat = opts.memoFormat;
    memoData = opts.memoData;
  }

  if (!/(undefined|string)/.test(typeof memoType)) {
    throw new Error('MemoType must be a string');
  } else if (!Transaction.ASCII_REGEX.test(memoType)) {
    throw new Error('MemoType must be valid ASCII');
  }

  if (!/(undefined|string)/.test(typeof memoFormat)) {
    throw new Error('MemoFormat must be a string');
  } else if (!Transaction.ASCII_REGEX.test(memoFormat)) {
    throw new Error('MemoFormat must be valid ASCII');
  }

  var memo = {};

  if (memoType) {
    if (Transaction.MEMO_TYPES[memoType]) {
      //XXX Maybe in the future we want a schema validator for
      //memo types
      memo.MemoType = Transaction.MEMO_TYPES[memoType];
    } else {
      memo.MemoType = memoType;
    }
  }

  if (memoFormat) {
    memo.MemoFormat = memoFormat;
  }

  if (memoData) {
    memo.MemoData = memoData;
  }

  this.tx_json.Memos = (this.tx_json.Memos || []).concat({ Memo: memo });

  return this;
};

/**
 * Construct an 'AccountSet' transaction
 *
 * Note that bit flags can be set using the .setFlags() method but for
 * 'AccountSet' transactions there is an additional way to modify AccountRoot
 * flags. The values available for the SetFlag and ClearFlag are as follows:
 *
 * asfRequireDest:    Require a destination tag
 * asfRequireAuth:    Authorization is required to extend trust
 * asfDisallowXRP:    XRP should not be sent to this account
 * asfDisableMaster:  Disallow use of the master key
 * asfNoFreeze:       Permanently give up the ability to freeze individual
 *                    trust lines. This flag can never be cleared.
 * asfGlobalFreeze:   Freeze all assets issued by this account
 *
 * @param [String] set flag
 * @param [String] clear flag
 */

Transaction.prototype.accountSet = function(src, set_flag, clear_flag) {
  if (typeof src === 'object') {
    var options = src;
    src = options.source || options.from || options.account;
    set_flag = options.set_flag || options.set;
    clear_flag = options.clear_flag || options.clear;
  }

  if (!UInt160.is_valid(src)) {
    throw new Error('Source address invalid');
  }

  this.tx_json.TransactionType= 'AccountSet';
  this.tx_json.Account = UInt160.json_rewrite(src);

  var SetClearFlags = Transaction.set_clear_flags.AccountSet;

  function prepareFlag(flag) {
    return (typeof flag === 'number')
    ?  flag
    : (SetClearFlags[flag] || SetClearFlags['asf' + flag]);
  };

  if (set_flag && (set_flag = prepareFlag(set_flag))) {
    this.tx_json.SetFlag = set_flag;
  }

  if (clear_flag && (clear_flag = prepareFlag(clear_flag))) {
    this.tx_json.ClearFlag = clear_flag;
  }

  return this;
};

/**
 * Construct a 'Claim' transaction
 */

Transaction.prototype.claim = function(src, generator, public_key, signature) {
  if (typeof src === 'object') {
    var options = src;
    signature = options.signature;
    public_key = options.public_key;
    generator = options.generator;
    src = options.source || options.from || options.account;
  }

  this.tx_json.TransactionType = 'Claim';
  this.tx_json.Generator = generator;
  this.tx_json.PublicKey = public_key;
  this.tx_json.Signature = signature;

  return this;
};

/**
 * Construct an 'OfferCancel' transaction
 *
 * @param {String} account
 * @param [Number] sequence of an existing offer
 */

Transaction.prototype.offerCancel = function(src, sequence) {
  if (typeof src === 'object') {
    var options = src;
    sequence = options.sequence;
    src = options.source || options.from || options.account;
  }

  if (!UInt160.is_valid(src)) {
    throw new Error('Source address invalid');
  }

  this.tx_json.TransactionType = 'OfferCancel';
  this.tx_json.Account = UInt160.json_rewrite(src);
  this.tx_json.OfferSequence = Number(sequence);

  return this;
};

/**
 * Construct an 'OfferCreate transaction
 *
 * @param {String} account
 * @param {Amount} taker pays amount
 * @param {Amount} taker gets amount
 * @param [Number|Date]
 * @param [Number] sequence of an existing offer to replace
 */

Transaction.prototype.offerCreate = function(src, taker_pays, taker_gets, expiration, cancel_sequence) {
  if (typeof src === 'object') {
    var options = src;
    cancel_sequence = options.cancel_sequence || options.sequence;
    expiration = options.expiration;
    taker_gets = options.taker_gets || options.sell;
    taker_pays = options.taker_pays || options.buy;
    src = options.source || options.from || options.account;
  }

  if (!UInt160.is_valid(src)) {
    throw new Error('Source address invalid');
  }

  this.tx_json.TransactionType = 'OfferCreate';
  this.tx_json.Account = UInt160.json_rewrite(src);
  this.tx_json.TakerPays = Amount.json_rewrite(taker_pays);
  this.tx_json.TakerGets = Amount.json_rewrite(taker_gets);

  if (expiration) {
    this.tx_json.Expiration = utils.time.toRipple(expiration);
  }

  if (cancel_sequence) {
    this.tx_json.OfferSequence = Number(cancel_sequence);
  }

  return this;
};

/**
 * Construct a 'SetRegularKey' transaction
 *
 * If the RegularKey is set, the private key that corresponds to it can be
 * used to sign transactions instead of the master key
 *
 * The RegularKey must be a valid Ripple Address, or a Hash160 of the public
 * key corresponding to the new private signing key.
 *
 * @param {String} account
 * @param {String} regular key
 */

Transaction.prototype.setRegularKey = function(src, regular_key) {
  if (typeof src === 'object') {
    var options = src;
    src = options.address || options.account || options.from;
    regular_key = options.regular_key;
  }

  if (!UInt160.is_valid(src)) {
    throw new Error('Source address invalid');
  }

  if (!UInt160.is_valid(regular_key)) {
    throw new Error('RegularKey must be a valid Ripple Address');
  }

  this.tx_json.TransactionType = 'SetRegularKey';
  this.tx_json.Account = UInt160.json_rewrite(src);
  this.tx_json.RegularKey = UInt160.json_rewrite(regular_key);

  return this;
};

/**
 * Construct a 'Payment' transaction
 *
 * Relevant setters:
 *  - setPaths()
 *  - setBuildPath()
 *  - addPath()
 *  - setSourceTag()
 *  - setDestinationTag()
 *  - setSendMax()
 *  - setFlags()
 *
 *  @param {String} source account
 *  @param {StrinG} destination account
 *  @param {Amount} payment amount
 */

Transaction.prototype.payment = function(src, dst, amount) {
  if (typeof src === 'object') {
    var options = src;
    amount = options.amount;
    dst = options.destination || options.to;
    src = options.source || options.from || options.account;
  }

  if (!UInt160.is_valid(src)) {
    throw new Error('Payment source address invalid');
  }

  if (!UInt160.is_valid(dst)) {
    throw new Error('Payment destination address invalid');
  }

  this.tx_json.TransactionType = 'Payment';
  this.tx_json.Account = UInt160.json_rewrite(src);
  this.tx_json.Amount = Amount.json_rewrite(amount);
  this.tx_json.Destination = UInt160.json_rewrite(dst);

  return this;
};

/**
 * Construct a 'TrustSet' transaction
 *
 * @param {String} account
 * @param {Amount} limit
 * @param {Number} quality in
 * @param {Number} quality out
 */

Transaction.prototype.trustSet =
Transaction.prototype.rippleLineSet = function(src, limit, quality_in, quality_out) {
  if (typeof src === 'object') {
    var options = src;
    quality_out = options.quality_out;
    quality_in = options.quality_in;
    limit = options.limit;
    src = options.source || options.from || options.account;
  }

  if (!UInt160.is_valid(src)) {
    throw new Error('Source address invalid');
  }

  this.tx_json.TransactionType = 'TrustSet';
  this.tx_json.Account = UInt160.json_rewrite(src);

  if (limit !== void(0)) {
    this.tx_json.LimitAmount = Amount.json_rewrite(limit);
  }

  if (quality_in) {
    this.tx_json.QualityIn = quality_in;
  }

  if (quality_out) {
    this.tx_json.QualityOut = quality_out;
  }

  // XXX Throw an error if nothing is set.

  return this;
};

/**
 * Submit transaction to the network
 *
 * @param [Function] callback
 */

Transaction.prototype.submit = function(callback) {
  var self = this;

  this.callback = (typeof callback === 'function') ? callback : function(){};

  this._errorHandler = function transactionError(error, message) {
    if (!(error instanceof RippleError)) {
      error = new RippleError(error, message);
    }
    self.callback(error);
  };

  this._successHandler = function transactionSuccess(message) {
    self.callback(null, message);
  };

  if (!this.remote) {
    this.emit('error', new Error('No remote found'));
    return;
  }

  this.getManager().submit(this);

  return this;
};

Transaction.prototype.abort = function() {
  if (!this.finalized) {
    this.emit('error', new RippleError('tejAbort', 'Transaction aborted'));
  }
};

/**
 * Return summary object containing important information for persistence
 *
 * @return {Object} transaction summary
 */

Transaction.summary = function() {
  var result = {
    tx_json: this.tx_json,
    clientID: this._clientID,
    submittedIDs: this.submittedIDs,
    submissionAttempts: this.attempts,
    submitIndex: this.submitIndex,
    initialSubmitIndex: this.initialSubmitIndex,
    lastLedgerSequence: this.lastLedgerSequence,
    state: this.state,
    server: this._server ? this._server._opts.url : void(0),
    finalized: this.finalized
  };

  if (this.result) {
    result.result = {
      engine_result: this.result.engine_result,
      engine_result_message: this.result.engine_result_message,
      ledger_hash: this.result.ledger_hash,
      ledger_index: this.result.ledger_index,
      transaction_hash: this.result.tx_json.hash
    };
  }

  return result;
};

exports.Transaction = Transaction;

// vim:sw=2:sts=2:ts=8:et
