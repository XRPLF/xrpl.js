/* eslint-disable max-len */
'use strict';
const _ = require('lodash');
const addresses = require('./addresses');
const accountTransactionsResponse = require('./acct-tx-response');
const SerializedObject = require('ripple-lib').SerializedObject;
const BASE_LEDGER_INDEX = 8819951;

module.exports.accountTransactionsResponse = accountTransactionsResponse;

module.exports.subscribeResponse = function(request) {
  return JSON.stringify({
    id: request.id,
    type: 'response',
    status: 'success',
    result: {
      fee_base: 10,
      fee_ref: 10,
      hostid: 'NAP',
      ledger_hash: '60EBABF55F6AB58864242CADA0B24FBEA027F2426917F39CA56576B335C0065A',
      ledger_index: BASE_LEDGER_INDEX,
      ledger_time: 463782770,
      load_base: 256,
      load_factor: 256,
      pubkey_node: 'n9Lt7DgQmxjHF5mYJsV2U9anALHmPem8PWQHWGpw4XMz79HA5aJY',
      random: 'EECFEE93BBB608914F190EC177B11DE52FC1D75D2C97DACBD26D2DFC6050E874',
      reserve_base: 20000000,
      reserve_inc: 5000000,
      server_status: 'full',
      validated_ledgers: '32570-' + BASE_LEDGER_INDEX.toString()
    }
  });
};

module.exports.ledgerClose = function(offset) {
  const ledgerIndex = BASE_LEDGER_INDEX + (offset || 0);
  return JSON.stringify({
    type: 'ledgerClosed',
    fee_base: 10,
    fee_ref: 10,
    ledger_hash: 'BEAE5AA56874B7F1DE3AA19ED2B8CA61EBDAEC518E421F314B3EAE9AC12BDD02',
    ledger_index: ledgerIndex,
    ledger_time: 463782900,
    reserve_base: 20000000,
    reserve_inc: 5000000,
    txn_count: 5,
    validated_ledgers: '32570-' + ledgerIndex.toString()
  });
};

module.exports.accountInfoResponse = function(request) {
  return JSON.stringify({
    id: request.id,
    status: 'success',
    type: 'response',
    result: {
      account_data: {
        Account: request.account,
        Balance: '922913243',
        Domain: '6578616D706C652E636F6D',
        EmailHash: '23463B99B62A72F26ED677CC556C44E8',
        Flags: 655360,
        LedgerEntryType: 'AccountRoot',
        OwnerCount: 1,
        PreviousTxnID: '19899273706A9E040FDB5885EE991A1DC2BAD878A0D6E7DBCFB714E63BF737F7',
        PreviousTxnLgrSeq: 6614625,
        Sequence: 23,
        TransferRate: 1002000000,
        WalletLocator: '00000000000000000000000000000000000000000000000000000000DEADBEEF',
        index: '396400950EA27EB5710C0D5BE1D2B4689139F168AC5D07C13B8140EC3F82AE71',
        urlgravatar: 'http://www.gravatar.com/avatar/23463b99b62a72f26ed677cc556c44e8'
      },
      ledger_index: 9592219
    }
  });
};

module.exports.accountNotFoundResponse = function(request) {
  return JSON.stringify({
    id: request.id,
    status: 'error',
    type: 'response',
    account: request.account,
    error: 'actNotFound',
    error_code: 15,
    error_message: 'Account not found.',
    ledger_current_index: 8861245,
    request: {
      account: request.account,
      command: 'account_info',
      id: request.id
    }
  });
};

