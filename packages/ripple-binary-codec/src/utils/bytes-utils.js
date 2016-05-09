const assert = require('assert');

function signum(a, b) {
  return a < b ? -1 : a === b ? 0 : 1;
}

const hexLookup = (function() {
  const res = {};
  const reverse = res.reverse = new Array(256);
  for (let i = 0; i < 16; i++) {
    const char = i.toString(16).toUpperCase();
    res[char] = i;

    for (let j = 0; j < 16; j++) {
      const char2 = j.toString(16).toUpperCase();
      const byte = (i << 4) + j;
      const byteHex = char + char2;
      res[byteHex] = byte;
      reverse[byte] = byteHex;
    }
  }
  return res;
}());

const reverseHexLookup = hexLookup.reverse;

function bytesToHex(sequence) {
  const buf = Array(sequence.length);
  for (let i = sequence.length - 1; i >= 0; i--) {
    buf[i] = reverseHexLookup[sequence[i]];
  }
  return buf.join('');
}

function byteForHex(hex) {
  const byte = hexLookup[hex];
  if (byte === undefined) {
    throw new Error(`\`${hex}\` is not a valid hex representation of a byte`);
  }
  return byte;
}

function parseBytes(val, Output = Array) {
  if (!val || val.length === undefined) {
    throw new Error(`${val} is not a sequence`);
  }

  if (typeof val === 'string') {
    const start = val.length % 2;
    const res = new Output((val.length + start) / 2);
    for (let i = val.length, to = res.length - 1; to >= start; i -= 2, to--) {
      res[to] = byteForHex(val.slice(i - 2, i));
    }
    if (start === 1) {
      res[0] = byteForHex(val[0]);
    }
    return res;
  } else if (val instanceof Output) {
    return val;
  } else if (Output === Uint8Array) {
    return new Output(val);
  }
  const res = new Output(val.length);
  for (let i = val.length - 1; i >= 0; i--) {
    res[i] = val[i];
  }
  return res;
}

function serializeUIntN(val, width) {
  const newBytes = new Uint8Array(width);
  const lastIx = width - 1;
  for (let i = 0; i < width; i++) {
    newBytes[lastIx - i] = (val >>> (i * 8) & 0xff);
  }
  return newBytes;
}

function compareBytes(a, b) {
  assert(a.length === b.length);
  for (let i = 0; i < a.length; i++) {
    const cmp = signum(a[i], b[i]);
    if (cmp !== 0) {
      return cmp;
    }
  }
  return 0;
}

function slice(val, startIx = 0, endIx = val.length, Output = val.constructor) {
  /* eslint-disable no-param-reassign*/
  if (startIx < 0) {
    startIx += val.length;
  }
  if (endIx < 0) {
    endIx += val.length;
  }
  /* eslint-enable no-param-reassign*/
  const len = endIx - startIx;
  const res = new Output(len);
  for (let i = endIx - 1; i >= startIx; i--) {
    res[i - startIx] = val[i];
  }
  return res;
}

module.exports = {
  parseBytes,
  bytesToHex,
  slice,
  compareBytes,
  serializeUIntN
};
