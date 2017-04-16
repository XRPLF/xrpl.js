#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var ripple = require('ripple-lib');

var argv = require('optimist')
  .usage('Command line interface to ripple-lib\n' +
     'Usage: $0 command [options] [arguments]\n' +
     'Commands: pay')
  .demand(1)
  .options('a', {
    alias: 'account',
    boolean: false,
    describe: 'account alias in wallet file'
  })
  .options('v', {
    alias: 'verbose',
    boolean: true,
    describe: 'show server response'
  })
  .options('H', {
    alias: 'host',
    boolean: false,
    default: 's-west.ripple.com',
    describe: 'rippled server to connect to'
  })
  .argv;


function API(secret) {
  this.secret = secret;

  this.connect = function(host) {
    var remote = new ripple.Remote({
      trace :         false,
      trusted:        true,
      local_signing:  true,

      servers: [
        { host: host, port: 443, secure: true }
      ]
    });
    this.remote = remote;
    return Promise.promisify(remote.connect, remote)();
  };

  this.amount = function(issuerAddress, currency, value) {
    return {
      issuer: issuerAddress,
      currency: currency,
      value: value.toString()
    };
  };

  this.payXRP = function(fromAddress, toAddress, value) {
    var transaction = new ripple.Transaction(this.remote);
    transaction.secret(this.secret);
    transaction.payment(fromAddress, toAddress, value.toString());
    return Promise.promisify(transaction.submit, transaction)();
  };

  this.pay = function(fromAddress, toAddress, issuerAddress, currency, value) {
    var transaction = new ripple.Transaction(this.remote);
    transaction.secret(this.secret);
    var amount = this.amount(issuerAddress, currency, value);
    transaction.payment(fromAddress, toAddress, amount);
    return Promise.promisify(transaction.submit, transaction)();
  };

  this.setTrust = function(accountAddress, issuerAddress, currency, limit) {
    var transaction = new ripple.Transaction(this.remote);
    transaction.secret(this.secret);
    var amount = this.amount(issuerAddress, currency, limit);
    transaction.rippleLineSet(accountAddress, amount);
    return Promise.promisify(transaction.submit, transaction)();
  };

  this.removeTrust = function(accountAddress, issuerAddress, currency) {
    var transaction = new ripple.Transaction(this.remote);
    transaction.secret(this.secret);
    var amount = this.amount(issuerAddress, currency, 0);
    transaction.rippleLineSet(accountAddress, amount);
    transaction.setFlags(0);    // flags must be 0 to remove trustline
    return Promise.promisify(transaction.submit, transaction)();
  }
}

function getUserHomePath() {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

function loadWallet() {
  var secretPath = path.join(getUserHomePath(), '.ripple_wallet');
  try {
    var walletRaw = fs.readFileSync(secretPath, {encoding: 'utf8'}).trim();
  } catch(e) {
    console.error('Could not find .ripple_wallet file in home directory');
    process.exit(1);
  }
  return JSON.parse(walletRaw);
}

function loadAccount(wallet, alias) {
  if (alias) {
    if (!wallet[alias]) {
      throw new Error('Account does not exist in wallet');
    }
    return wallet[alias];
  } else {
    for (var key in wallet) {
      if (wallet.hasOwnProperty(key) && wallet[key].default)
        return wallet[key];
    }
    throw new Error('No default account found in wallet '
                  + '(add "default": true)');
  }
}

function printResponse(response) {
  console.log(JSON.stringify(response, null, 2));
  process.exit(0);
}

function printErr(error) {
  console.error(error);
  process.exit(0);
}

function showUsage(programName, commandName, usageOptions) {
  var lines = [];
  lines[0] = 'Usage: ' + programName + ' ' + commandName + ' ' +
    usageOptions[0].join(' ');
  usageOptions.slice(1).forEach(function(option) {
    lines.push('   or: ' + programName + ' ' + commandName + ' ' +
      option.join(' '));
  });
  console.log(lines.join('\n'));
}

// if any argument starts with a tilde, look it up in the wallet
function processArgs(args, wallet) {
  return args.map(function(arg) {
    if (typeof arg === 'string' && arg.charAt(0) === '~') {
      var alias = arg.slice(1);
      if (wallet[alias] && wallet[alias].address) {
        return wallet[alias].address;
      } else {
        throw new Error('Alias not found in wallet: ' + alias);
      }
    } else {
      return arg;
    }
  });
}

function main(argv) {
  var progName = argv.$0;
  var command = argv._[0];
  var args = argv._.slice(1);
  var host = argv.host;
  var wallet = loadWallet();
  var account = loadAccount(wallet, argv.account);
  var extArgs = [account.address].concat(processArgs(args, wallet));

  if (!account.secret) {
    console.error('Account is missing secret in wallet');
    process.exit(1);
  }

  var api = new API(account.secret);
  var print = argv.verbose ? printResponse : function() {process.exit(0);}

  if (command === 'pay') {
    if (args.length === 2) {
      api.connect(host).then(function() {
        api.payXRP.apply(api, extArgs).then(print, printErr);
      });
    } else if (args.length === 4) {
      api.connect(host).then(function() {
        api.pay.apply(api, extArgs).then(print, printErr);
      });
    } else {
      showUsage(progName, 'pay', [
        ['TO', 'VALUE', '(make XRP payment)'],
        ['TO', 'ISSUER', 'CURRENCY', 'VALUE', '(make non-XRP payment)']]);
    }
  } else if (command === 'trust') {
    if (args.length === 3) {
      api.connect(host).then(function() {
        api.setTrust.apply(api, extArgs).then(print, printErr);
      });
    } else {
      showUsage(progName, 'trust', [['ISSUER', 'CURRENCY', 'LIMIT']]);
    }
  } else if (command === 'remove-trust') {
    if (args.length === 2) {
      api.connect(host).then(function() {
        api.removeTrust.apply(api, extArgs).then(print, printErr);
      });
    } else {
      showUsage(progName, 'trust', [['ISSUER', 'CURRENCY']]);
    }
  } else {
    console.log('Unrecognized command: ' + command.toString());
  }
}

main(argv);