module.exports.accountLinesResponse = function(request, options={}) {
  _.defaults(options, {
    ledger: BASE_LEDGER_INDEX
  });

  return JSON.stringify({
    id: request.id,
    status: 'success',
    type: 'response',
    result: {
      account: request.account,
      marker: options.marker,
      limit: request.limit,
      ledger_index: options.ledger,
      lines: [
        {
        account: 'r3vi7mWxru9rJCxETCyA1CHvzL96eZWx5z',
        balance: '0',
        currency: 'ASP',
        limit: '0',
        limit_peer: '10',
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'r3vi7mWxru9rJCxETCyA1CHvzL96eZWx5z',
        balance: '0',
        currency: 'XAU',
        limit: '0',
        limit_peer: '0',
        no_ripple: true,
        no_ripple_peer: true,
        quality_in: 0,
        quality_out: 0,
        freeze: true
      },
      {
        account: 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',
        balance: '2.497605752725159',
        currency: 'USD',
        limit: '5',
        limit_peer: '0',
        no_ripple: true,
        quality_in: 0,
        quality_out: 0,
        freeze: true
      },
      {
        account: 'rHpXfibHgSb64n8kK9QWDpdbfqSpYbM9a4',
        balance: '481.992867407479',
        currency: 'MXN',
        limit: '1000',
        limit_peer: '0',
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rLEsXccBGNR3UPuPu2hUXPjziKC3qKSBun',
        balance: '0.793598266778297',
        currency: 'EUR',
        limit: '1',
        limit_peer: '0',
        no_ripple: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rnuF96W4SZoCJmbHYBFoJZpR8eCaxNvekK',
        balance: '0',
        currency: 'CNY',
        limit: '3',
        limit_peer: '0',
        no_ripple: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rGwUWgN5BEg3QGNY3RX2HfYowjUTZdid3E',
        balance: '1.294889190631542',
        currency: 'DYM',
        limit: '3',
        limit_peer: '0',
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        balance: '0.3488146605801446',
        currency: 'CHF',
        limit: '0',
        limit_peer: '0',
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        balance: '2.114103174931847',
        currency: 'BTC',
        limit: '3',
        limit_peer: '0',
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        balance: '0',
        currency: 'USD',
        limit: '5000',
        limit_peer: '0',
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rpgKWEmNqSDAGFhy5WDnsyPqfQxbWxKeVd',
        balance: '-0.00111',
        currency: 'BTC',
        limit: '0',
        limit_peer: '10',
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rBJ3YjwXi2MGbg7GVLuTXUWQ8DjL7tDXh4',
        balance: '-0.1010780000080207',
        currency: 'BTC',
        limit: '0',
        limit_peer: '10',
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rLEsXccBGNR3UPuPu2hUXPjziKC3qKSBun',
        balance: '1',
        currency: 'USD',
        limit: '1',
        limit_peer: '0',
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'razqQKzJRdB4UxFPWf5NEpEG3WMkmwgcXA',
        balance: '8.07619790068559',
        currency: 'CNY',
        limit: '100',
        limit_peer: '0',
        no_ripple: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        balance: '7.292695098901099',
        currency: 'JPY',
        limit: '0',
        limit_peer: '0',
        no_ripple: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'r3vi7mWxru9rJCxETCyA1CHvzL96eZWx5z',
        balance: '0',
        currency: 'AUX',
        limit: '0',
        limit_peer: '0',
        no_ripple: true,
        no_ripple_peer: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'r9vbV3EHvXWjSkeQ6CAcYVPGeq7TuiXY2X',
        balance: '0',
        currency: 'USD',
        limit: '1',
        limit_peer: '0',
        no_ripple: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        balance: '12.41688780720394',
        currency: 'EUR',
        limit: '100',
        limit_peer: '0',
        no_ripple: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rfF3PNkwkq1DygW2wum2HK3RGfgkJjdPVD',
        balance: '35',
        currency: 'USD',
        limit: '500',
        limit_peer: '0',
        no_ripple: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rwUVoVMSURqNyvocPCcvLu3ygJzZyw8qwp',
        balance: '-5',
        currency: 'JOE',
        limit: '0',
        limit_peer: '50',
        no_ripple_peer: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rE6R3DWF9fBD7CyiQciePF9SqK58Ubp8o2',
        balance: '0',
        currency: 'USD',
        limit: '0',
        limit_peer: '100',
        no_ripple_peer: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rE6R3DWF9fBD7CyiQciePF9SqK58Ubp8o2',
        balance: '0',
        currency: 'JOE',
        limit: '0',
        limit_peer: '100',
        no_ripple_peer: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rs9M85karFkCRjvc6KMWn8Coigm9cbcgcx',
        balance: '0',
        currency: '015841551A748AD2C1F76FF6ECB0CCCD00000000',
        limit: '10.01037626125837',
        limit_peer: '0',
        no_ripple: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rEhDDUUNxpXgEHVJtC2cjXAgyx5VCFxdMF',
        balance: '0',
        currency: 'USD',
        limit: '0',
        limit_peer: '1',
        quality_in: 0,
        quality_out: 0,
        freeze: true
      }
      ]
    }
  });
};

