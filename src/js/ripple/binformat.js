var REQUIRED = exports.REQUIRED = 0,
    OPTIONAL = exports.OPTIONAL = 1,
    DEFAULT  = exports.DEFAULT  = 2;

var base = [
  [ 'TransactionType'    , REQUIRED,  2, "Int16" ],
  [ 'Flags'              , OPTIONAL,  2, "Int32" ],
  [ 'SourceTag'          , OPTIONAL,  3, "Int32" ],
  [ 'Account'            , REQUIRED,  1, "Account" ],
  [ 'Sequence'           , REQUIRED,  4, "Int32" ],
  [ 'Fee'                , REQUIRED,  8, "Amount" ],
  [ 'OperationLimit'     , OPTIONAL, 29, "Int32" ],
  [ 'SigningPubKey'      , REQUIRED,  3, "VariableLength" ],
  [ 'TxnSignature'       , OPTIONAL,  4, "VariableLength" ]
];

exports.tx = {
  AccountSet: [3].concat(base, [
    [ 'EmailHash'          , OPTIONAL,  1, "Hash128" ],
    [ 'WalletLocator'      , OPTIONAL,  7, "Hash256" ],
    [ 'WalletSize'         , OPTIONAL, 12, "Int32" ],
    [ 'MessageKey'         , OPTIONAL,  2, "VariableLength" ],
    [ 'Domain'             , OPTIONAL,  7, "VariableLength" ],
    [ 'TransferRate'       , OPTIONAL, 11, "Int32" ]
  ]),
  TrustSet: [20].concat(base, [
    [ 'LimitAmount'        , OPTIONAL,  3, "Amount" ],
    [ 'QualityIn'          , OPTIONAL, 20, "Int32" ],
    [ 'QualityOut'         , OPTIONAL, 21, "Int32" ]
  ]),
  OfferCreate: [7].concat(base, [
    [ 'TakerPays'          , REQUIRED,  4, "Amount" ],
    [ 'TakerGets'          , REQUIRED,  5, "Amount" ],
    [ 'Expiration'         , OPTIONAL, 10, "Int32" ]
  ]),
  OfferCancel: [8].concat(base, [
    [ 'OfferSequence'      , REQUIRED, 25, "Int32" ]
  ]),
  SetRegularKey: [5].concat(base, [
    [ 'RegularKey'         , REQUIRED,  8, "Account" ]
  ]),
  Payment: [0].concat(base, [
    [ 'Destination'        , REQUIRED,  3, "Account" ],
    [ 'Amount'             , REQUIRED,  1, "Amount" ],
    [ 'SendMax'            , OPTIONAL,  9, "Amount" ],
    [ 'Paths'              , DEFAULT ,  1, "PathSet" ],
    [ 'InvoiceID'          , OPTIONAL, 17, "Hash256" ],
    [ 'DestinationTag'     , OPTIONAL, 14, "Int32" ]
  ]),
  Contract: [9].concat(base, [
    [ 'Expiration'         , REQUIRED, 10, "Int32" ],
    [ 'BondAmount'         , REQUIRED, 23, "Int32" ],
    [ 'StampEscrow'        , REQUIRED, 22, "Int32" ],
    [ 'RippleEscrow'       , REQUIRED, 17, "Amount" ],
    [ 'CreateCode'         , OPTIONAL, 11, "VariableLength" ],
    [ 'FundCode'           , OPTIONAL,  8, "VariableLength" ],
    [ 'RemoveCode'         , OPTIONAL,  9, "VariableLength" ],
    [ 'ExpireCode'         , OPTIONAL, 10, "VariableLength" ]
  ]),
  RemoveContract: [10].concat(base, [
    [ 'Target'             , REQUIRED,  7, "Account" ]
  ]),
  EnableFeature: [100].concat(base, [
    [ 'Feature'            , REQUIRED, 19, "Hash256" ]
  ]),
  SetFee: [101].concat(base, [
    [ 'Features'           , REQUIRED,  9, "Array" ],
    [ 'BaseFee'            , REQUIRED,  5, "Int64" ],
    [ 'ReferenceFeeUnits'  , REQUIRED, 30, "Int32" ],
    [ 'ReserveBase'        , REQUIRED, 31, "Int32" ],
    [ 'ReserveIncrement'   , REQUIRED, 32, "Int32" ]
  ])
};

exports.ledger = {
  AccountRoot: [97],
  Contract: [99],
  DirectoryNode: [100],
  Features: [102],
  GeneratorMap: [103],
  LedgerHashes: [104],
  Nickname: [110],
  Offer: [111],
  RippleState: [114],
  FeeSettings: [115]
};

exports.metadata = [
  [ 'TransactionIndex'     , REQUIRED, 28, "Int32" ],
  [ 'TransactionResult'    , REQUIRED,  3, "Int8" ],
  [ 'AffectedNodes'        , REQUIRED,  8, "Array" ]
];

exports.ter = {
  tesSUCCESS: 0,
  tecCLAIM: 100,
  tecPATH_PARTIAL: 101,
  tecUNFUNDED_ADD: 102,
  tecUNFUNDED_OFFER: 103,
  tecUNFUNDED_PAYMENT: 104,
  tecFAILED_PROCESSING: 105,
  tecDIR_FULL: 121,
  tecINSUF_RESERVE_LINE: 122,
  tecINSUF_RESERVE_OFFER: 123,
  tecNO_DST: 124,
  tecNO_DST_INSUF_XRP: 125,
  tecNO_LINE_INSUF_RESERVE: 126,
  tecNO_LINE_REDUNDANT: 127,
  tecPATH_DRY: 128,
  tecUNFUNDED: 129,
  tecMASTER_DISABLED: 130,
  tecNO_REGULAR_KEY: 131,
  tecOWNERS: 132
};
