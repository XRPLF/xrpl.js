/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const toRippledAmount = utils.common.toRippledAmount;
const paymentFlags = utils.common.txFlags.Payment;
const ValidationError = utils.common.errors.ValidationError;
import type {Instructions, Prepare} from './types.js';
import type {Amount, Adjustment, MaxAdjustment,
  MinAdjustment, Memo} from '../common/types.js';


type Payment = {
  source: Adjustment | MaxAdjustment,
  destination: Adjustment | MinAdjustment,
  paths?: string,
  memos?: Array<Memo>,
  // A 256-bit hash that can be used to identify a particular payment
  invoiceID?: string,
  // A boolean that, if set to true, indicates that this payment should go
  // through even if the whole amount cannot be delivered because of a lack of
  // liquidity or funds in the source_account account
  allowPartialPayment?: boolean,
  // A boolean that can be set to true if paths are specified and the sender
  // would like the Ripple Network to disregard any direct paths from
  // the source_account to the destination_account. This may be used to take
  // advantage of an arbitrage opportunity or by gateways wishing to issue
  // balances from a hot wallet to a user who has mistakenly set a trustline
  // directly to the hot wallet
  noDirectRipple?: boolean,
  limitQuality?: boolean
}

function isXRPToXRPPayment(payment: Payment): boolean {
  const sourceCurrency = _.get(payment, 'source.maxAmount.currency',
    _.get(payment, 'source.amount.currency'));
  const destinationCurrency = _.get(payment, 'destination.amount.currency',
    _.get(payment, 'destination.minAmount.currency'));
  return sourceCurrency === 'XRP' && destinationCurrency === 'XRP';
}

function isIOUWithoutCounterparty(amount: Amount): boolean {
  return amount && amount.currency !== 'XRP'
    && amount.counterparty === undefined;
}

function applyAnyCounterpartyEncoding(payment: Payment): void {
  // Convert blank counterparty to sender or receiver's address
  //   (Ripple convention for 'any counterparty')
  // https://ripple.com/build/transactions/
  //    #special-issuer-values-for-sendmax-and-amount
  // https://ripple.com/build/ripple-rest/#counterparties-in-payments
  _.forEach([payment.source, payment.destination], (adjustment) => {
    _.forEach(['amount', 'minAmount', 'maxAmount'], (key) => {
      if (isIOUWithoutCounterparty(adjustment[key])) {
        adjustment[key].counterparty = adjustment.address;
      }
    });
  });
}

function createMaximalAmount(amount: Amount): Amount {
  const maxXRPValue = '100000000000';
  const maxIOUValue = '9999999999999999e80';
  const maxValue = amount.currency === 'XRP' ? maxXRPValue : maxIOUValue;
  return _.assign({}, amount, {value: maxValue});
}

function createPaymentTransaction(address: string, paymentArgument: Payment
): Object {
  const payment = _.cloneDeep(paymentArgument);
  applyAnyCounterpartyEncoding(payment);

  if (address !== payment.source.address) {
    throw new ValidationError('address must match payment.source.address');
  }

  if ((payment.source.maxAmount && payment.destination.minAmount) ||
      (payment.source.amount && payment.destination.amount)) {
    throw new ValidationError('payment must specify either (source.maxAmount '
      + 'and destination.amount) or (source.amount and destination.minAmount)');
  }

  // when using destination.minAmount, rippled still requires that we set
  // a destination amount in addition to DeliverMin. the destination amount
  // is interpreted as the maximum amount to send. we want to be sure to
  // send the whole source amount, so we set the destination amount to the
  // maximum possible amount. otherwise it's possible that the destination
  // cap could be hit before the source cap.
  const amount = payment.destination.minAmount && !isXRPToXRPPayment(payment) ?
    createMaximalAmount(payment.destination.minAmount) :
    (payment.destination.amount || payment.destination.minAmount);

  const txJSON: Object = {
    TransactionType: 'Payment',
    Account: payment.source.address,
    Destination: payment.destination.address,
    Amount: toRippledAmount(amount),
    Flags: 0
  };

  if (payment.invoiceID !== undefined) {
    txJSON.InvoiceID = payment.invoiceID;
  }
  if (payment.source.tag !== undefined) {
    txJSON.SourceTag = payment.source.tag;
  }
  if (payment.destination.tag !== undefined) {
    txJSON.DestinationTag = payment.destination.tag;
  }
  if (payment.memos !== undefined) {
    txJSON.Memos = _.map(payment.memos, utils.convertMemo);
  }
  if (payment.noDirectRipple === true) {
    txJSON.Flags |= paymentFlags.NoRippleDirect;
  }
  if (payment.limitQuality === true) {
    txJSON.Flags |= paymentFlags.LimitQuality;
  }
  if (!isXRPToXRPPayment(payment)) {
    // Don't set SendMax for XRP->XRP payment
    // temREDUNDANT_SEND_MAX removed in:
    // https://github.com/ripple/rippled/commit/
    //  c522ffa6db2648f1d8a987843e7feabf1a0b7de8/
    if (payment.allowPartialPayment === true
        || payment.destination.minAmount !== undefined) {
      txJSON.Flags |= paymentFlags.PartialPayment;
    }

    txJSON.SendMax = toRippledAmount(
      payment.source.maxAmount || payment.source.amount);

    if (payment.destination.minAmount !== undefined) {
      txJSON.DeliverMin = toRippledAmount(payment.destination.minAmount);
    }

    if (payment.paths !== undefined) {
      txJSON.Paths = JSON.parse(payment.paths);
    }
  } else if (payment.allowPartialPayment === true) {
    throw new ValidationError('XRP to XRP payments cannot be partial payments');
  }

  return txJSON;
}

function preparePayment(address: string, payment: Payment,
    instructions: Instructions = {}
): Promise<Prepare> {
  validate.preparePayment({address, payment, instructions});
  const txJSON = createPaymentTransaction(address, payment);
  return utils.prepareTransaction(txJSON, this, instructions);
}

module.exports = preparePayment;