module.exports.accountLinesCounterpartyResponse = function(request, options={}) {
  _.defaults(options, {
    ledger: BASE_LEDGER_INDEX
  });

  return JSON.stringify({
    id: request.id,
    status: 'success',
    type: 'response',
    result: {
      account: request.account,
      marker: options.marker,
      limit: request.limit,
      ledger_index: options.ledger,
      lines: [
      {
        account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        balance: '0.3488146605801446',
        currency: 'CHF',
        limit: '0',
        limit_peer: '0',
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        balance: '2.114103174931847',
        currency: 'BTC',
        limit: '3',
        limit_peer: '0',
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        balance: '0',
        currency: 'USD',
        limit: '5000',
        limit_peer: '0',
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        balance: '7.292695098901099',
        currency: 'JPY',
        limit: '0',
        limit_peer: '0',
        no_ripple: true,
        quality_in: 0,
        quality_out: 0
      },
      {
        account: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
        balance: '12.41688780720394',
        currency: 'EUR',
        limit: '100',
        limit_peer: '0',
        no_ripple: true,
        quality_in: 0,
        quality_out: 0
      }
      ]
    }
  });
};

module.exports.accountLinesNoCounterpartyResponse = function(request) {
  return JSON.stringify({
    id: request.id,
    status: 'success',
    type: 'response',
    result: {
      account: request.account,
      lines: []
    }
  });
};

module.exports.ledgerResponse = function(request) {
  return JSON.stringify(
    {
      id: request.id,
      status: 'success',
      type: 'response',
      result: {
        ledger: {
          accepted: true,
          account_hash: 'EC028EC32896D537ECCA18D18BEBE6AE99709FEFF9EF72DBD3A7819E918D8B96',
          close_time: 464908910,
          close_time_human: '2014-Sep-24 21:21:50',
          close_time_resolution: 10,
          closed: true,
          hash: '0F7ED9F40742D8A513AE86029462B7A6768325583DF8EE21B7EC663019DD6A0F',
          ledger_hash: '0F7ED9F40742D8A513AE86029462B7A6768325583DF8EE21B7EC663019DD6A0F',
          ledger_index: '9038214',
          parent_hash: '4BB9CBE44C39DC67A1BE849C7467FE1A6D1F73949EA163C38A0121A15E04FFDE',
          seqNum: '9038214',
          totalCoins: '99999973964317514',
          total_coins: '99999973964317514',
          transaction_hash: 'ECB730839EB55B1B114D5D1AD2CD9A932C35BA9AB6D3A8C2F08935EAC2BAC239',
          transactions: [
            '1FC4D12C30CE206A6E23F46FAC62BD393BE9A79A1C452C6F3A04A13BC7A5E5A3',
            'E25C38FDB8DD4A2429649588638EE05D055EE6D839CABAF8ABFB4BD17CFE1F3E'
         ]
        }
      }
    }
  );
};

