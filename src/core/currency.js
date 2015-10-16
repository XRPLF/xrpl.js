'use strict';
const _ = require('lodash');

function isISOCode(currency) {
  return /^[A-Z0-9]{3}$/.test(currency);
}

function isHexCurrency(currency) {
  return /[A-Fa-f0-9]{40}/.test(currency);
}

function getISOCode(hexCurrency) {
  const bytes = new Buffer(hexCurrency, 'hex');
  if (_.every(bytes, octet => octet === 0)) {
    return 'XRP';
  }
  if (!_.every(bytes, (octet, i) => octet === 0 || (i >= 12 && i <= 14))) {
    return null;
  }
  const code = String.fromCharCode(bytes[12])
             + String.fromCharCode(bytes[13])
             + String.fromCharCode(bytes[14]);
  return isISOCode(code) ? code : null;
}

function normalizeCurrency(currency) {
  if (isISOCode(currency.toUpperCase())) {
    return currency.toUpperCase();
  } else if (isHexCurrency(currency)) {
    const code = getISOCode(currency);
    return code === null ? currency.toUpperCase() : code;
  }
  throw new Error('invalid currency');
}

function toHexCurrency(currency) {
  if (isISOCode(currency)) {
    const bytes = new Buffer(20);
    bytes.fill(0);
    if (currency !== 'XRP') {
      bytes[12] = currency.charCodeAt(0);
      bytes[13] = currency.charCodeAt(1);
      bytes[14] = currency.charCodeAt(2);
    }
    return bytes.toString('hex').toUpperCase();
  } else if (isHexCurrency(currency)) {
    return currency.toUpperCase();
  }
  throw new Error('invalid currency');
}

function isValidCurrency(currency) {
  return isISOCode(currency.toUpperCase()) || isHexCurrency(currency);
}

exports.normalizeCurrency = normalizeCurrency;
exports.isValidCurrency = isValidCurrency;
exports.toHexCurrency = toHexCurrency;
