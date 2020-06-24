import { serializeUIntN } from './utils/bytes-utils';

function bytes(uint32) {
  return serializeUIntN(uint32, 4);
}

const HashPrefix = {
  transactionID: bytes(0x54584E00),
  // transaction plus metadata
  transaction: bytes(0x534E4400),
  // account state
  accountStateEntry: bytes(0x4D4C4E00),
  // inner node in tree
  innerNode: bytes(0x4D494E00),
  // ledger master data for signing
  ledgerHeader: bytes(0x4C575200),
  // inner transaction to sign
  transactionSig: bytes(0x53545800),
  // inner transaction to sign
  transactionMultiSig: bytes(0x534D5400),
  // validation for signing
  validation: bytes(0x56414C00),
  // proposal for signing
  proposal: bytes(0x50525000),
  // payment channel claim
  paymentChannelClaim: bytes(0x434C4D00)
};

export {
  HashPrefix
};
