'use strict';

const _ = require('lodash');
const assert = require('assert');
const SerializedObject = require('./serializedobject').SerializedObject;
const Types = require('./serializedtypes');
const Amount = require('./amount').Amount;
const Currency = require('./currency').Currency;
const UInt160 = require('./uint160').UInt160;
const IOUValue = require('./iouvalue').IOUValue;
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

function createAmount(value, currency_, counterparty_) {

  const currency = currency_ instanceof Currency ?
    currency_ :
    Currency.from_json(currency_);

  const counterparty = counterparty_ instanceof UInt160 ?
    counterparty_ :
    UInt160.from_json(counterparty_);

  return Amount.createFast(new IOUValue(value), currency, counterparty, false);
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

OrderBookUtils.getOfferQuality = function(offer, currencyGets, currency_,
  issuer_
) {
  let amount;

  if (currencyGets.has_interest()) {
    // XXX Should use Amount#from_quality
    amount = Amount.from_json(
      offer.TakerPays
    ).ratio_human(offer.TakerGets, {
      reference_date: new Date()
    });
  } else {

    const currency = currency_ || getCurrencyFromOffer(offer);
    const issuer = issuer_ || getIssuerFromOffer(offer);

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
 * Formats an offer quality amount to a hex that can be parsed by
 * Amount.parse_quality
 *
 * @param {String} quality
 *
 * @return {String}
 */

OrderBookUtils.convertOfferQualityToHexFromText = function(quality) {

  const so = new SerializedObject();
  Types.Quality.serialize(so, quality);

  return so.to_hex();
};


OrderBookUtils.CURRENCY_ONE = Currency.from_json(1);

OrderBookUtils.ISSUER_ONE = UInt160.from_json(1);

/**
 *
 */

OrderBookUtils.normalizeAmount = function(value) {
  return Amount.createFast(new IOUValue(value), OrderBookUtils.CURRENCY_ONE,
    OrderBookUtils.ISSUER_ONE, false);
};

module.exports = OrderBookUtils;
