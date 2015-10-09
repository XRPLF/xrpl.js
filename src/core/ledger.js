'use strict';
const sha512half = require('./utils').sha512half;
const BigNumber = require('bignumber.js');
const hashprefixes = require('./hashprefixes');
const SHAMap = require('./shamap').SHAMap;
const SHAMapTreeNode = require('./shamap').SHAMapTreeNode;
const {decodeAddress} = require('ripple-address-codec');
const binary = require('ripple-binary-codec');

function Ledger() {
  this.ledger_json = {};
}

Ledger.from_json = function(v) {
  const ledger = new Ledger();
  ledger.parse_json(v);
  return ledger;
};

Ledger.space = require('./ledgerspaces');

function hash(hex) {
  return sha512half(new Buffer(hex, 'hex'));
}

function hashTransaction(txBlobHex) {
  const prefix = hashprefixes.HASH_TX_ID.toString(16).toUpperCase();
  return hash(prefix + txBlobHex);
}

function padLeftZero(string, length) {
  return Array(length - string.length + 1).join('0') + string;
}

function intToHex(integer, byteLength) {
  return padLeftZero(Number(integer).toString(16), byteLength * 2);
}

function bytesToHex(bytes) {
  return (new Buffer(bytes)).toString('hex');
}

function bigintToHex(integerString, byteLength) {
  const hex = (new BigNumber(integerString)).toString(16);
  return padLeftZero(hex, byteLength * 2);
}

function addressToHex(address) {
  return (new Buffer(decodeAddress(address))).toString('hex');
}

function currencyToHex(currency) {
  if (currency.length === 3) {
    const bytes = new Array(20 + 1).join('0').split('').map(parseFloat);
    bytes[12] = currency.charCodeAt(0) & 0xff;
    bytes[13] = currency.charCodeAt(1) & 0xff;
    bytes[14] = currency.charCodeAt(2) & 0xff;
    return bytesToHex(bytes);
  }
  return currency;
}

/**
 * Generate the key for an AccountRoot entry.
 *
 * @param {String|UInt160} accountArg - Ripple Account
 * @return {UInt256}
 */
Ledger.calcAccountRootEntryHash =
Ledger.prototype.calcAccountRootEntryHash = function(address) {
  const prefix = '00' + intToHex(Ledger.space.account.charCodeAt(0), 1);
  return hash(prefix + addressToHex(address));
};

/**
 * Generate the key for an Offer entry.
 *
 * @param {String|UInt160} accountArg - Ripple Account
 * @param {Number} sequence - Sequence number of the OfferCreate transaction
 *   that instantiated this offer.
 * @return {UInt256}
 */
Ledger.calcOfferEntryHash =
Ledger.prototype.calcOfferEntryHash = function(address, sequence) {
  const prefix = '00' + intToHex(Ledger.space.offer.charCodeAt(0), 1);
  return hash(prefix + addressToHex(address) + intToHex(sequence, 4));
};

/**
 * Generate the key for a RippleState entry.
 *
 * The ordering of the two account parameters does not matter.
 *
 * @param {String|UInt160} _account1 - First Ripple Account
 * @param {String|UInt160} _account2 - Second Ripple Account
 * @param {String|Currency} _currency - The currency code
 * @return {UInt256}
 */
Ledger.calcRippleStateEntryHash =
Ledger.prototype.calcRippleStateEntryHash = function(
    address1, address2, currency) {
  const address1Hex = addressToHex(address1);
  const address2Hex = addressToHex(address2);

  const swap = (new BigNumber(address1Hex, 16)).greaterThan(
    new BigNumber(address2Hex, 16));
  const lowAddressHex = swap ? address2Hex : address1Hex;
  const highAddressHex = swap ? address1Hex : address2Hex;

  const prefix = '00' + intToHex(Ledger.space.rippleState.charCodeAt(0), 1);
  return hash(prefix + lowAddressHex + highAddressHex +
              currencyToHex(currency));
};

Ledger.prototype.parse_json = function(v) {
  this.ledger_json = v;
};

function addLengthPrefix(hex) {
  const length = hex.length / 2;
  if (length <= 192) {
    return bytesToHex([length]) + hex;
  } else if (length <= 12480) {
    const x = length - 193;
    return bytesToHex([193 + (x >>> 8), x & 0xff]) + hex;
  } else if (length <= 918744) {
    const x = length - 12481;
    return bytesToHex([241 + (x >>> 16), x >>> 8 & 0xff, x & 0xff]) + hex;
  }
  throw new Error('Variable integer overflow.');
}

Ledger.prototype.calc_tx_hash = function() {
  const tx_map = new SHAMap();

  this.ledger_json.transactions.forEach(function(tx_json) {
    const txBlobHex = binary.encode(tx_json);
    const metaHex = binary.encode(tx_json.metaData);
    const txHash = hashTransaction(txBlobHex);
    const data = addLengthPrefix(txBlobHex) + addLengthPrefix(metaHex);
    tx_map.add_item(txHash, data, SHAMapTreeNode.TYPE_TRANSACTION_MD);
  });

  return tx_map.hash();
};

/**
* @param {Object} options - object
*
* @param {Boolean} [options.sanity_test=false] - If `true`, will serialize each
*   accountState item to binary and then back to json before finally
*   serializing for hashing. This is mostly to expose any issues with
*   ripple-lib's binary <--> json codecs.
*
* @return {UInt256} - hash of shamap
*/
Ledger.prototype.calc_account_hash = function() {
  const account_map = new SHAMap();

  this.ledger_json.accountState.forEach(function(ledgerEntry) {
    const data = binary.encode(ledgerEntry);
    account_map.add_item(ledgerEntry.index, data,
      SHAMapTreeNode.TYPE_ACCOUNT_STATE);
  });

  return account_map.hash();
};

// see rippled Ledger::updateHash()
Ledger.calculateLedgerHash =
Ledger.prototype.calculateLedgerHash = function(ledgerHeader) {
  const prefix = '4C575200';
  return hash(prefix +
    intToHex(ledgerHeader.ledger_index, 4) +
    bigintToHex(ledgerHeader.total_coins, 8) +
    ledgerHeader.parent_hash +
    ledgerHeader.transaction_hash +
    ledgerHeader.account_hash +
    intToHex(ledgerHeader.parent_close_time, 4) +
    intToHex(ledgerHeader.close_time, 4) +
    intToHex(ledgerHeader.close_time_resolution, 1) +
    intToHex(ledgerHeader.close_flags, 1)
  );
};

exports.Ledger = Ledger;
