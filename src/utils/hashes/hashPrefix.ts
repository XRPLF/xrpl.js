/**
 * Prefix for hashing functions.
 *
 * These prefixes are inserted before the source material used to
 * generate various hashes. This is done to put each hash in its own
 * "space." This way, two different types of objects with the
 * same binary data will produce different hashes.
 *
 * Each prefix is a 4-byte value with the last byte set to zero
 * and the first three bytes formed from the ASCII equivalent of
 * some arbitrary string. For example "TXN".
 */

enum HashPrefix {
  // transaction plus signature to give transaction ID 'TXN'
  TRANSACTION_ID = 0x54584e00,

  // transaction plus metadata 'TND'
  TRANSACTION_NODE = 0x534e4400,

  // inner node in tree 'MIN'
  INNER_NODE = 0x4d494e00,

  // leaf node in tree 'MLN'
  LEAF_NODE = 0x4d4c4e00,

  // inner transaction to sign 'STX'
  TRANSACTION_SIGN = 0x53545800,

  // inner transaction to sign (TESTNET) 'stx'
  TRANSACTION_SIGN_TESTNET = 0x73747800,

  // inner transaction to multisign 'SMT'
  TRANSACTION_MULTISIGN = 0x534d5400,

  // ledger 'LWR'
  LEDGER = 0x4c575200,
}

export default HashPrefix
