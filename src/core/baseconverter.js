'use strict';


function normalize(digitArray) {
  let i = 0;
  while (digitArray[i] === 0) {
    ++i;
  }
  if (i > 0) {
    digitArray.splice(0, i);
  }
  return digitArray;
}

function divmod(digitArray, base, divisor) {
  let remainder = 0;
  let temp;
  let divided;
  let j = -1;

  const length = digitArray.length;
  const quotient = new Array(length);

  while (++j < length) {
    temp = remainder * base + digitArray[j];
    divided = temp / divisor;
    quotient[j] = divided << 0;
    remainder = temp % divisor;
  }
  return {quotient: normalize(quotient), remainder: remainder};
}

function convertBase(digitArray, fromBase, toBase) {
  const result = [];
  let dividend = digitArray;
  let qr;
  while (dividend.length > 0) {
    qr = divmod(dividend, fromBase, toBase);
    result.unshift(qr.remainder);
    dividend = qr.quotient;
  }
  return normalize(result);
}

module.exports = convertBase;
