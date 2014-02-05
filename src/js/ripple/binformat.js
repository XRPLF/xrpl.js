/**
 * Data type map.
 *
 * Mapping of type ids to data types. The type id is specified by the high
 */
var TYPES_MAP = exports.types = [
  void(0),

  // Common
  'Int16',    // 1
  'Int32',    // 2
  'Int64',    // 3
  'Hash128',  // 4
  'Hash256',  // 5
  'Amount',   // 6
  'VL',       // 7
  'Account',  // 8

  // 9-13 reserved
  void(0),    // 9
  void(0),    // 10
  void(0),    // 11
  void(0),    // 12
  void(0),    // 13

  'Object',   // 14
  'Array',    // 15

  // Uncommon
  'Int8',     // 16
  'Hash160',  // 17
  'PathSet',  // 18
  'Vector256' // 19
];

/**
 * Field type map.
 *
 * Mapping of field type id to field type name.
 */

var FIELDS_MAP = exports.fields = {
  // Common types
  1: { // Int16
    1: 'LedgerEntryType',
    2: 'TransactionType'
  },
  2: { // Int32
    2: 'Flags',
    3: 'SourceTag',
    4: 'Sequence',
    5: 'PreviousTxnLgrSeq',
    6: 'LedgerSequence',
    7: 'CloseTime',
    8: 'ParentCloseTime',
    9: 'SigningTime',
    10: 'Expiration',
    11: 'TransferRate',
    12: 'WalletSize',
    13: 'OwnerCount',
    14: 'DestinationTag',
    // Skip 15
    16: 'HighQualityIn',
    17: 'HighQualityOut',
    18: 'LowQualityIn',
    19: 'LowQualityOut',
    20: 'QualityIn',
    21: 'QualityOut',
    22: 'StampEscrow',
    23: 'BondAmount',
    24: 'LoadFee',
    25: 'OfferSequence',
    26: 'FirstLedgerSequence',
    27: 'LastLedgerSequence',
    28: 'TransactionIndex',
    29: 'OperationLimit',
    30: 'ReferenceFeeUnits',
    31: 'ReserveBase',
    32: 'ReserveIncrement',
    33: 'SetFlag',
    34: 'ClearFlag'
  },
  3: { // Int64
    1: 'IndexNext',
    2: 'IndexPrevious',
    3: 'BookNode',
    4: 'OwnerNode',
    5: 'BaseFee',
    6: 'ExchangeRate',
    7: 'LowNode',
    8: 'HighNode'
  },
  4: { // Hash128
    1: 'EmailHash'
  },
  5: { // Hash256
    1: 'LedgerHash',
    2: 'ParentHash',
    3: 'TransactionHash',
    4: 'AccountHash',
    5: 'PreviousTxnID',
    6: 'LedgerIndex',
    7: 'WalletLocator',
    8: 'RootIndex',
    16: 'BookDirectory',
    17: 'InvoiceID',
    18: 'Nickname',
    19: 'Feature'
  },
  6: { // Amount
    1: 'Amount',
    2: 'Balance',
    3: 'LimitAmount',
    4: 'TakerPays',
    5: 'TakerGets',
    6: 'LowLimit',
    7: 'HighLimit',
    8: 'Fee',
    9: 'SendMax',
    16: 'MinimumOffer',
    17: 'RippleEscrow'
  },
  7: { // VL
    1: 'PublicKey',
    2: 'MessageKey',
    3: 'SigningPubKey',
    4: 'TxnSignature',
    5: 'Generator',
    6: 'Signature',
    7: 'Domain',
    8: 'FundCode',
    9: 'RemoveCode',
    10: 'ExpireCode',
    11: 'CreateCode'
  },
  8: { // Account
    1: 'Account',
    2: 'Owner',
    3: 'Destination',
    4: 'Issuer',
    7: 'Target',
    8: 'RegularKey'
  },
  14: { // Object
    1: void(0),  //end of Object
    2: 'TransactionMetaData',
    3: 'CreatedNode',
    4: 'DeletedNode',
    5: 'ModifiedNode',
    6: 'PreviousFields',
    7: 'FinalFields',
    8: 'NewFields',
    9: 'TemplateEntry'
  },
  15: { // Array
    1: void(0),  //end of Array
    2: 'SigningAccounts',
    3: 'TxnSignatures',
    4: 'Signatures',
    5: 'Template',
    6: 'Necessary',
    7: 'Sufficient',
    8: 'AffectedNodes'
  },

  // Uncommon types
  16: { // Int8
    1: 'CloseResolution',
    2: 'TemplateEntryType',
    3: 'TransactionResult'
  },
  17: { // Hash160
    1: 'TakerPaysCurrency',
    2: 'TakerPaysIssuer',
    3: 'TakerGetsCurrency',
    4: 'TakerGetsIssuer'
  },
  18: { // PathSet
    1: 'Paths'
  },
  19: { // Vector256
    1: 'Indexes',
    2: 'Hashes',
    3: 'Features'
  }
};

var INVERSE_FIELDS_MAP = exports.fieldsInverseMap = { };

Object.keys(FIELDS_MAP).forEach(function(k1) {
  Object.keys(FIELDS_MAP[k1]).forEach(function(k2) {
    INVERSE_FIELDS_MAP[FIELDS_MAP[k1][k2]] = [ Number(k1), Number(k2) ];
  });
});


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
