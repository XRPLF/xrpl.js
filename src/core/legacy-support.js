'use strict';

const _ = require('lodash');
const log = require('./log');

function wrapRemote(Remote) {

  /**
   *  Create options object from positional function arguments
   *
   * @param {Array} params function parameters
   * @param {Array} args function arguments
   * @return {Object} keyed options
   */

  function makeOptions(command, params, args) {
    const result = {};

    log.warn(
      'DEPRECATED: First argument to ' + command
      + ' request constructor must be an object containing'
      + ' request properties: '
      + params.join(', ')
    );

    if (_.isFunction(_.last(args))) {
      result.callback = args.pop();
    }

    return _.merge(result, _.zipObject(params, args));
  }

  function addBackwardsCompatibility(compatParams) {
    const {method,
           command,
           positionals = [],
           mappings = {},
           hasCallback = true,
           aliases = []} = compatParams;

    const needsWrapping = positionals.length ||
                          Object.keys(mappings).length;

    function wrapFunction(func) {
      return function() {
        const optionsArg = arguments[0];
        const options = {};

        if (hasCallback) {
          options.callback = arguments[1];
        }

        if (_.isPlainObject(optionsArg)) {
          const mapped = _.transform(optionsArg, (result, v, k) => {
            const to = mappings[k];
            result[to !== undefined ? to : k] = v;
          });
          _.merge(options, mapped);
        } else {
          const args = _.slice(arguments);
          const positionalOptions = makeOptions(command, positionals, args);
          _.merge(options, positionalOptions);
        }
        return func.call(this, options, options.callback);
      };
    }

    const obj = Remote.prototype;
    // Wrap the function and set the aliases
    const wrapped = needsWrapping ? wrapFunction(obj[method]) : obj[method];
    aliases.concat(method).forEach((name) => {
      obj[name] = wrapped;
    });
  }

  const remoteMethods = [
    {
      method: 'requestPathFindCreate',
      command: 'path_find',
      positionals: ['source_account',
                   'destination_account',
                   'destination_amount',
                   'source_currencies'],
      mappings: {
        src_currencies: 'source_currencies',
        src_account: 'source_account',
        dst_amount: 'destination_amount',
        dst_account: 'destination_account'
      }
    },
    {
      method: 'requestRipplePathFind',
      command: 'ripple_path_find',
      positionals: ['source_account',
                   'destination_account',
                   'destination_amount',
                   'source_currencies'],
      mappings: {
        src_currencies: 'source_currencies',
        src_account: 'source_account',
        dst_amount: 'destination_amount',
        dst_account: 'destination_account'
      }
    },
    {
      method: 'createPathFind',
      aliases: ['pathFind'],
      command: 'pathfind',
      positionals: ['src_account',
                   'dst_account',
                   'dst_amount',
                   'src_currencies']
    },
    {
      method: 'requestTransactionEntry',
      command: 'transaction_entry',
      positionals: ['hash', 'ledger'],
      mappings: {ledger_index: 'ledger', ledger_hash: 'ledger'}
    },
    {
      method: 'requestTransaction',
      command: 'tx',
      positionals: ['hash', 'ledger'],
      mappings: {ledger_index: 'ledger', ledger_hash: 'ledger'},
      aliases: ['requestTx']
    },
    {
      method: 'requestBookOffers',
      command: 'book_offers',
      positionals: ['gets', 'pays', 'taker', 'ledger', 'limit'],
      mappings: {taker_pays: 'pays', taker_gets: 'gets'}
    },
    {
      method: 'createOrderBook',
      hasCallback: false,
      command: 'orderbook',
      positionals: ['currency_gets', 'issuer_gets',
                   'currency_pays', 'issuer_pays']
    },
    {
      method: 'requestTransactionHistory',
      command: 'tx_history',
      positionals: ['start'],
      aliases: ['requestTxHistory']
    },
    {
      method: 'requestWalletAccounts',
      command: 'wallet_accounts',
      positionals: ['seed']
    },
    {
      method: 'requestSign',
      command: 'sign',
      positionals: ['secret', 'tx_json']
    },
    {
      method: 'accountSeqCache',
      command: 'accountseqcache',
      positionals: ['account', 'ledger']
    },
    {
      method: 'requestRippleBalance',
      command: 'ripplebalance',
      positionals: ['account', 'issuer', 'currency', 'ledger']
    },
    {
      method: 'requestAccountInfo',
      command: 'account_info',
      positionals: ['account', 'ledger', 'peer', 'limit', 'marker']
    },
    {
      method: 'requestAccountCurrencies',
      command: 'account_currencies',
      positionals: ['account', 'ledger', 'peer', 'limit', 'marker']
    },
    {
      method: 'requestAccountLines',
      command: 'account_lines',
      positionals: ['account', 'peer', 'ledger', 'limit', 'marker']
    },
    {
      method: 'requestAccountOffers',
      command: 'account_offers',
      positionals: ['account', 'ledger', 'peer', 'limit', 'marker']
    },

    {
      method: 'requestAccountBalance',
      command: 'account_balance',
      positionals: ['account', 'ledger']
    },
    {
      method: 'requestAccountFlags',
      command: 'account_flags',
      positionals: ['account', 'ledger']
    },
    {
      method: 'requestOwnerCount',
      command: 'owner_count',
      positionals: ['account', 'ledger']
    }
  ];

  remoteMethods.forEach(addBackwardsCompatibility);
}

module.exports = function wrapAPI(index) {
  wrapRemote(index.Remote);
};
