/* eslint-disable valid-jsdoc */
'use strict';
const BigNumber = require('bignumber.js');
const utils = require('./utils');
const ripple = utils.common.core;
const validate = utils.common.validate;
const convertAmount = utils.common.convertAmount;

function isSendMaxAllowed(payment) {
  const srcAmt = payment.source_amount;
  const dstAmt = payment.destination_amount;

  // Don't set SendMax for XRP->XRP payment
  // temREDUNDANT_SEND_MAX removed in:
  // https://github.com/ripple/rippled/commit/
  //  c522ffa6db2648f1d8a987843e7feabf1a0b7de8/
  return srcAmt && !(srcAmt.currency === 'XRP' && dstAmt.currency === 'XRP');
}

function createPaymentTransaction(account, payment) {
  validate.address(account);
  validate.payment(payment);

  // Convert blank issuer to sender's address
  //   (Ripple convention for 'any issuer')
  // https://ripple.com/build/transactions/
  //    #special-issuer-values-for-sendmax-and-amount
  // https://ripple.com/build/ripple-rest/#counterparties-in-payments
  if (payment.source_amount && payment.source_amount.currency !== 'XRP'
      && payment.source_amount.issuer === '') {
    payment.source_amount.issuer = payment.source_account;
  }

  // Convert blank issuer to destinations's address
  //   (Ripple convention for 'any issuer')
  // https://ripple.com/build/transactions/
  //    #special-issuer-values-for-sendmax-and-amount
  // https://ripple.com/build/ripple-rest/#counterparties-in-payments
  if (payment.destination_amount
      && payment.destination_amount.currency !== 'XRP'
      && payment.destination_amount.issuer === '') {
    payment.destination_amount.issuer = payment.destination_account;
  }
  // Uppercase currency codes
  if (payment.source_amount) {
    payment.source_amount.currency =
    payment.source_amount.currency.toUpperCase();
  }
  if (payment.destination_amount) {
    payment.destination_amount.currency =
    payment.destination_amount.currency.toUpperCase();
  }
  /* Construct payment */
  const transaction = new ripple.Transaction();
  const transactionData = {
    from: payment.source_account,
    to: payment.destination_account,
    amount: convertAmount(payment.destination_amount)
  };

  // invoice_id  Because transactionData is a object, transaction.payment
  //  function is ignored invoiceID
  if (payment.invoice_id) {
    transaction.invoiceID(payment.invoice_id);
  }
  transaction.payment(transactionData);
  // Tags
  if (payment.source_tag) {
    transaction.sourceTag(parseInt(payment.source_tag, 10));
  }
  if (payment.destination_tag) {
    transaction.destinationTag(parseInt(payment.destination_tag, 10));
  }

  // SendMax
  if (isSendMaxAllowed(payment)) {
    const max_value = new BigNumber(payment.source_amount.value)
      .plus(payment.source_slippage || 0).toString();

    if (payment.source_amount.currency === 'XRP') {
      transaction.sendMax(utils.xrpToDrops(max_value));
    } else {
      transaction.sendMax({
        value: max_value,
        currency: payment.source_amount.currency,
        issuer: payment.source_amount.issuer
      });
    }
  }

  // Paths
  if (typeof payment.paths === 'string') {
    transaction.paths(JSON.parse(payment.paths));
  } else if (typeof payment.paths === 'object') {
    transaction.paths(payment.paths);
  }

  // Memos
  if (payment.memos && Array.isArray(payment.memos)) {
    for (let m = 0; m < payment.memos.length; m++) {
      const memo = payment.memos[m];
      transaction.addMemo(memo.MemoType, memo.MemoFormat, memo.MemoData);
    }
  }

  // Flags
  let flags = [];
  if (payment.partial_payment) {
    flags.push('PartialPayment');
  }
  if (payment.no_direct_ripple) {
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
