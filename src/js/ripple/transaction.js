// Transactions
//
//  Construction:
//    remote.transaction()  // Build a transaction object.
//     .offer_create(...)   // Set major parameters.
//     .set_flags()         // Set optional parameters.
//     .on()                // Register for events.
//     .submit();           // Send to network.
//
//  Events:
// 'success' : Transaction submitted without error.
// 'error' : Error submitting transaction.
// 'proposed' : Advisory proposed status transaction.
// - A client should expect 0 to multiple results.
// - Might not get back. The remote might just forward the transaction.
// - A success could be reverted in final.
// - local error: other remotes might like it.
// - malformed error: local server thought it was malformed.
// - The client should only trust this when talking to a trusted server.
// 'final' : Final status of transaction.
// - Only expect a final from dishonest servers after a tesSUCCESS or ter*.
// 'lost' : Gave up looking for on ledger_closed.
// 'pending' : Transaction was not found on ledger_closed.
// 'state' : Follow the state of a transaction.
//    'client_submitted'     - Sent to remote
//     |- 'remoteError'      - Remote rejected transaction.
//      \- 'client_proposed' - Remote provisionally accepted transaction.
//       |- 'client_missing' - Transaction has not appeared in ledger as expected.
//       | |\- 'client_lost' - No longer monitoring missing transaction.
//       |/
//       |- 'tesSUCCESS'     - Transaction in ledger as expected.
//       |- 'ter...'         - Transaction failed.
//       \- 'tec...'         - Transaction claimed fee only.
//
// Notes:
// - All transactions including those with local and malformed errors may be
//   forwarded anyway.
// - A malicous server can:
//   - give any proposed result.
//     - it may declare something correct as incorrect or something incorrect as correct.
//     - it may not communicate with the rest of the network.
//   - may or may not forward.
//

var EventEmitter     = require('events').EventEmitter;
var util             = require('util');
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

