'use strict';

const utils = require('./utils');
const ripple = utils.common.core;
const validate = utils.common.validate;

function sign(txJSON, secret) {
  validate.txJSON(txJSON);
  const tx = ripple.Transaction.from_json(secret);

  tx.setSecret(secret);
  tx.setMaxFee(Infinity);
  tx.complete(); // setting the public key

  tx.sign();
  const serialized = tx.serialize();

  return {
    tx_blob: serialized.to_hex(),
    hash: tx.hash(/*prefix*/null, /*asUint256*/false, serialized)
  };
}

module.exports = sign;
