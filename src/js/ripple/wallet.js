var sjcl = require('./utils').sjcl;

var WalletGenerator = require('ripple-wallet-generator')({
  sjcl: sjcl
});

module.exports = WalletGenerator;