function Transaction(remote) {
  EventEmitter.call(this);

  var self = this;

  var remote = remote || void(0);

  this.remote = remote;

  // Transaction data
  this.tx_json = { Flags: 0 };

  this._secret = void(0);
  this._build_path = false;
  this._maxFee = (typeof remote === 'object') ? this.remote.max_fee : void(0);

  this.state = 'unsubmitted';
  this.finalized = false;
  this.previousSigningHash = void(0);

  // Index at which transaction was submitted
  this.submitIndex = void(0);

  // Canonical signing setting defaults to the Remote's configuration
  this.canonical = (typeof remote === 'object') ? Boolean(remote.canonical_signing) : true;

  // We aren't clever enough to eschew preventative measures so we keep an array
  // of all submitted transactionIDs (which can change due to load_factor
  // effecting the Fee amount). This should be populated with a transactionID
  // any time it goes on the network
  this.submittedIDs = [ ];

  this.once('success', function(message) {
    self.finalize(message);
    self.setState('validated');
    self.emit('cleanup', message);
  });

  this.once('error', function(message) {
    self.finalize(message);
    self.setState('failed');
    self.emit('cleanup', message);
  });

  this.once('submitted', function() {
    self.setState('submitted');
  });

  this.once('proposed', function() {
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

Transaction.formats = require('./binformat').tx;

Transaction.prototype.consts = {
  telLOCAL_ERROR:  -399,
  temMALFORMED:    -299,
  tefFAILURE:      -199,
  terRETRY:        -99,
  tesSUCCESS:      0,
  tecCLAIMED:      100
};

Transaction.from_json = function(j) {
  return (new Transaction()).parseJson(j);
};

Transaction.prototype.parseJson = function(v) {
  this.tx_json = v;
  return this;
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

Transaction.prototype.setState = function(state) {
  if (this.state !== state) {
    this.state = state;
    this.emit('state', state);
    this.emit('save');
  }
};

Transaction.prototype.finalize = function(message) {
  this.finalized = true;

  if (this.result) {
    this.result.ledger_index = message.ledger_index;
    this.result.ledger_hash  = message.ledger_hash;
  } else {
    this.result = message;
    this.result.tx_json = this.tx_json;
  }

  return this;
};

Transaction.prototype._accountSecret = function(account) {
  return this.remote ? this.remote.secrets[account] : void(0);
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
 */

Transaction.prototype.complete = function() {
  if (this.remote) {
    if (!this.remote.trusted && !this.remote.local_signing) {
      this.emit('error', new RippleError('tejServerUntrusted', 'Attempt to give secret to untrusted server'));
      return false;
    }
  }

  // Try to auto-fill the secret
  if (!this._secret && !(this._secret = this._accountSecret(this.tx_json.Account))) {
    this.emit('error', new RippleError('tejSecretUnknown', 'Missing secret'));
    return false;
  }

  if (typeof this.tx_json.SigningPubKey === 'undefined') {
    try {
      var seed = Seed.from_json(this._secret);
      var key  = seed.get_key(this.tx_json.Account);
      this.tx_json.SigningPubKey = key.to_hex_pub();
    } catch(e) {
      this.emit('error', new RippleError('tejSecretInvalid', 'Invalid secret'));
      return false;
    }
  }

  // If the Fee hasn't been set, one needs to be computed by
  // an assigned server
  if (this.remote && typeof this.tx_json.Fee === 'undefined') {
    if (this.remote.local_fee || !this.remote.trusted) {
      if (!(this.tx_json.Fee = this._computeFee())) {
        this.emit('error', new RippleError('tejUnconnected'));
        return;
      }
    }
  }

  if (Number(this.tx_json.Fee) > this._maxFee) {
    this.emit('error', new RippleError('tejMaxFeeExceeded', 'Max fee exceeded'));
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

Transaction.prototype.hash = function(prefix, as_uint256) {
  if (typeof prefix === 'string') {
    if (typeof hashprefixes[prefix] === 'undefined') {
      throw new Error('Unknown hashing prefix requested.');
    }
    prefix = hashprefixes[prefix];
  } else if (!prefix) {
    prefix = hashprefixes.HASH_TX_ID;
  }

  var hash = SerializedObject.from_json(this.tx_json).hash(prefix);

  return as_uint256 ? hash : hash.to_hex();
};

Transaction.prototype.sign = function(callback) {
  var callback = typeof callback === 'function' ? callback : function(){};
  var seed = Seed.from_json(this._secret);

  var prev_sig = this.tx_json.TxnSignature;
  delete this.tx_json.TxnSignature;

  var hash = this.signingHash();

  // If the hash is the same, we can re-use the previous signature
  if (prev_sig && hash === this.previousSigningHash) {
    this.tx_json.TxnSignature = prev_sig;
    callback();
    return this;
  }

  var key = seed.get_key(this.tx_json.Account);
  var sig = key.sign(hash, 0);
  var hex = sjcl.codec.hex.fromBits(sig).toUpperCase();

  this.tx_json.TxnSignature = hex;
  this.previousSigningHash = hash;

  callback();

  return this;
};

/**
 * Add a ID to list of submitted IDs for this transaction
 */

Transaction.prototype.addId = function(hash) {
  if (this.submittedIDs.indexOf(hash) === -1) {
    this.submittedIDs.unshift(hash);
    this.emit('signed', hash);
    this.emit('save');
  }
};

/**
 * Find ID within list of submitted IDs for this transaction
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

//
// Set options for Transactions
//

// --> build: true, to have server blindly construct a path.
//
// "blindly" because the sender has no idea of the actual cost except that is must be less than send max.
Transaction.prototype.buildPath = function(build) {
  this._build_path = build;
  return this;
};

// tag should be undefined or a 32 bit integer.
// YYY Add range checking for tag.
Transaction.prototype.destinationTag = function(tag) {
  if (tag !== void(0)) {
    this.tx_json.DestinationTag = tag;
  }
  return this;
};

Transaction.prototype.invoiceID = function(id) {
  if (typeof id === 'string') {
    while (id.length < 64) {
      id += '0';
    }
    this.tx_json.InvoiceID = id;
  }
  return this;
};

Transaction.prototype.clientID = function(id) {
  if (typeof id === 'string') {
    this._clientID = id;
  }
  return this;
};

Transaction.prototype.lastLedger = function(sequence) {
  if (typeof sequence === 'number' && isFinite(sequence)) {
    this._setLastLedger = true;
    this.tx_json.LastLedgerSequence = sequence;
  }
  return this;
};

/*
 * Set the transaction's proposed fee. No op when fee parameter
 * is not 0 or a positive number
 *
 * @param {Number} fee The proposed fee
 *
 * @returns {Transaction} calling instance for chaining
 */
Transaction.prototype.maxFee = function(fee) {
  if (typeof fee === 'number' && fee >= 0) {
    this._setMaxFee = true;
    this._maxFee = fee;
  }

  return this;
};

Transaction._pathRewrite = function(path) {
  if (!Array.isArray(path)) {
    return;
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

Transaction.prototype.pathAdd = function(path) {
  if (Array.isArray(path)) {
    this.tx_json.Paths  = this.tx_json.Paths || [];
    this.tx_json.Paths.push(Transaction._pathRewrite(path));
  }
  return this;
};

// --> paths: undefined or array of path
// // A path is an array of objects containing some combination of: account, currency, issuer

Transaction.prototype.paths = function(paths) {
  if (Array.isArray(paths)) {
    for (var i=0, l=paths.length; i<l; i++) {
      this.pathAdd(paths[i]);
    }
  }
  return this;
};

// If the secret is in the config object, it does not need to be provided.
Transaction.prototype.secret = function(secret) {
  this._secret = secret;
  return this;
};

Transaction.prototype.sendMax = function(send_max) {
  if (send_max) {
    this.tx_json.SendMax = Amount.json_rewrite(send_max);
  }
  return this;
};

// tag should be undefined or a 32 bit integer.
// YYY Add range checking for tag.
Transaction.prototype.sourceTag = function(tag) {
  if (tag) {
    this.tx_json.SourceTag = tag;
  }
  return this;
};

// --> rate: In billionths.
Transaction.prototype.transferRate = function(rate) {
  this.tx_json.TransferRate = Number(rate);

  if (this.tx_json.TransferRate < 1e9) {
    throw new Error('invalidTransferRate');
  }

  return this;
};

// Add flags to a transaction.
// --> flags: undefined, _flag_, or [ _flags_ ]
Transaction.prototype.setFlags = function(flags) {
  if (flags === void(0)) {
    return this;
  }

  if (typeof flags === 'number') {
    this.tx_json.Flags = flags;
    return this;
  }

  var flag_set = Array.isArray(flags) ? flags : Array.prototype.slice.call(arguments);
  var transaction_flags = Transaction.flags[this.tx_json.TransactionType] || { };

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
 * Add a Memo to transaction. Memos can be used as key-value,
 * using the MemoType as a key
 *
 * @param {String} type
 * @param {String} data
 */

Transaction.prototype.addMemo = function(type, data) {
  if (!/(undefined|string)/.test(typeof type)) {
    throw new Error('MemoType must be a string');
  }

  if (!/(undefined|string)/.test(typeof data)) {
    throw new Error('MemoData must be a string');
  }

  function toHex(str) {
    return sjcl.codec.hex.fromBits(sjcl.codec.utf8String.toBits(str));
  };

  var memo = { };

  if (type) {
    if (Transaction.MEMO_TYPES[type]) {
      //XXX Maybe in the future we want a schema validator for
      //memo types
      memo.MemoType = Transaction.MEMO_TYPES[type];
    } else {
      memo.MemoType = toHex(type);
    }
  }

  if (data) {
    memo.MemoData = toHex(data);
  }

  this.tx_json.Memos = (this.tx_json.Memos || []).concat({ Memo: memo });

  return this;
};

// Options:
//  .domain()           NYI
//  .flags()
//  .message_key()      NYI
//  .transfer_rate()
//  .wallet_locator()   NYI
//  .wallet_size()      NYI

/**
 *  Construct an 'AccountSet' transaction.
 *
 *  Note that bit flags can be set using the .setFlags() method
 *  but for 'AccountSet' transactions there is an additional way to
 *  modify AccountRoot flags. The values available for the SetFlag 
 *  and ClearFlag are as follows:
 *
 *  "asfRequireDest"
 *    Require a destination tag
 *  "asfRequireAuth"
 *    Authorization is required to extend trust
 *  "asfDisallowXRP"
 *    XRP should not be sent to this account
 *  "asfDisableMaster"
 *    Disallow use of the master key
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

  this.tx_json.TransactionType  = 'AccountSet';
  this.tx_json.Account          = UInt160.json_rewrite(src);

  var SetClearFlags = Transaction.set_clear_flags.AccountSet;

  function prepareFlag(flag) {
    return (typeof flag === 'number') ? flag : (SetClearFlags[flag] || SetClearFlags['asf' + flag]);
  };

  if (set_flag && (set_flag = prepareFlag(set_flag))) {
    this.tx_json.SetFlag = set_flag;
  }

  if (clear_flag && (clear_flag = prepareFlag(clear_flag))) {
    this.tx_json.ClearFlag = clear_flag;
  }

  return this;
};

Transaction.prototype.claim = function(src, generator, public_key, signature) {
  if (typeof src === 'object') {
    var options = src;
    signature  = options.signature;
    public_key = options.public_key;
    generator  = options.generator;
    src        = options.source || options.from || options.account;
  }

  this.tx_json.TransactionType = 'Claim';
  this.tx_json.Generator       = generator;
  this.tx_json.PublicKey       = public_key;
  this.tx_json.Signature       = signature;

  return this;
};

Transaction.prototype.offerCancel = function(src, sequence) {
  if (typeof src === 'object') {
    var options = src;
    sequence = options.sequence;
    src      = options.source || options.from || options.account;
  }

  if (!UInt160.is_valid(src)) {
    throw new Error('Source address invalid');
  }

  this.tx_json.TransactionType = 'OfferCancel';
  this.tx_json.Account         = UInt160.json_rewrite(src);
  this.tx_json.OfferSequence   = Number(sequence);

  return this;
};

// Options:
//  .set_flags()
// --> expiration : if not undefined, Date or Number
// --> cancel_sequence : if not undefined, Sequence
Transaction.prototype.offerCreate = function(src, taker_pays, taker_gets, expiration, cancel_sequence) {
  if (typeof src === 'object') {
    var options = src;
    cancel_sequence = options.cancel_sequence;
    expiration      = options.expiration;
    taker_gets      = options.taker_gets || options.sell;
    taker_pays      = options.taker_pays || options.buy;
    src             = options.source || options.from || options.account;
  }

  if (!UInt160.is_valid(src)) {
    throw new Error('Source address invalid');
  }

  this.tx_json.TransactionType = 'OfferCreate';
  this.tx_json.Account         = UInt160.json_rewrite(src);
  this.tx_json.TakerPays       = Amount.json_rewrite(taker_pays);
  this.tx_json.TakerGets       = Amount.json_rewrite(taker_gets);

  if (expiration) {
    this.tx_json.Expiration = utils.time.toRipple(expiration);
  }

  if (cancel_sequence) {
    this.tx_json.OfferSequence = Number(cancel_sequence);
  }

  return this;
};

/**
 *  Construct a 'SetRegularKey' transaction.
 *  If the RegularKey is set, the private key that corresponds to
 *  it can be used to sign transactions instead of the master key
 *
 *  The RegularKey must be a valid Ripple Address, or a Hash160 of
 *  the public key corresponding to the new private signing key.
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
    throw new Error('RegularKey must be a valid Ripple Address (a Hash160 of the public key)');
  }

  this.tx_json.TransactionType = 'SetRegularKey';
  this.tx_json.Account = UInt160.json_rewrite(src);
  this.tx_json.RegularKey = UInt160.json_rewrite(regular_key);

  return this;
};

// Construct a 'payment' transaction.
//
// When a transaction is submitted:
// - If the connection is reliable and the server is not merely forwarding and is not malicious,
// --> src : UInt160 or String
// --> dst : UInt160 or String
// --> deliver_amount : Amount or String.
//
// Options:
//  .paths()
//  .build_path()
//  .destination_tag()
//  .path_add()
//  .secret()
//  .send_max()
//  .set_flags()
//  .source_tag()
Transaction.prototype.payment = function(src, dst, amount) {
  if (typeof src === 'object') {
    var options = src;
    amount = options.amount;
    dst    = options.destination || options.to;
    src    = options.source || options.from || options.account;
  }

  if (!UInt160.is_valid(src)) {
    throw new Error('Payment source address invalid');
  }

  if (!UInt160.is_valid(dst)) {
    throw new Error('Payment destination address invalid');
  }

  this.tx_json.TransactionType = 'Payment';
  this.tx_json.Account         = UInt160.json_rewrite(src);
  this.tx_json.Amount          = Amount.json_rewrite(amount);
  this.tx_json.Destination     = UInt160.json_rewrite(dst);

  return this;
};

Transaction.prototype.trustSet =
Transaction.prototype.rippleLineSet = function(src, limit, quality_in, quality_out) {
  if (typeof src === 'object') {
    var options = src;
    quality_out = options.quality_out;
    quality_in  = options.quality_in;
    limit       = options.limit;
    src         = options.source || options.from || options.account;
  }

  if (!UInt160.is_valid(src)) {
    throw new Error('Source address invalid');
  }

  this.tx_json.TransactionType = 'TrustSet';
  this.tx_json.Account         = UInt160.json_rewrite(src);

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

// Submit a transaction to the network.
Transaction.prototype.submit = function(callback) {
  var self = this;

  this.callback = (typeof callback === 'function') ? callback : function(){};

  function transactionError(error, message) {
    if (!(error instanceof RippleError)) {
      error = new RippleError(error, message);
    }
    self.callback(error);
  };

  this._errorHandler = transactionError;

  function transactionSuccess(message) {
    self.callback(null, message);
  };

  this._successHandler = transactionSuccess;

  this.on('error', function(){});

  var account = this.tx_json.Account;

  if (!this.remote) {
    return this.emit('error', new Error('No remote found'));
  }

  if (!UInt160.is_valid(account)) {
    return this.emit('error', new RippleError('tejInvalidAccount', 'Account is missing or invalid'));
  }

  // YYY Might check paths for invalid accounts.
  this.remote.account(account).submit(this);

  return this;
};

Transaction.prototype.abort = function(callback) {
  var callback = (typeof callback === 'function') ? callback : function(){};
  if (!this.finalized) {
    this.once('final', callback);
    this.emit('abort');
  }
};

Transaction.prototype.summary = function() {
  return Transaction.summary.call(this);
};

Transaction.summary = function() {
  var result = {
    tx_json:             this.tx_json,
    clientID:            this._clientID,
    submittedIDs:        this.submittedIDs,
    submissionAttempts:  this.attempts,
    submitIndex:         this.submitIndex,
    initialSubmitIndex:  this.initialSubmitIndex,
    lastLedgerSequence:  this.lastLedgerSequence,
    state:               this.state,
    server:              this._server ? this._server._opts.url : void(0),
    finalized:           this.finalized
  };

  if (this.result) {
    result.result = {
      engine_result        : this.result.engine_result,
      engine_result_message: this.result.engine_result_message,
      ledger_hash          : this.result.ledger_hash,
      ledger_index         : this.result.ledger_index,
      transaction_hash     : this.result.tx_json.hash
    };
  }

  return result;
};

exports.Transaction = Transaction;

// vim:sw=2:sts=2:ts=8:et
