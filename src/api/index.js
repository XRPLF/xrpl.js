/* @flow */

'use strict';
const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const common = require('./common');
const server = require('./server/server');
const connect = server.connect;
const disconnect = server.disconnect;
const getServerInfo = server.getServerInfo;
const getFee = server.getFee;
const isConnected = server.isConnected;
const getLedgerVersion = server.getLedgerVersion;
const getTransaction = require('./ledger/transaction');
const getTransactions = require('./ledger/transactions');
const getTrustlines = require('./ledger/trustlines');
const getBalances = require('./ledger/balances');
const getBalanceSheet = require('./ledger/balance-sheet');
const getPaths = require('./ledger/pathfind');
const getOrders = require('./ledger/orders');
const getOrderbook = require('./ledger/orderbook');
const getSettings = require('./ledger/settings');
const getAccountInfo = require('./ledger/accountinfo');
const preparePayment = require('./transaction/payment');
const prepareTrustline = require('./transaction/trustline');
const prepareOrder = require('./transaction/order');
const prepareOrderCancellation = require('./transaction/ordercancellation');
const prepareSuspendedPaymentCreation =
  require('./transaction/suspended-payment-creation');
const prepareSuspendedPaymentExecution =
  require('./transaction/suspended-payment-execution');
const prepareSuspendedPaymentCancellation =
  require('./transaction/suspended-payment-cancellation');
const prepareSettings = require('./transaction/settings');
const sign = require('./transaction/sign');
const submit = require('./transaction/submit');
const errors = require('./common').errors;
const generateAddress = common.generateAddressAPI;
const computeLedgerHash = require('./offline/ledgerhash');
const getLedger = require('./ledger/ledger');

type APIOptions = {
  servers?: Array<string>,
  feeCushion?: number,
  trace?: boolean,
  proxy?: string
}

class RippleAPI extends EventEmitter {
  constructor(options: APIOptions = {}) {
    common.validate.apiOptions(options);
    super();
    if (options.servers !== undefined) {
      const servers: Array<string> = options.servers;
      if (servers.length === 1) {
        this._feeCushion = options.feeCushion || 1.2;
        this.connection = new common.Connection(servers[0], options);
        this.connection.on('ledgerClosed', message => {
          this.emit('ledgerClosed', server.formatLedgerClose(message));
        });
      } else {
        throw new errors.RippleError('Multi-server not implemented');
      }
    }
  }
}

_.assign(RippleAPI.prototype, {
  connect,
  disconnect,
  isConnected,
  getServerInfo,
  getFee,
  getLedgerVersion,

  getTransaction,
  getTransactions,
  getTrustlines,
  getBalances,
  getBalanceSheet,
  getPaths,
  getOrders,
  getOrderbook,
  getSettings,
  getAccountInfo,
  getLedger,

  preparePayment,
  prepareTrustline,
  prepareOrder,
  prepareOrderCancellation,
  prepareSuspendedPaymentCreation,
  prepareSuspendedPaymentExecution,
  prepareSuspendedPaymentCancellation,
  prepareSettings,
  sign,
  submit,

  generateAddress,
  errors
});

// these are exposed only for use by unit tests; they are not part of the API
RippleAPI._PRIVATE = {
  common,
  computeLedgerHash,
  ledgerUtils: require('./ledger/utils'),
  schemaValidator: require('./common/schema-validator')
};

module.exports = RippleAPI;
