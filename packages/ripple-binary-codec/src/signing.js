/* eslint-disable func-style */

const _ = require('lodash');
const {AccountID} = require('./types');
const binary = require('./binary');
const {
  serializeObject,
  bytesToHex,
  multiSigningData,
  transactionID,
  signingData
} = binary;

const FULL_CANONICAL_SIGNATURE = 0x80000000;

const toHex = v => bytesToHex(v);
const getSigner = o => AccountID.from(o.Signer.Account);
const signerComparator = (a, b) => getSigner(a).compareTo(getSigner(b));

function setCanonicalSignatureFlag(tx_json) {
  tx_json.Flags |= FULL_CANONICAL_SIGNATURE;
  tx_json.Flags >>>= 0;
}

function serializedBundle(tx_json) {
  const serialized = serializeObject(tx_json);
  const hash = transactionID(serialized).toHex();
  const tx_blob = toHex(serialized);
  return {tx_json, tx_blob, hash};
}

function signFor(tx_json_, keyPair, signingAccount = null) {
  const tx_json = _.clone(tx_json_);
  tx_json.SigningPubKey = '';
  setCanonicalSignatureFlag(tx_json);
  const signerID = signingAccount || keyPair.id();
  const signature = keyPair.sign(multiSigningData(tx_json, signerID));
  const signer = {
    Signer: {
      SigningPubKey: toHex(keyPair.publicBytes()),
      TxnSignature: toHex(signature),
      Account: signerID
    }
  };

  const signers = tx_json.Signers = tx_json.Signers || [];
  signers.push(signer);
  signers.sort(signerComparator);

  return serializedBundle(tx_json);
}

function sign(tx_json_, keyPair) {
  const tx_json = _.clone(tx_json_);
  setCanonicalSignatureFlag(tx_json);

  tx_json.SigningPubKey = toHex(keyPair.publicBytes());
  tx_json.TxnSignature = toHex(keyPair.sign(signingData(tx_json)));

  return serializedBundle(tx_json);
}

module.exports = {
  signFor,
  sign
};
