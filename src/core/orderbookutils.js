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
* Creates a new Amount from a JSON amount object using
* passed parameters for value, currency and counterparty
*
* @param amount of value, currency, counterparty
* @return JSON amount object
*/

function createAmount(value, currency, counterparty) {
  const newJSON =
  {'value': value, 'currency': currency, 'issuer': counterparty};
  return Amount.from_json(newJSON);
}

/**
* Gets currency for getOfferTaker(Gets/Pays)Funded
* @param offer
* @return currency
*/

function getCurrencyFromOffer(offer) {
  let currency = offer.TakerPays.currency;

  if (!currency) {
    currency = offer.TakerGets.currency;
  }
  return currency;
}

/**
* Gets issuer for getOfferTaker(Gets/Pays)Funded
* @param offer
* @return issuer
*/

function getIssuerFromOffer(offer) {
  let issuer = offer.TakerPays.issuer;

  if (!issuer) {
    issuer = offer.TakerGets.issuer;
  }
  return issuer;
}

/**
 * Casts and returns offer's taker gets funded amount as a default IOU amount
 *
 * @param {Object} offer
 * @return {Amount}
 */

OrderBookUtils.getOfferTakerGetsFunded = function(offer) {
  assertValidNumber(offer.taker_gets_funded, 'Taker gets funded is invalid');

  const currency = getCurrencyFromOffer(offer);
  const issuer = getIssuerFromOffer(offer);

  return createAmount(offer.taker_gets_funded, currency, issuer);
};

/**
 * Casts and returns offer's taker pays funded amount as a default IOU amount
 *
 * @param {Object} offer
 * @return {Amount}
 */

OrderBookUtils.getOfferTakerPaysFunded = function(offer) {
  assertValidNumber(offer.taker_pays_funded, 'Taker gets funded is invalid');

  const currency = getCurrencyFromOffer(offer);
  const issuer = getIssuerFromOffer(offer);

  return createAmount(offer.taker_pays_funded, currency, issuer);
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

  const currency = offer.TakerPays.currency;
  const issuer = offer.TakerPays.issuer;

  return createAmount(offer.TakerGets, currency, issuer);
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

    const currency = getCurrencyFromOffer(offer);
    const issuer = getIssuerFromOffer(offer);

    amount = createAmount(offer.quality, currency, issuer);
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

  const so = new SerializedObject();
  Types.Quality.serialize(so, quality.to_text());

  return so.to_hex();
};

/**
 *
 */

OrderBookUtils.normalizeAmount = function(value) {

  return Amount.from_number(value);
};

module.exports = OrderBookUtils;
