'use strict';

const _ = require('lodash');
const assert = require('assert');
const UInt160 = require('./uint160').UInt160;
const Amount = require('./amount').Amount;
const Utils = require('./orderbookutils');

function assertValidNumber(number, message) {
  assert(!_.isNull(number) && !isNaN(number), message);
}

function assertValidLegOneOffer(legOneOffer, message) {
  assert(legOneOffer);
  assert.strictEqual(typeof legOneOffer, 'object', message);
  assert.strictEqual(typeof legOneOffer.TakerPays, 'object', message);
  assertValidNumber(legOneOffer.TakerGets, message);
}

function AutobridgeCalculator(currencyGets, currencyPays,
  legOneOffers, legTwoOffers, issuerGets, issuerPays
) {
  this._currencyGets = currencyGets;
  this._currencyPays = currencyPays;
  this._currencyGetsHex = currencyGets.to_hex();
  this._currencyPaysHex = currencyPays.to_hex();
  this._issuerGets = issuerGets;
  this._issuerGetsObj = UInt160.from_json(issuerGets);
  this._issuerPays = issuerPays;
  this._issuerPaysObj = UInt160.from_json(issuerPays);
  this.legOneOffers = _.cloneDeep(legOneOffers);
  this.legTwoOffers = _.cloneDeep(legTwoOffers);

  this._ownerFundsLeftover = {};
}

const NULL_AMOUNT = Utils.normalizeAmount('0');

/**
 * Calculates an ordered array of autobridged offers by quality
 *
 * @return {Array}
 */

AutobridgeCalculator.prototype.calculate = function() {
  const oldMode = Amount.strict_mode;
  Amount.strict_mode = false;

  let legOnePointer = 0;
  let legTwoPointer = 0;

  const offersAutobridged = [];

  this.clearOwnerFundsLeftover();

  while (this.legOneOffers[legOnePointer] && this.legTwoOffers[legTwoPointer]) {
    const legOneOffer = this.legOneOffers[legOnePointer];
    const legTwoOffer = this.legTwoOffers[legTwoPointer];
    const leftoverFunds = this.getLeftoverOwnerFunds(legOneOffer.Account);
    let autobridgedOffer;

    if (legOneOffer.Account === legTwoOffer.Account) {
      this.unclampLegOneOwnerFunds(legOneOffer);
    } else if (!legOneOffer.is_fully_funded && !leftoverFunds.is_zero()) {
      this.adjustLegOneFundedAmount(legOneOffer);
    }

    const legOneTakerGetsFunded = Utils.getOfferTakerGetsFunded(legOneOffer,
      this._currencyPays, this._issuerPaysObj);
    const legTwoTakerPaysFunded = Utils.getOfferTakerPaysFunded(legTwoOffer,
      this._currencyGets, this._issuerGetsObj);

    if (legOneTakerGetsFunded.is_zero()) {
      legOnePointer++;

      continue;
    }

    if (legTwoTakerPaysFunded.is_zero()) {
      legTwoPointer++;

      continue;
    }

    //  using private fields for speed
    if (legOneTakerGetsFunded._value.comparedTo(
      legTwoTakerPaysFunded._value) > 0) {
      autobridgedOffer = this.getAutobridgedOfferWithClampedLegOne(
        legOneOffer,
        legTwoOffer
      );

      legTwoPointer++;
    } else if (legTwoTakerPaysFunded._value.comparedTo(
      legOneTakerGetsFunded._value) > 0) {
      autobridgedOffer = this.getAutobridgedOfferWithClampedLegTwo(
        legOneOffer,
        legTwoOffer
      );

      legOnePointer++;
    } else {
      autobridgedOffer = this.getAutobridgedOfferWithoutClamps(
        legOneOffer,
        legTwoOffer
      );

      legOnePointer++;
      legTwoPointer++;
    }

    offersAutobridged.push(autobridgedOffer);
  }

  Amount.strict_mode = oldMode;
  return offersAutobridged;
};

/**
 * In this case, the output from leg one is greater than the input to leg two.
 * Therefore, we must effectively clamp leg one output to leg two input.
 *
 * @param {Object} legOneOffer
 * @param {Object} legTwoOffer
 *
 * @return {Object}
 */