const METADATA = module.exports.METADATA = {
  AffectedNodes: [
    {
    ModifiedNode: {
      FinalFields: {
        Account: 'r9tGqzZgKxVFvzKFdUqXAqTzazWBUia8Qr',
        BookDirectory: '4627DFFCFF8B5A265EDBD8AE8C14A52325DBFEDAF4F5C32E5E03E788E09BB000',
        BookNode: '0000000000000000',
        Flags: 0,
        OwnerNode: '0000000000000000',
        Sequence: 58,
        TakerGets: {
          currency: 'USD',
          issuer: addresses.OTHER_ACCOUNT,
          value: '5.648998'
        },
        TakerPays: '6208248802'
      },
      LedgerEntryType: 'Offer',
      LedgerIndex: '3CFB3C79D4F1BDB1EE5245259372576D926D9A875713422F7169A6CC60AFA68B',
      PreviousFields: {
        TakerGets: {
          currency: 'USD',
          issuer: addresses.OTHER_ACCOUNT,
          value: '5.65'
        },
        TakerPays: '6209350000'
      },
      PreviousTxnID: '8F571C346688D89AC1F737AE3B6BB5D976702B171CC7B4DE5CA3D444D5B8D6B4',
      PreviousTxnLgrSeq: 348433
    }
  },
  {
    ModifiedNode: {
      FinalFields: {
        Balance: {
          currency: 'USD',
          issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
          value: '-0.001'
        },
        Flags: 131072,
        HighLimit: {
          currency: 'USD',
          issuer: addresses.ISSUER,
          value: '1'
        },
        HighNode: '0000000000000000',
        LowLimit: {
          currency: 'USD',
          issuer: addresses.OTHER_ACCOUNT,
          value: '0'
        },
        LowNode: '0000000000000002'
      },
      LedgerEntryType: 'RippleState',
      LedgerIndex: '4BD1874F8F3A60EDB0C23F5BD43E07953C2B8741B226648310D113DE2B486F01',
      PreviousFields: {
        Balance: {
          currency: 'USD',
          issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
          value: '0'
        }
      },
      PreviousTxnID: '5B2006DAD0B3130F57ACF7CC5CCAC2EEBCD4B57AAA091A6FD0A24B073D08ABB8',
      PreviousTxnLgrSeq: 343703
    }
  },
  {
    ModifiedNode: {
      FinalFields: {
        Account: addresses.ACCOUNT,
        Balance: '9998898762',
        Flags: 0,
        OwnerCount: 3,
        Sequence: 5
      },
      LedgerEntryType: 'AccountRoot',
      LedgerIndex: '4F83A2CF7E70F77F79A307E6A472BFC2585B806A70833CCD1C26105BAE0D6E05',
      PreviousFields: {
        Balance: '9999999970',
        Sequence: 4
      },
      PreviousTxnID: '53354D84BAE8FDFC3F4DA879D984D24B929E7FEB9100D2AD9EFCD2E126BCCDC8',
      PreviousTxnLgrSeq: 343570
    }
  },
  {
    ModifiedNode: {
      FinalFields: {
        Account: 'r9tGqzZgKxVFvzKFdUqXAqTzazWBUia8Qr',
        Balance: '912695302618',
        Flags: 0,
        OwnerCount: 10,
        Sequence: 59
      },
      LedgerEntryType: 'AccountRoot',
      LedgerIndex: 'F3E119AAA87AF3607CF87F5523BB8278A83BCB4142833288305D767DD30C392A',
      PreviousFields: {
        Balance: '912694201420'
      },
      PreviousTxnID: '8F571C346688D89AC1F737AE3B6BB5D976702B171CC7B4DE5CA3D444D5B8D6B4',
      PreviousTxnLgrSeq: 348433
    }
  },
  {
    ModifiedNode: {
      FinalFields: {
        Balance: {
          currency: 'USD',
          issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
          value: '-5.5541638883365'
        },
        Flags: 131072,
        HighLimit: {
          currency: 'USD',
          issuer: 'r9tGqzZgKxVFvzKFdUqXAqTzazWBUia8Qr',
          value: '1000'
        },
        HighNode: '0000000000000000',
        LowLimit: {
          currency: 'USD',
          issuer: addresses.OTHER_ACCOUNT,
          value: '0'
        },
        LowNode: '000000000000000C'
      },
      LedgerEntryType: 'RippleState',
      LedgerIndex: 'FA1255C2E0407F1945BCF9351257C7C5C28B0F5F09BB81C08D35A03E9F0136BC',
      PreviousFields: {
        Balance: {
          currency: 'USD',
          issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
          value: '-5.5551658883365'
        }
      },
      PreviousTxnID: '8F571C346688D89AC1F737AE3B6BB5D976702B171CC7B4DE5CA3D444D5B8D6B4',
      PreviousTxnLgrSeq: 348433
    }
  }
  ],
  TransactionIndex: 0,
  TransactionResult: 'tesSUCCESS'
};

