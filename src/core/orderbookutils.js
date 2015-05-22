'use strict';

var _ = require('lodash');
var assert = require('assert');
var SerializedObject = require('./serializedobject').SerializedObject;
var Types = require('./serializedtypes');
var Amount = require('./amount').Amount;

var IOU_SUFFIX = '/000/rrrrrrrrrrrrrrrrrrrrrhoLvTp';
var OrderBookUtils = {};

function assertValidNumber(number, message) {
  assert(!_.isNull(number) && !isNaN(number), message);
}

/**
 * Casts and returns offer's taker gets funded amount as a default IOU amount
 *
 * @param {Object} offer
 * @return {Amount}
 */

OrderBookUtils.getOfferTakerGetsFunded = function(offer) {
  assertValidNumber(offer.taker_gets_funded, 'Taker gets funded is invalid');

  return Amount.from_json(offer.taker_gets_funded + IOU_SUFFIX);
};

/**
 * Casts and returns offer's taker pays funded amount as a default IOU amount
 *
 * @param {Object} offer
 * @return {Amount}
 */

OrderBookUtils.getOfferTakerPaysFunded = function(offer) {
  assertValidNumber(offer.taker_pays_funded, 'Taker gets funded is invalid');

  return Amount.from_json(offer.taker_pays_funded + IOU_SUFFIX);
};

/**
 * Get offer taker gets amount
 *
 * @param {Object} offer
 *
 * @return {Amount}
 */

OrderBookUtils.getOfferTakerGets = function(offer) {
  assert(typeof offer, 'object', 'Offer is invalid');

  return Amount.from_json(offer.TakerGets + IOU_SUFFIX);
};

/**
 * Retrieve offer quality
 *
 * @param {Object} offer
 * @param {Currency} currencyGets
 */

OrderBookUtils.getOfferQuality = function(offer, currencyGets) {
  var amount;

  if (currencyGets.has_interest()) {
    // XXX Should use Amount#from_quality
    amount = Amount.from_json(
      offer.TakerPays
    ).ratio_human(offer.TakerGets, {
      reference_date: new Date()
    });
  } else {
    amount = Amount.from_json(offer.quality + IOU_SUFFIX);
  }

  return amount;
};

/**
 * Formats an offer quality amount to a hex that can be parsed by
 * Amount.parse_quality
 *
 * @param {Amount} quality
 *
 * @return {String}
 */

OrderBookUtils.convertOfferQualityToHex = function(quality) {
  assert(quality instanceof Amount, 'Quality is not an amount');

  var so = new SerializedObject();
  Types.Quality.serialize(so, quality.to_text() + IOU_SUFFIX);

  return so.to_hex();
};

/**
 *
 */

OrderBookUtils.normalizeAmount = function(value) {
  return Amount.from_json(value + IOU_SUFFIX);
};

module.exports = OrderBookUtils;
