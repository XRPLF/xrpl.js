'use strict'; // eslint-disable-line strict
const BigNumber = require('bignumber.js');
const {dropsToXrp} = require('./utils');

function parseFeeUpdate(tx: Object) {
  const baseFeeDrops = (new BigNumber(tx.BaseFee, 16)).toString();
  return {
    baseFeeXRP: dropsToXrp(baseFeeDrops),
    referenceFeeUnits: tx.ReferenceFeeUnits,
    reserveBaseXRP: dropsToXrp(tx.ReserveBase),
    reserveIncrementXRP: dropsToXrp(tx.ReserveIncrement)
  };
}

module.exports = parseFeeUpdate;