AutobridgeCalculator.prototype.getAutobridgedOfferWithClampedLegOne =
function(legOneOffer, legTwoOffer) {
  const legOneTakerGetsFunded = Utils.getOfferTakerGetsFunded(legOneOffer,
    this._currencyPays, this._issuerPaysObj);
  const legTwoTakerPaysFunded = Utils.getOfferTakerPaysFunded(legTwoOffer,
    this._currencyGets, this._issuerGetsObj);
  const legOneQuality = Utils.getOfferQuality(legOneOffer, this._currencyGets,
    this._currencyPays, this._issuerPaysObj);

  const autobridgedTakerGets = Utils.getOfferTakerGetsFunded(legTwoOffer,
    this._currencyGets, this._issuerGetsObj);
  const autobridgedTakerPays = legTwoTakerPaysFunded.multiply(legOneQuality);

  if (legOneOffer.Account === legTwoOffer.Account) {
    const legOneTakerGets = Utils.getOfferTakerGets(legOneOffer,
      this._currencyPays, this._issuerPaysObj);
    const updatedTakerGets = legOneTakerGets.subtract(legTwoTakerPaysFunded);

    this.setLegOneTakerGets(legOneOffer, updatedTakerGets);

    this.clampLegOneOwnerFunds(legOneOffer);
  } else {
    // Update funded amount since leg one offer was not completely consumed
    const updatedTakerGetsFunded = legOneTakerGetsFunded
      .subtract(legTwoTakerPaysFunded);

    this.setLegOneTakerGetsFunded(legOneOffer, updatedTakerGetsFunded);
  }

  return this.formatAutobridgedOffer(
    autobridgedTakerGets,
    autobridgedTakerPays
  );
};

/**
 * In this case, the input from leg two is greater than the output to leg one.
 * Therefore, we must effectively clamp leg two input to leg one output.
 *
 * @param {Object} legOneOffer
 * @param {Object} legTwoOffer
 *
 * @return {Object}
 */

AutobridgeCalculator.prototype.getAutobridgedOfferWithClampedLegTwo =
function(legOneOffer, legTwoOffer) {
  const legOneTakerGetsFunded = Utils.getOfferTakerGetsFunded(legOneOffer,
    this._currencyPays, this._issuerPaysObj);
  const legTwoTakerPaysFunded = Utils.getOfferTakerPaysFunded(legTwoOffer,
    this._currencyGets, this._issuerGetsObj);
  const legTwoQuality = Utils.getOfferQuality(legTwoOffer, this._currencyGets,
    this._currencyGets, this._issuerGetsObj);

  const autobridgedTakerGets = legOneTakerGetsFunded.divide(legTwoQuality);
  const autobridgedTakerPays = Utils.getOfferTakerPaysFunded(legOneOffer,
    this._currencyPays, this._issuerPaysObj);

  // Update funded amount since leg two offer was not completely consumed
  legTwoOffer.taker_gets_funded = Utils.getOfferTakerGetsFunded(legTwoOffer,
    this._currencyGets, this._issuerGetsObj)
    .subtract(autobridgedTakerGets)
    .to_text();
  legTwoOffer.taker_pays_funded = legTwoTakerPaysFunded
    .subtract(legOneTakerGetsFunded)
    .to_text();

  return this.formatAutobridgedOffer(
    autobridgedTakerGets,
    autobridgedTakerPays
  );
};

/**
 * In this case, the output from leg one and the input to leg two are the same.
 * We do not need to clamp either.
 * @param {Object} legOneOffer
 * @param {Object} legTwoOffer
 *
 * @return {Object}
 */

AutobridgeCalculator.prototype.getAutobridgedOfferWithoutClamps =
function(legOneOffer, legTwoOffer) {
  const autobridgedTakerGets = Utils.getOfferTakerGetsFunded(legTwoOffer,
    this._currencyGets, this._issuerGetsObj);
  const autobridgedTakerPays = Utils.getOfferTakerPaysFunded(legOneOffer,
    this._currencyPays, this._issuerPaysObj);

  return this.formatAutobridgedOffer(
    autobridgedTakerGets,
    autobridgedTakerPays
  );
};

/**
 * Clear owner funds leftovers
 */

AutobridgeCalculator.prototype.clearOwnerFundsLeftover = function() {
  this._ownerFundsLeftover = {};
};

