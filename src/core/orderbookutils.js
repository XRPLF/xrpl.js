'use strict';

const _ = require('lodash');
const assert = require('assert');
const constants = require('./constants');
const Amount = require('./amount').Amount;
const Currency = require('./currency').Currency;
const {IOUValue} = require('ripple-lib-value');
const binary = require('ripple-binary-codec');
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

function createAmount(value, currency_, counterparty) {
  assert(_.isString(counterparty), 'counterparty must be a string');

  const currency = currency_ instanceof Currency ?
    currency_ :
    Currency.from_json(currency_);

  return Amount.from_components_unsafe(new IOUValue(value),
    currency, counterparty, false);
}

/**
* Gets currency for getOfferTaker(Gets/Pays)Funded
* @param offer
* @return currency
*/

function getCurrencyFromOffer(offer) {
  return offer.TakerPays.currency || offer.TakerGets.currency;
}

/**
* Gets issuer for getOfferTaker(Gets/Pays)Funded
* @param offer
* @return issuer
*/

function getIssuerFromOffer(offer) {
  return offer.TakerPays.issuer || offer.TakerGets.issuer;
}

/**
 * Casts and returns offer's taker gets funded amount as a default IOU amount
 *
 * @param {Object} offer
 * @return {Amount}
 */

OrderBookUtils.getOfferTakerGetsFunded = function(offer, currency_, issuer_) {
  assertValidNumber(offer.taker_gets_funded, 'Taker gets funded is invalid');

  const currency = currency_ || getCurrencyFromOffer(offer);
  const issuer = issuer_ || getIssuerFromOffer(offer);

  return createAmount(offer.taker_gets_funded, currency, issuer);
};

/**
 * Casts and returns offer's taker pays funded amount as a default IOU amount
 *
 * @param {Object} offer
 * @return {Amount}
 */

OrderBookUtils.getOfferTakerPaysFunded = function(offer, currency_, issuer_) {
  assertValidNumber(offer.taker_pays_funded, 'Taker gets funded is invalid');

  const currency = currency_ || getCurrencyFromOffer(offer);
  const issuer = issuer_ || getIssuerFromOffer(offer);

  return createAmount(offer.taker_pays_funded, currency, issuer);
};

/**
 * Get offer taker gets amount
 *
 * @param {Object} offer
 *
 * @return {Amount}
 */

OrderBookUtils.getOfferTakerGets = function(offer, currency_, issuer_) {
  assert(typeof offer, 'object', 'Offer is invalid');

  const currency = currency_ || offer.TakerPays.currency;
  const issuer = issuer_ || offer.TakerPays.issuer;

  return createAmount(offer.TakerGets, currency, issuer);
};

/**
 * Retrieve offer quality
 *
 * @param {Object} offer
 * @param {Currency} currencyGets
 */

OrderBookUtils.getOfferQuality = function(offer, currency_, issuer_) {
  const currency = currency_ || getCurrencyFromOffer(offer);
  const issuer = issuer_ || getIssuerFromOffer(offer);
  return createAmount(offer.quality, currency, issuer);
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
  return OrderBookUtils.convertOfferQualityToHex(quality.to_text());
};

/**
 * Formats an offer quality amount to a hex that can be parsed by
 * Amount.parse_quality
 *
 * @param {String} quality
 *
 * @return {String}
 */

OrderBookUtils.convertOfferQualityToHexFromText = function(quality) {
  return binary.encodeQuality(quality);
};

OrderBookUtils.CURRENCY_ONE = Currency.from_json(1);

OrderBookUtils.ISSUER_ONE = constants.ACCOUNT_ONE;

/**
 *
 */

OrderBookUtils.normalizeAmount = function(value) {
  return Amount.from_components_unsafe(new IOUValue(value),
    OrderBookUtils.CURRENCY_ONE, OrderBookUtils.ISSUER_ONE, false);
};

module.exports = OrderBookUtils;
