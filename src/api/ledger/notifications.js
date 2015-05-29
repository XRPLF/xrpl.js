/* eslint-disable valid-jsdoc */
'use strict';
const _ = require('lodash');
const async = require('async');
const transactions = require('./transactions');
const NotificationParser = require('./notification_parser.js');
const utils = require('./utils.js');
const validate = utils.common.validate;
const server = utils.common.server;

/**
 *  Find the previous and next transaction hashes.
 *  Report errors to the client using res.json
 *  or pass the notificationDetails with the added fields
 *  back to the callback.
 *
 *  @param {Remote} $.remote
 *  @param {Express.js Response} res
 *  @param {RippleAddress} notificationDetails.account
 *  @param {Ripple Transaction in JSON Format} notificationDetails.transaction
 *  @param {Hex-encoded String} notificationDetails.identifier
 *  @param {Function} callback
 *
 *  @callback
 *  @param {Error} error
 *  @param {Object} notificationDetails
 **/

function attachPreviousAndNextTransactionIdentifiers(api,
    notificationDetails, topCallback) {

  // Get all of the transactions affecting the specified
  // account in the given ledger. This is done so that
  // we can query for one more than that number on either
  // side to ensure that we'll find the next and previous
  // transactions, no matter how many transactions the
  // given account had in the same ledger
  function getAccountTransactionsInBaseTransactionLedger(callback) {
    const params = {
      account: notificationDetails.account,
      ledger_index_min: notificationDetails.transaction.ledger_index,
      ledger_index_max: notificationDetails.transaction.ledger_index,
      exclude_failed: false,
      max: 99999999,
      limit: 200 // arbitrary, just checking number of transactions in ledger
    };

    transactions.getAccountTransactions(api, params, callback);
  }

  // Query for one more than the numTransactionsInLedger
  // going forward and backwards to get a range of transactions
  // that will definitely include the next and previous transactions
  function getNextAndPreviousTransactions(txns, callback) {
    const numTransactionsInLedger = txns.length;
    async.concat([false, true], function(earliestFirst, concat_callback) {
      const params = {
        account: notificationDetails.account,
        max: numTransactionsInLedger + 1,
        min: numTransactionsInLedger + 1,
        limit: numTransactionsInLedger + 1,
        earliestFirst: earliestFirst
      };

      // In rippled -1 corresponds to the first or last ledger
      // in its database, depending on whether it is the min or max value
      if (params.earliestFirst) {
        params.ledger_index_max = -1;
        params.ledger_index_min = notificationDetails.transaction.ledger_index;
      } else {
        params.ledger_index_max = notificationDetails.transaction.ledger_index;
        params.ledger_index_min = -1;
      }

      transactions.getAccountTransactions(api, params, concat_callback);

    }, callback);

  }

  // Sort the transactions returned by ledger_index and remove duplicates
  function sortTransactions(allTransactions, callback) {
    allTransactions.push(notificationDetails.transaction);

    const txns = _.uniq(allTransactions, function(tx) {
      return tx.hash;
    });

    txns.sort(utils.compareTransactions);

    callback(null, txns);
  }

  // Find the baseTransaction amongst the results. Because the
  // transactions have been sorted, the next and previous transactions
  // will be the ones on either side of the base transaction
  function findPreviousAndNextTransactions(txns, callback) {

    // Find the index in the array of the baseTransaction
    const baseTransactionIndex = _.findIndex(txns, function(possibility) {
      return possibility.hash === notificationDetails.transaction.hash;
    });

    // The previous transaction is the one with an index in
    // the array of baseTransactionIndex - 1
    if (baseTransactionIndex > 0) {
      const previous_transaction = txns[baseTransactionIndex - 1];
      notificationDetails.previous_transaction_identifier =
        previous_transaction.hash;
    }

    // The next transaction is the one with an index in
    // the array of baseTransactionIndex + 1
    if (baseTransactionIndex + 1 < txns.length) {
      const next_transaction = txns[baseTransactionIndex + 1];
      notificationDetails.next_transaction_identifier = next_transaction.hash;
    }

    callback(null, notificationDetails);
  }

  const steps = [
    getAccountTransactionsInBaseTransactionLedger,
    getNextAndPreviousTransactions,
    sortTransactions,
    findPreviousAndNextTransactions
  ];

  async.waterfall(steps, topCallback);
}

/**
 *  Get a notification corresponding to the specified
 *  account and transaction identifier. Send errors back
 *  to the client using the res.json method or pass
 *  the notification json to the callback function.
 *
 *  @param {Remote} $.remote
 *  @param {RippleAddress} req.params.account
 *  @param {Hex-encoded String} req.params.identifier
 *  @param {Express.js Response} res
 *  @param {Function} callback
 *
 *  @callback
 *  @param {Error} error
 *  @param {Notification} notification
 */
