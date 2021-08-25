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
  // transaction plus signature to give transaction ID
  TRANSACTION_ID = 0x54584e00, // 'TXN'

  // transaction plus metadata
  TRANSACTION_NODE = 0x534e4400, // 'TND'

  // inner node in tree
  INNER_NODE = 0x4d494e00, // 'MIN'

  // leaf node in tree
  LEAF_NODE = 0x4d4c4e00, // 'MLN'

  // inner transaction to sign
  TRANSACTION_SIGN = 0x53545800, // 'STX'

  // inner transaction to sign (TESTNET)
  TRANSACTION_SIGN_TESTNET = 0x73747800, // 'stx'

  // inner transaction to multisign
  TRANSACTION_MULTISIGN = 0x534d5400, // 'SMT'

  // ledger
  LEDGER = 0x4c575200 // 'LWR'
}

export default HashPrefix
