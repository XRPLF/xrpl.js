/* @flow */
'use strict';
const _ = require('lodash');
const BigNumber = require('bignumber.js');
const utils = require('./utils');
const validate = utils.common.validate;
const toRippledAmount = utils.common.toRippledAmount;
const Transaction = utils.common.core.Transaction;

function isSendMaxAllowed(payment) {
  const srcAmt = payment.source.amount;
  const dstAmt = payment.destination.amount;

  // Don't set SendMax for XRP->XRP payment
  // temREDUNDANT_SEND_MAX removed in:
  // https://github.com/ripple/rippled/commit/
  //  c522ffa6db2648f1d8a987843e7feabf1a0b7de8/
  return srcAmt && !(srcAmt.currency === 'XRP' && dstAmt.currency === 'XRP');
}

function isIOUWithoutCounterparty(amount) {
  return amount && amount.currency !== 'XRP'
    && amount.counterparty === undefined;
}

function applyAnyCounterpartyEncoding(payment) {
  // Convert blank counterparty to sender or receiver's address
  //   (Ripple convention for 'any counterparty')
  // https://ripple.com/build/transactions/
  //    #special-issuer-values-for-sendmax-and-amount
  // https://ripple.com/build/ripple-rest/#counterparties-in-payments
  if (isIOUWithoutCounterparty(payment.source.amount)) {
    payment.source.amount.counterparty = payment.source.address;
  }
  if (isIOUWithoutCounterparty(payment.destination.amount)) {
    payment.destination.amount.counterparty = payment.destination.address;
  }
}

function createPaymentTransaction(account, payment) {
  applyAnyCounterpartyEncoding(payment);
  validate.address(account);
  validate.payment(payment);

  const transaction = new Transaction();
  transaction.payment({
    from: payment.source.address,
    to: payment.destination.address,
    amount: toRippledAmount(payment.destination.amount)
  });

  if (payment.invoiceID) {
    transaction.invoiceID(payment.invoiceID);
  }
  if (payment.source.tag) {
    transaction.sourceTag(payment.source.tag);
  }
  if (payment.destination.tag) {
    transaction.destinationTag(payment.destination.tag);
  }
  if (payment.paths) {
    transaction.paths(JSON.parse(payment.paths));
  }
  if (payment.memos) {
    _.forEach(payment.memos, memo =>
      transaction.addMemo(memo.type, memo.format, memo.data)
    );
  }
  if (payment.allowPartialPayment) {
    transaction.setFlags(['PartialPayment']);
  }
  if (payment.noDirectRipple) {
    transaction.setFlags(['NoRippleDirect']);
  }
  if (payment.limitQuality) {
    transaction.setFlags(['LimitQuality']);
  }
  if (isSendMaxAllowed(payment)) {
    const maxValue = new BigNumber(payment.source.amount.value)
      .plus(payment.source.slippage || 0).toString();
    const maxAmount = _.assign({}, payment.source.amount, {value: maxValue});
    transaction.sendMax(toRippledAmount(maxAmount));
  }

  return transaction;
}

function preparePayment(account, payment, instructions, callback) {
  const transaction = createPaymentTransaction(account, payment);
  utils.createTxJSON(transaction, this.remote, instructions, callback);
}

module.exports = utils.wrapCatch(preparePayment);