/**
 * Reset owner funds leftovers for an account to 0
 *
 * @param {String} account
 *
 * @return {Amount}
 */

AutobridgeCalculator.prototype.resetOwnerFundsLeftover = function(account) {
  this._ownerFundsLeftover[account] = NULL_AMOUNT.clone();

  return this._ownerFundsLeftover[account];
};

/**
 * Retrieve leftover funds found after clamping leg one by account
 *
 * @param {String} account
 *
 * @return {Amount}
 */

AutobridgeCalculator.prototype.getLeftoverOwnerFunds = function(account) {
  let amount = this._ownerFundsLeftover[account];

  if (!amount) {
    amount = NULL_AMOUNT.clone();
  }

  return amount;
};

/**
 * Add funds to account's leftover funds
 *
 * @param {String} account
 * @param {Amount} amount
 *
 * @return {Amount}
 */

AutobridgeCalculator.prototype.addLeftoverOwnerFunds =
function(account, amount) {
  assert(amount instanceof Amount, 'Amount is invalid');

  this._ownerFundsLeftover[account] = this.getLeftoverOwnerFunds(account)
    .add(amount);

  return this._ownerFundsLeftover[account];
};

/**
 * Set account's leftover funds
 *
 * @param {String} account
 * @param {Amount} amount
 */

AutobridgeCalculator.prototype.setLeftoverOwnerFunds =
function(account, amount) {
  assert(amount instanceof Amount, 'Amount is invalid');

  this._ownerFundsLeftover[account] = amount;
};

/**
 * Format an autobridged offer and compute synthetic values (e.g. quality)
 *
 * @param {Amount} takerGets
 * @param {Amount} takerPays
 *
 * @return {Object}
 */

AutobridgeCalculator.prototype.formatAutobridgedOffer =
function(takerGets, takerPays) {
  assert(takerGets instanceof Amount, 'Autobridged taker gets is invalid');
  assert(takerPays instanceof Amount, 'Autobridged taker pays is invalid');

  const autobridgedOffer = {};
  const quality = takerPays.divide(takerGets);

  autobridgedOffer.TakerGets = {
    value: takerGets.to_text(),
    currency: this._currencyGetsHex,
    issuer: this._issuerGets
  };

  autobridgedOffer.TakerPays = {
    value: takerPays.to_text(),
    currency: this._currencyPaysHex,
    issuer: this._issuerPays
  };

  autobridgedOffer.quality = quality.to_text();

  autobridgedOffer.taker_gets_funded = autobridgedOffer.TakerGets.value;
  autobridgedOffer.taker_pays_funded = autobridgedOffer.TakerPays.value;

  autobridgedOffer.autobridged = true;

  autobridgedOffer.BookDirectory =
    Utils.convertOfferQualityToHexFromText(autobridgedOffer.quality);
  autobridgedOffer.qualityHex = autobridgedOffer.BookDirectory;

  return autobridgedOffer;
};

/**
 * Remove funds clamp on leg one offer. This is necessary when the two offers
 * are owned by the same account. In this case, it doesn't matter if offer one
 * is not fully funded. Leg one out goes to leg two in and since its the same
 * account, an infinite amount can flow.
 *
 * @param {Object} legOneOffer - IOU:XRP offer
 */

AutobridgeCalculator.prototype.unclampLegOneOwnerFunds = function(legOneOffer) {
  assertValidLegOneOffer(legOneOffer, 'Leg one offer is invalid');

  legOneOffer.initTakerGetsFunded = Utils.getOfferTakerGetsFunded(legOneOffer,
    this._currencyPays, this._issuerPaysObj);

  this.setLegOneTakerGetsFunded(
    legOneOffer,
    Utils.getOfferTakerGets(legOneOffer, this._currencyPays,
      this._issuerPaysObj)
  );
};

/**
 * Apply clamp back on leg one offer after a round of autobridge calculation
 * completes. We must reapply clamps that have been removed because we cannot
 * guarantee that the next offer from leg two will also be from the same
 * account.
 *
 * When we reapply, it could happen that the amount of TakerGets left after
 * the autobridge calculation is less than the original funded amount. In this
 * case, we have extra funds we can use towards unfunded offers with worse
 * quality by the same owner.
 *
 * @param {Object} legOneOffer - IOU:XRP offer
 */

