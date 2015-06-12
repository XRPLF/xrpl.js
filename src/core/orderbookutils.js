'use strict';

const _ = require('lodash');
const assert = require('assert');
const SerializedObject = require('./serializedobject').SerializedObject;
const Types = require('./serializedtypes');
const Amount = require('./amount').Amount;
const OrderBookUtils = {};

function assertValidNumber(number, message) {
  assert(!_.isNull(number) && !isNaN(number), message);
}

/**
* Creates a JSON amount object using
* passed parameters for value, currency and counterparty
* if currency or counterparty is undefined, defaults to IOU
*
* @param amount of value, currency, counterparty
* @return JSON amount object
*/

function createAmount(value, currency, counterparty) {
  if (currency === undefined || counterparty === undefined) {
    return {'value': value,
      'currency': '000',
      'issuer': 'rrrrrrrrrrrrrrrrrrrrrhoLvTp'};
  }
  return {'value': value, 'currency': currency, 'issuer': counterparty};
}


/**
 * Casts and returns offer's taker gets funded amount as a default IOU amount
 *
 * @param {Object} offer
 * @return {Amount}
 */

OrderBookUtils.getOfferTakerGetsFunded = function(offer) {
  assertValidNumber(offer.taker_gets_funded, 'Taker gets funded is invalid');

  let currency = offer.TakerPays.currency;
  let issuer = offer.TakerPays.issuer;

  if (currency === undefined || issuer === undefined) {
    currency = offer.TakerGets.currency;
    issuer = offer.TakerGets.issuer;
  }

  return Amount.from_json(
    createAmount(offer.taker_gets_funded, currency, issuer));
};

/**
 * Casts and returns offer's taker pays funded amount as a default IOU amount
 *
 * @param {Object} offer
 * @return {Amount}
 */

OrderBookUtils.getOfferTakerPaysFunded = function(offer) {
  assertValidNumber(offer.taker_pays_funded, 'Taker gets funded is invalid');

  let currency = offer.TakerGets.currency;
  let issuer = offer.TakerGets.issuer;

  if (currency === undefined || issuer === undefined) {
    currency = offer.TakerPays.currency;
    issuer = offer.TakerPays.issuer;
  }

  return Amount.from_json(
    createAmount(offer.taker_pays_funded, currency, issuer));
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

  let currency = offer.TakerPays.currency;
  let issuer = offer.TakerPays.issuer;

  return Amount.from_json(createAmount(offer.TakerGets, currency, issuer));
};

/**
 * Retrieve offer quality
 *
 * @param {Object} offer
 * @param {Currency} currencyGets
 */

OrderBookUtils.getOfferQuality = function(offer, currencyGets) {
  let amount;

  if (currencyGets.has_interest()) {
    // XXX Should use Amount#from_quality
    amount = Amount.from_json(
      offer.TakerPays
    ).ratio_human(offer.TakerGets, {
      reference_date: new Date()
    });
  } else {

    let currency = offer.TakerGets.currency;
    let issuer = offer.TakerGets.issuer;

    if (currency === undefined || issuer === undefined) {
      currency = offer.TakerPays.currency;
      issuer = offer.TakerPays.issuer;
    }

    amount = Amount.from_json(createAmount(offer.quality, currency, issuer));
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

  let so = new SerializedObject();
  Types.Quality.serialize(so, quality.to_text());

  return so.to_hex();
};

/**
 *
 */

OrderBookUtils.normalizeAmount = function(value) {

  return Amount.from_json(createAmount(value));
};

module.exports = OrderBookUtils;
