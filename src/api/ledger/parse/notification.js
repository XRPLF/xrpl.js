/* eslint-disable valid-jsdoc */
'use strict';
const ripple = require('../utils').common.core;

/**
 * Convert a Ripple transaction in the JSON format,
 * along with some additional pieces of information,
 * into a Notification object.
 *
 * @param {Ripple Transaction in JSON Format} notification_details.transaction
 * @param {RippleAddress} notification_details.account
 * @param {Hex-encoded String}
 *                    notification_details.previous_transaction_identifier
 * @param {Hex-encoded String}
 *                    notification_details.next_transaction_identifier
 *
 * @returns {Notification}
 */
function NotificationParser() {}

NotificationParser.prototype.parse = function(notification_details, urlBase) {
  const transaction = notification_details.transaction;
  const account = notification_details.account;
  const previous_transaction_identifier =
    notification_details.previous_transaction_identifier;
  const next_transaction_identifier =
    notification_details.next_transaction_identifier;

  const metadata = transaction.meta || { };

  const notification = {
    account: account,
    type: transaction.TransactionType.toLowerCase(),
    direction: '', // set below
    state: (metadata.TransactionResult === 'tesSUCCESS'
      ? 'validated' : 'failed'),
    result: metadata.TransactionResult || '',
    ledger: '' + transaction.ledger_index,
    hash: transaction.hash,
    timestamp: '',// set below
    transaction_url: '', // set below
    previous_transaction_identifier:
      notification_details.previous_transaction_identifier || '',
    previous_notification_url: '', // set below
    next_transaction_identifier:
      notification_details.next_transaction_identifier || '',
    next_notification_url: '' // set below
  };

  notification.timestamp = transaction.date ?
    new Date(ripple.utils.time.fromRipple(transaction.date)).toISOString() : '';

  // Direction
  if (account === transaction.Account) {
    notification.direction = 'outgoing';
  } else if (transaction.TransactionType === 'Payment'
             && transaction.Destination !== account) {
    notification.direction = 'passthrough';
  } else {
    notification.direction = 'incoming';
  }

  // Notification URL

  if (notification.type === 'payment') {
    notification.transaction_url = urlBase + '/v1/accounts/'
      + notification.account
      + '/payments/'
      + notification.hash;
  } else if (notification.type === 'offercreate'
      || notification.type === 'offercancel') {
    notification.type = 'order';
    notification.transaction_url = urlBase + '/v1/accounts/'
      + notification.account
      + '/orders/' + notification.hash;
  } else if (notification.type === 'trustset') {
    notification.type = 'trustline';
    notification.transaction_url = urlBase + '/v1/transactions/'
      + notification.hash;
  } else if (notification.type === 'accountset') {
    notification.type = 'settings';
    notification.transaction_url = urlBase + '/v1/transactions/'
      + notification.hash;
  }

  // Next notification URL

  if (next_transaction_identifier) {
    notification.next_notification_url = urlBase + '/v1/accounts/'
      + notification.account + '/notifications/' + next_transaction_identifier;
  }

  // Previous notification URL
  if (previous_transaction_identifier) {
    notification.previous_notification_url = urlBase + '/v1/accounts/'
      + notification.account + '/notifications/'
      + previous_transaction_identifier;
  }

  return notification;
};

module.exports = new NotificationParser();