AutobridgeCalculator.prototype.clampLegOneOwnerFunds = function(legOneOffer) {
  assertValidLegOneOffer(legOneOffer, 'Leg one offer is invalid');

  const takerGets = Utils.getOfferTakerGets(legOneOffer, this._currencyPays,
    this._issuerPaysObj);

  if (takerGets.compareTo(legOneOffer.initTakerGetsFunded) > 0) {
    // After clamping, TakerGets is still greater than initial funded amount
    this.setLegOneTakerGetsFunded(legOneOffer, legOneOffer.initTakerGetsFunded);
  } else {
    const updatedLeftover = legOneOffer.initTakerGetsFunded.subtract(takerGets);

    this.setLegOneTakerGetsFunded(legOneOffer, takerGets);
    this.addLeftoverOwnerFunds(legOneOffer.Account, updatedLeftover);
  }
};

/**
 * Increase leg one offer funded amount with extra funds found after applying
 * clamp.
 *
 * @param {Object} legOneOffer - IOU:XRP offer
 */

AutobridgeCalculator.prototype.adjustLegOneFundedAmount =
function(legOneOffer) {
  assertValidLegOneOffer(legOneOffer, 'Leg one offer is invalid');
  assert(!legOneOffer.is_fully_funded, 'Leg one offer cannot be fully funded');

  const fundedSum = Utils.getOfferTakerGetsFunded(legOneOffer,
    this._currencyPays, this._issuerPaysObj)
    .add(this.getLeftoverOwnerFunds(legOneOffer.Account));

  if (fundedSum.compareTo(Utils.getOfferTakerGets(legOneOffer,
    this._currencyPays, this._issuerPaysObj)) >= 0
  ) {
    // There are enough extra funds to fully fund the offer
    const legOneTakerGets = Utils.getOfferTakerGets(legOneOffer,
      this._currencyPays, this._issuerPaysObj);
    const updatedLeftover = fundedSum.subtract(legOneTakerGets);

    this.setLegOneTakerGetsFunded(legOneOffer, legOneTakerGets);
    this.setLeftoverOwnerFunds(legOneOffer.Account, updatedLeftover);
  } else {
    // There are not enough extra funds to fully fund the offer
    this.setLegOneTakerGetsFunded(legOneOffer, fundedSum);
    this.resetOwnerFundsLeftover(legOneOffer.Account);
  }
};

/**
 * Set taker gets funded amount for a IOU:XRP offer. Also calculates taker
 * pays funded using offer quality and updates is_fully_funded flag
 *
 * @param {Object} legOneOffer - IOU:XRP offer
 * @param {Amount} takerGetsFunded
 */

AutobridgeCalculator.prototype.setLegOneTakerGetsFunded =
function setLegOneTakerGetsFunded(legOneOffer, takerGetsFunded) {
  assertValidLegOneOffer(legOneOffer, 'Leg one offer is invalid');
  assert(takerGetsFunded instanceof Amount, 'Taker gets funded is invalid');

  legOneOffer.taker_gets_funded = takerGetsFunded.to_text();
  legOneOffer.taker_pays_funded = takerGetsFunded
    .multiply(Utils.getOfferQuality(legOneOffer, this._currencyGets,
      this._currencyPays, this._issuerPaysObj))
      .to_text();

  if (legOneOffer.taker_gets_funded === legOneOffer.TakerGets.value) {
    legOneOffer.is_fully_funded = true;
  }
};

/**
 * Set taker gets amount for a IOU:XRP offer. Also calculates taker pays
 * using offer quality
 *
 * @param {Object} legOneOffer - IOU:XRP offer
 * @param {Amount} takerGets
 */

AutobridgeCalculator.prototype.setLegOneTakerGets =
function(legOneOffer, takerGets) {
  assertValidLegOneOffer(legOneOffer, 'Leg one offer is invalid');
  assert(takerGets instanceof Amount, 'Taker gets funded is invalid');

  const legOneQuality = Utils.getOfferQuality(legOneOffer, this._currencyGets,
    this._currencyPays, this._issuerPaysObj);

  legOneOffer.TakerGets = takerGets.to_text();
  legOneOffer.TakerPays = takerGets.multiply(legOneQuality).to_json();
};

module.exports = AutobridgeCalculator;
