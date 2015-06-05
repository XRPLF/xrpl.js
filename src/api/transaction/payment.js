/* eslint-disable valid-jsdoc */
'use strict';
const BigNumber = require('bignumber.js');
const utils = require('./utils');
const ripple = utils.common.core;
const validate = utils.common.validate;
const convertAmount = utils.common.convertAmount;

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

function uppercaseCurrencyCodes(payment) {
  if (payment.source.amount) {
    payment.source.amount.currency =
    payment.source.amount.currency.toUpperCase();
  }
  if (payment.destination.amount) {
    payment.destination.amount.currency =
    payment.destination.amount.currency.toUpperCase();
  }
}

function createPaymentTransaction(account, payment) {
  applyAnyCounterpartyEncoding(payment);
  uppercaseCurrencyCodes(payment);
  validate.address(account);
  validate.payment(payment);

  const transaction = new ripple.Transaction();
  const transactionData = {
    from: payment.source.address,
    to: payment.destination.address,
    amount: convertAmount(payment.destination.amount)
  };

  if (payment.invoiceID) {
    transaction.invoiceID(payment.invoiceID);
  }
  transaction.payment(transactionData);

  if (payment.source.tag) {
    transaction.sourceTag(parseInt(payment.source.tag, 10));
  }
  if (payment.destination.tag) {
    transaction.destinationTag(parseInt(payment.destination.tag, 10));
  }

  if (isSendMaxAllowed(payment)) {
    const maxValue = new BigNumber(payment.source.amount.value)
      .plus(payment.source.slippage || 0).toString();

    if (payment.source_amount.currency === 'XRP') {
      transaction.sendMax(utils.xrpToDrops(maxValue));
    } else {
      transaction.sendMax({
        value: maxValue,
        currency: payment.source.amount.currency,
        issuer: payment.source.amount.counterparty
      });
    }
  }

  if (typeof payment.paths === 'string') {
    transaction.paths(JSON.parse(payment.paths));
  } else if (typeof payment.paths === 'object') {
    transaction.paths(payment.paths);
  }

  if (payment.memos && Array.isArray(payment.memos)) {
    for (let m = 0; m < payment.memos.length; m++) {
      const memo = payment.memos[m];
      transaction.addMemo(memo.type, memo.format, memo.data);
    }
  }

  let flags = [];
  if (payment.allowPartialPayment) {
    flags.push('PartialPayment');
  }
  if (payment.noDirectRipple) {
    flags.push('NoRippleDirect');
  }
  if (flags.length > 0) {
    transaction.setFlags(flags);
  }
  return transaction;
}

function preparePayment(account, payment, instructions, callback) {
  const transaction = createPaymentTransaction(account, payment);
  utils.createTxJSON(transaction, this.remote, instructions, callback);
}

module.exports = utils.wrapCatch(preparePayment);