const BINARY_TRANSACTION = module.exports.BINARY_TRANSACTION = {
  Account: addresses.ACCOUNT,
  Amount: {
    currency: 'USD',
    issuer: addresses.ISSUER,
    value: '0.001'
  },
  Destination: addresses.ISSUER,
  Fee: '10',
  Flags: 0,
  Paths: [
    [
      {
    currency: 'USD',
    issuer: addresses.OTHER_ACCOUNT,
    type: 48,
    type_hex: '0000000000000030'
  },
  {
    account: addresses.OTHER_ACCOUNT,
    currency: 'USD',
    issuer: addresses.OTHER_ACCOUNT,
    type: 49,
    type_hex: '0000000000000031'
  }
  ]
  ],
  SendMax: '1112209',
  Sequence: 4,
  SigningPubKey: '02BC8C02199949B15C005B997E7C8594574E9B02BA2D0628902E0532989976CF9D',
  TransactionType: 'Payment',
  TxnSignature: '304502204EE3E9D1B01D8959B08450FCA9E22025AF503DEF310E34A93863A85CAB3C0BC5022100B61F5B567F77026E8DEED89EED0B7CAF0E6C96C228A2A65216F0DC2D04D52083'
};

const BINARY_TRANSACTION_SYNTH = module.exports.BINARY_TRANSACTION_SYNTH = {
  date: 416447810,
  hash: 'F4AB442A6D4CBB935D66E1DA7309A5FC71C7143ED4049053EC14E3875B0CF9BF',
  inLedger: 348860,
  ledger_index: 348860,
  validated: true
};

module.exports.transactionResponse = function(request) {
  return JSON.stringify({
    id: request.id,
    status: 'success',
    type: 'response',
    result: _.extend({
      meta: SerializedObject.from_json(METADATA).to_hex(),
      tx: SerializedObject.from_json(BINARY_TRANSACTION).to_hex()
    }, BINARY_TRANSACTION_SYNTH)
  });
};

module.exports.transactionNotFoundResponse = function(request) {
  return JSON.stringify({
    id: request.id,
    status: 'error',
    type: 'response',
    error: 'txnNotFound',
    error_code: 24,
    error_message: 'Transaction not found.',
    request: {
      command: 'tx',
      id: request.id,
      transaction: 'E08D6E9754025CA2534A78707605E0601F03ACE063687A0CA1BDDACFCD1698C7'
    }
  });
};

module.exports.serverInfoResponse = function(request) {
  return JSON.stringify({
    id: request.id,
    status: 'success',
    type: 'response',
    result: {
      info: {
        build_version: '0.24.0-rc1',
        complete_ledgers: '32570-6595042',
        hostid: 'ARTS',
        last_close: {converge_time_s: 2.007, proposers: 4},
        load_factor: 1,
        peers: 53,
        pubkey_node: 'n94wWvFUmaKGYrKUGgpv1DyYgDeXRGdACkNQaSe7zJiy5Znio7UC',
        server_state: 'full',
        validated_ledger: {
          age: 5,
          base_fee_xrp: 0.00001,
          hash: '4482DEE5362332F54A4036ED57EE1767C9F33CF7CE5A6670355C16CECE381D46',
          reserve_base_xrp: 20,
          reserve_inc_xrp: 5,
          seq: 6595042
        },
        validation_quorum: 3
      }
    }
  });
};

module.exports.submitResponse = function(request) {
  return JSON.stringify({
    id: request.id,
    status: 'success',
    type: 'response',
    result: {
      success: true,
      engine_result: 'tesSUCCESS',
      engine_result_code: 0,
      engine_result_message: 'The transaction was applied. Only final in a validated ledger.',
      tx_blob: request.tx_blob,
      tx_json: {}     // stubbed out for simplicity, not needed for testing
    }
  });
};