function getNotificationHelper(api, account, identifier, urlBase, topCallback) {

  function getTransaction(callback) {
    try {
      transactions.getTransaction(api, account, identifier, {}, callback);
    } catch(err) {
      callback(err);
    }
  }

  function checkLedger(baseTransaction, callback) {
    server.remoteHasLedger(api.remote, baseTransaction.ledger_index,
        function(error, remoteHasLedger) {
      if (error) {
        return callback(error);
      }
      if (remoteHasLedger) {
        callback(null, baseTransaction);
      } else {
        callback(new utils.common.errors.NotFoundError(
          'Cannot Get Notification. ' +
          'This transaction is not in the ripple\'s complete ledger set. ' +
          'Because there is a gap in the rippled\'s historical database it ' +
          'is not possible to determine the transactions that precede this one')
        );
      }
    });
  }

  function prepareNotificationDetails(baseTransaction, callback) {
    const notificationDetails = {
      account: account,
      identifier: identifier,
      transaction: baseTransaction
    };

    attachPreviousAndNextTransactionIdentifiers(api, notificationDetails,
      callback);
  }

  function formatNotificationResponse(notificationDetails, callback) {
    const notification = NotificationParser.parse(notificationDetails, urlBase);
    callback(null, {notification: notification});
  }

  const steps = [
    getTransaction,
    checkLedger,
    prepareNotificationDetails,
    formatNotificationResponse
  ];

  async.waterfall(steps, topCallback);
}

/**
 *  Get a notification corresponding to the specified
 *  account and transaction identifier. Uses the res.json
 *  method to send errors or a notification back to the client.
 *
 *  @param {Remote} $.remote
 *  @param {/lib/config-loader} $.config
 *  @param {RippleAddress} req.params.account
 *  @param {Hex-encoded String} req.params.identifier
 */
function getNotification(account, identifier, urlBase, callback) {
  validate.address(account);
  validate.identifier(identifier);

  return getNotificationHelper(this, account, identifier, urlBase, callback);
}

/**
 *  Get a notifications corresponding to the specified
 *  account.
 *
 *  This function calls transactions.getAccountTransactions
 *  recursively to retrieve results_per_page number of transactions
 *  and filters the results using client-specified parameters.
 *
 *  @param {RippleAddress} account
 *  @param {string} urlBase - The url to use for the transaction status URL
 *
 *  @param {string} options.source_account
 *  @param {Number} options.ledger_min
 *  @param {Number} options.ledger_max
 *  @param {string} [false] options.earliest_first
 *  @param {string[]} options.types - @see transactions.getAccountTransactions
 *
 */
// TODO: If given ledger range, check for ledger gaps
function getNotifications(account, urlBase, options, callback) {
  validate.address(account);

  const self = this;

  function getTransactions(_callback) {

    const resultsPerPage = options.results_per_page ||
      transactions.DEFAULT_RESULTS_PER_PAGE;
    const offset = resultsPerPage * ((options.page || 1) - 1);

    const args = {
      account: account,
      direction: options.direction,
      min: resultsPerPage,
      max: resultsPerPage,
      ledger_index_min: options.ledger_min,
      ledger_index_max: options.ledger_max,
      offset: offset,
      earliestFirst: options.earliest_first
    };

    transactions.getAccountTransactions(self, args, _callback);
  }

  function parseNotifications(baseTransactions, _callback) {
    const numTransactions = baseTransactions.length;

    function parseNotification(transaction, __callback) {
      const args = {
        account: account,
        identifier: transaction.hash,
        transaction: transaction
      };

      // Attaching previous and next identifiers
      const idx = baseTransactions.indexOf(transaction);
      const previous = baseTransactions[idx + 1];
      const next = baseTransactions[idx - 1];

      if (!options.earliest_first) {
        args.previous_transaction_identifier = previous ?
          previous.hash : undefined;
        args.next_transaction_identifier = next ? next.hash : undefined;
      } else {
        args.previous_transaction_identifier = next ? next.hash : undefined;
        args.next_transaction_identifier = previous ? previous.hash : undefined;
      }

      args.previous_transaction_identifier = args.previous_hash;
      args.next_transaction_identifier = args.next_hash;

      const firstAndPaging = options.page &&
        (options.earliest_first ?
         args.previous_transaction_identifier === undefined :
          args.next_transaction_identifier === undefined);

      const last = idx === numTransactions - 1;

      if (firstAndPaging || last) {
        attachPreviousAndNextTransactionIdentifiers(self, args,
          function(err, _args) {
            return __callback(err, NotificationParser.parse(_args, urlBase));
          }
        );
      } else {
        return __callback(null, NotificationParser.parse(args, urlBase));
      }
    }

    return async.map(baseTransactions, parseNotification, _callback);
  }

  function formatResponse(notifications, _callback) {
    _callback(null, {notifications: notifications});
  }

  const steps = [
    getTransactions,
    _.partial(utils.attachDate, self),
    parseNotifications,
    formatResponse
  ];

  return async.waterfall(steps, callback);
}

module.exports = {
  getNotification: getNotification,
  getNotifications: getNotifications
};
