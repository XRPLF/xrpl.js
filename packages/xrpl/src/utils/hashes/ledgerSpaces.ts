/**
 * XRP Ledger namespace prefixes.
 *
 * The XRP Ledger is a key-value store. In order to avoid name collisions,
 * names are partitioned into namespaces.
 *
 * Each namespace is just a single character prefix.
 *
 * See [LedgerNameSpace enum](https://github.com/ripple/rippled/blob/master/src/ripple/protocol/LedgerFormats.h#L100).
 */
const ledgerSpaces = {
  account: 'a',
  dirNode: 'd',
  generatorMap: 'g',
  rippleState: 'r',
  // Entry for an offer.
  offer: 'o',
  // Directory of things owned by an account.
  ownerDir: 'O',
  // Directory of order books.
  bookDir: 'B',
  contract: 'c',
  skipList: 's',
  escrow: 'u',
  amendment: 'f',
  feeSettings: 'e',
  ticket: 'T',
  signerList: 'S',
  paychan: 'x',
  check: 'C',
  depositPreauth: 'p',
}

export default ledgerSpaces
