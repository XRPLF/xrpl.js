var utils       = require('./testutils');
var assert      = require('assert');
var Amount      = utils.load_module('amount').Amount;
var Transaction = utils.load_module('transaction').Transaction;
var Remote      = utils.load_module('remote').Remote;
var Server      = utils.load_module('server').Server;

var transactionResult = {
  engine_result: 'tesSUCCESS',
  engine_result_code: 0,
  engine_result_message: 'The transaction was applied.',
  ledger_hash: '2031E311FD28A6B37697BD6ECF8E6661521902E7A6A8EF069A2F3C628E76A322',
  ledger_index: 7106144,
  status: 'closed',
  type: 'transaction',
  validated: true,
  metadata: {
    AffectedNodes: [ ],
    TransactionIndex: 0,
    TransactionResult: 'tesSUCCESS' },
    tx_json: {
      Account: 'rHPotLj3CNKaP4bQANcecEuT8hai3VpxfB',
      Amount: '1000000',
      Destination: 'rYtn3D1VGQyf1MTqcwLDepUKm22YEGXGJA',
      Fee: '10',
      Flags: 0,
      LastLedgerSequence: 7106151,
      Sequence: 2973,
      SigningPubKey: '0306E9F38DF11402953A5B030C1AE8A88C47E348170C3B8EC6C8D775E797168462',
      TransactionType: 'Payment',
      TxnSignature: '3045022100A58B0460BC5092CB4F96155C19125A4E079C870663F1D5E8BBC9BDEE06D51F530220408A3AA26988ABF18E16BE77B016F25018A2AA7C99FFE723FC8598471357DBCF',
      date: 455660500,
      hash: '61D60378AB70ACE630B20A81B50708A3DB5E7CEE35914292FF3761913DA61DEA'
    }
};

describe('Transaction', function() {
  it('Success listener', function(done) {
    var transaction = new Transaction();

    transaction.once('cleanup', function(message) {
      assert.deepEqual(message, transactionResult);
      assert(transaction.finalized);
      assert.strictEqual(transaction.state, 'validated');
      done();
    });

    transaction.emit('success', transactionResult);
  });

  it('Error listener', function(done) {
    var transaction = new Transaction();

    transaction.once('cleanup', function(message) {
      assert.deepEqual(message, transactionResult);
      assert(transaction.finalized);
      assert.strictEqual(transaction.state, 'failed');
      done();
    });

    transaction.emit('error', transactionResult);
  });

  it('Submitted listener', function() {
    var transaction = new Transaction();
    transaction.emit('submitted');
    assert.strictEqual(transaction.state, 'submitted');
  });

  it('Proposed listener', function() {
    var transaction = new Transaction();
    transaction.emit('proposed');
    assert.strictEqual(transaction.state, 'pending');
  });

  it('Check response code is tel', function() {
    var transaction = new Transaction();
    assert(!transaction.isTelLocal(-400));
    assert(transaction.isTelLocal(-399));
    assert(transaction.isTelLocal(-300));
    assert(!transaction.isTelLocal(-299));
  });

  it('Check response code is tem', function() {
    var transaction = new Transaction();
    assert(!transaction.isTemMalformed(-300));
    assert(transaction.isTemMalformed(-299));
    assert(transaction.isTemMalformed(-200));
    assert(!transaction.isTemMalformed(-199));
  });

  it('Check response code is tef', function() {
    var transaction = new Transaction();
    assert(!transaction.isTefFailure(-200));
    assert(transaction.isTefFailure(-199));
    assert(transaction.isTefFailure(-100));
    assert(!transaction.isTefFailure(-99));
  });

  it('Check response code is ter', function() {
    var transaction = new Transaction();
    assert(!transaction.isTerRetry(-100));
    assert(transaction.isTerRetry(-99));
    assert(transaction.isTerRetry(-1));
    assert(!transaction.isTerRetry(0));
  });

  it('Check response code is tep', function() {
    var transaction = new Transaction();
    assert(!transaction.isTepSuccess(-1));
    assert(transaction.isTepSuccess(0));
    assert(transaction.isTepSuccess(1e3));
  });

  it('Check response code is tec', function() {
    var transaction = new Transaction();
    assert(!transaction.isTecClaimed(99));
    assert(transaction.isTecClaimed(100));
    assert(transaction.isTecClaimed(1e3));
  });

  it('Check response code is rejected', function() {
    var transaction = new Transaction();
    assert(!transaction.isRejected(0));
    assert(!transaction.isRejected(-99));
    assert(transaction.isRejected(-100));
    assert(transaction.isRejected(-399));
    assert(!transaction.isRejected(-400));
  });

  it('Set state', function(done) {
    var transaction = new Transaction();
    transaction.state = 'pending';

    var receivedEvents = 0;
    var events = 2;

    transaction.once('state', function(state) {
      assert.strictEqual(state, 'validated');
      if (++receivedEvents === events) {
        done();
      }
    });

    transaction.once('save', function() {
      if (++receivedEvents === events) {
        done();
      }
    });

    transaction.setState('validated');
  });

  it('Finalize submission', function() {
    var transaction = new Transaction();

    var tx = transactionResult;
    tx.ledger_hash = '2031E311FD28A6BZ76Z7BD6ECF8E6661521902E7A6A8EF069A2F3C628E76A322';
    tx.ledger_index = 7106150;

    transaction.result = transactionResult;
    transaction.finalize(tx);

    assert.strictEqual(transaction.result.ledger_index, tx.ledger_index);
    assert.strictEqual(transaction.result.ledger_hash, tx.ledger_hash);
  });

  it('Finalize unsubmitted', function() {
    var transaction = new Transaction();
    transaction.finalize(transactionResult);

    assert.strictEqual(transaction.result.ledger_index, transactionResult.ledger_index);
    assert.strictEqual(transaction.result.ledger_hash, transactionResult.ledger_hash);
  });

  it('Get account secret', function() {
    var remote = new Remote();

    remote.secrets = {
      rpzT237Ctpaa58KieifoK8RyBmmRwEcfhK: 'shY1njzHAXp8Qt3bpxYW6RpoZtMKP',
      rpdxPs9CR93eLAc5DTvAgv4S9XJ1CzKj1a: 'ssboTJezioTq8obyvDU9tVo95NGGQ'
    };

    var transaction = new Transaction(remote);

    assert.strictEqual(transaction._accountSecret('rpzT237Ctpaa58KieifoK8RyBmmRwEcfhK'), 'shY1njzHAXp8Qt3bpxYW6RpoZtMKP');
    assert.strictEqual(transaction._accountSecret('rpdxPs9CR93eLAc5DTvAgv4S9XJ1CzKj1a'), 'ssboTJezioTq8obyvDU9tVo95NGGQ');
    assert.strictEqual(transaction._accountSecret('rExistNot'), void(0));
  });

  it('Get fee units', function() {
    var remote = new Remote();
    var transaction = new Transaction(remote);
    assert.strictEqual(transaction.feeUnits(), 10);
  });

  it('Compute fee', function() {
    var remote = new Remote();

    var s1 = new Server(remote, 'wss://s-west.ripple.com:443');
    s1._connected = true;

    var s2 = new Server(remote, 'wss://s-west.ripple.com:443');
    s2._connected = true;
    s2._load_factor = 256 * 4;

    var s3 = new Server(remote, 'wss://s-west.ripple.com:443');
    s3._connected = true;
    s3._load_factor = 256 * 8;

    var s4 = new Server(remote, 'wss://s-west.ripple.com:443');
    s4._connected = true;
    s4._load_factor = 256 * 8;

    var s5 = new Server(remote, 'wss://s-west.ripple.com:443');
    s5._connected = true;
    s5._load_factor = 256 * 7;

    remote._servers = [ s2, s3, s1, s4 ];

    assert.strictEqual(s1._computeFee(10), '12');
    assert.strictEqual(s2._computeFee(10), '48');
    assert.strictEqual(s3._computeFee(10), '96');
    assert.strictEqual(s4._computeFee(10), '96');
    assert.strictEqual(s5._computeFee(10), '84');

    var transaction = new Transaction(remote);

    assert.strictEqual(transaction._computeFee(), '72');
  });

  it('Compute fee, no remote', function() {
    var transaction = new Transaction();
    assert.strictEqual(transaction._computeFee(10), void(0));
  });

  it('Compute fee - no connected server', function() {
    var remote = new Remote();

    var s1 = new Server(remote, 'wss://s-west.ripple.com:443');
    s1._connected = false;

    var s2 = new Server(remote, 'wss://s-west.ripple.com:443');
    s2._connected = false;
    s2._load_factor = 256 * 4;

    var s3 = new Server(remote, 'wss://s-west.ripple.com:443');
    s3._connected = false;
    s3._load_factor = 256 * 8;

    remote._servers = [ s1, s2, s3 ];

    assert.strictEqual(s1._computeFee(10), '12');
    assert.strictEqual(s2._computeFee(10), '48');
    assert.strictEqual(s3._computeFee(10), '96');

    var transaction = new Transaction(remote);

    assert.strictEqual(transaction._computeFee(), void(0));
  });

  it('Compute fee - one connected server', function() {
    var remote = new Remote();

    var s1 = new Server(remote, 'wss://s-west.ripple.com:443');
    s1._connected = false;

    var s2 = new Server(remote, 'wss://s-west.ripple.com:443');
    s2._connected = false;
    s2._load_factor = 256 * 4;

    var s3 = new Server(remote, 'wss://s-west.ripple.com:443');
    s3._connected = true;
    s3._load_factor = 256 * 8;

    remote._servers = [ s1, s2, s3 ];

    assert.strictEqual(s1._computeFee(10), '12');
    assert.strictEqual(s2._computeFee(10), '48');
    assert.strictEqual(s3._computeFee(10), '96');

    var transaction = new Transaction(remote);

    assert.strictEqual(transaction._computeFee(), '96');
  });

  it('Does not compute a median fee with floating point', function() {
    var remote = new Remote();

    var s1 = new Server(remote, 'wss://s-west.ripple.com:443');
    s1._connected = true;

    var s2 = new Server(remote, 'wss://s-west.ripple.com:443');
    s2._connected = true;
    s2._load_factor = 256 * 4;

    var s3 = new Server(remote, 'wss://s-west.ripple.com:443');
    s3._connected = true;

    s3._load_factor = (256 * 7) + 1;

    var s4 = new Server(remote, 'wss://s-west.ripple.com:443');
    s4._connected = true;
    s4._load_factor = 256 * 16;

    remote._servers = [ s1, s2, s3, s4  ];

    assert.strictEqual(s1._computeFee(10), '12');
    assert.strictEqual(s2._computeFee(10), '48');
    // 66.5
    assert.strictEqual(s3._computeFee(10), '85');
    assert.strictEqual(s4._computeFee(10), '192');

    var transaction = new Transaction(remote);
    transaction.tx_json.Sequence = 1;
    var src = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
    var dst = 'rGihwhaqU8g7ahwAvTq6iX5rvsfcbgZw6v';
    
    transaction.payment(src, dst, '100');
    remote.set_secret(src, 'masterpassphrase');

    assert(transaction.complete());
    var json = transaction.serialize().to_json();
    assert.notStrictEqual(json.Fee, '66500000', 'Fee == 66500000, i.e. 66.5 XRP!');
  });


  it('Compute fee - even server count', function() {
    var remote = new Remote();

    var s1 = new Server(remote, 'wss://s-west.ripple.com:443');
    s1._connected = true;

    var s2 = new Server(remote, 'wss://s-west.ripple.com:443');
    s2._connected = true;
    s2._load_factor = 256 * 4;

    var s3 = new Server(remote, 'wss://s-west.ripple.com:443');
    s3._connected = true;
    s3._load_factor = 256 * 8;

    var s4 = new Server(remote, 'wss://s-west.ripple.com:443');
    s4._connected = true;
    s4._load_factor = 256 * 16;

    remote._servers = [ s1, s2, s3, s4  ];

    assert.strictEqual(s1._computeFee(10), '12');
    assert.strictEqual(s2._computeFee(10), '48');
    // 72
    assert.strictEqual(s3._computeFee(10), '96');
    assert.strictEqual(s4._computeFee(10), '192');

    var transaction = new Transaction(remote);

    assert.strictEqual(transaction._computeFee(), '72');
  });

  it('Complete transaction', function(done) {
    var remote = new Remote();

    var s1 = new Server(remote, 'wss://s-west.ripple.com:443');
    s1._connected = true;

    remote._servers = [ s1 ];
    remote.trusted = true;
    remote.local_signing = true;

    var transaction = new Transaction(remote);
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoij';
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';
    transaction.tx_json.Flags = 0;

    assert(transaction.complete());

    done();
  });

  it('Complete transaction, local signing, no remote', function(done) {
    var transaction = new Transaction();
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoij';
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';

    assert(transaction.complete());

    done();
  });

  it('Complete transaction - untrusted', function(done) {
    var remote = new Remote();
    var transaction = new Transaction(remote);

    remote.trusted = false;
    remote.local_signing = false;

    transaction.once('error', function(err) {
      assert.strictEqual(err.result, 'tejServerUntrusted');
      done();
    });

    assert(!transaction.complete());
  });

  it('Complete transaction - no secret', function(done) {
    var remote = new Remote();
    var transaction = new Transaction(remote);

    remote.trusted = true;
    remote.local_signing = true;

    transaction.once('error', function(err) {
      assert.strictEqual(err.result, 'tejSecretUnknown');
      done();
    });

    assert(!transaction.complete());
  });

  it('Complete transaction - invalid secret', function(done) {
    var remote = new Remote();
    var transaction = new Transaction(remote);

    remote.trusted = true;
    remote.local_signing = true;

    transaction.SigningPubKey = void(0);
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoijX';

    transaction.once('error', function(err) {
      assert.strictEqual(err.result, 'tejSecretInvalid');
      done();
    });

    assert(!transaction.complete());
  });

  it('Complete transaction - cached SigningPubKey', function(done) {
    var remote = new Remote();
    var transaction = new Transaction(remote);

    remote.trusted = true;
    remote.local_signing = true;

    transaction.tx_json.SigningPubKey = '021FED5FD081CE5C4356431267D04C6E2167E4112C897D5E10335D4E22B4DA49ED';
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoijX';

    transaction.once('error', function(err) {
      assert.notStrictEqual(err.result, 'tejSecretInvalid');
      done();
    });

    assert(!transaction.complete());
  });

  it('Complete transaction - compute fee', function(done) {
    var remote = new Remote();
    var transaction = new Transaction(remote);

    var s1 = new Server(remote, 'wss://s-west.ripple.com:443');
    s1._connected = true;

    remote._servers = [ s1 ];
    remote.trusted = true;
    remote.local_signing = true;

    transaction.tx_json.SigningPubKey = '021FED5FD081CE5C4356431267D04C6E2167E4112C897D5E10335D4E22B4DA49ED';
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoij';

    assert.strictEqual(transaction.tx_json.Fee, void(0));

    assert(transaction.complete());

    assert.strictEqual(transaction.tx_json.Fee, '12');

    done();
  });

  it('Complete transaction - compute fee exceeds max fee', function(done) {
    var remote = new Remote({ max_fee: 10 });

    var s1 = new Server(remote, 'wss://s-west.ripple.com:443');
    s1._connected = true;
    s1._load_factor = 256 * 16;

    remote._servers = [ s1 ];
    remote.trusted = true;
    remote.local_signing = true;

    var transaction = new Transaction(remote);
    transaction.tx_json.SigningPubKey = '021FED5FD081CE5C4356431267D04C6E2167E4112C897D5E10335D4E22B4DA49ED';
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoij';

    transaction.once('error', function(err) {
      assert.strictEqual(err.result, 'tejMaxFeeExceeded');
      done();
    });

    assert(!transaction.complete());
  });

  it('Complete transaction - canonical flags', function(done) {
    var remote = new Remote();

    var s1 = new Server(remote, 'wss://s-west.ripple.com:443');
    s1._connected = true;
    s1._load_factor = 256;

    remote._servers = [ s1 ];
    remote.trusted = true;
    remote.local_signing = true;

    var transaction = new Transaction(remote);
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoij';
    transaction.tx_json.SigningPubKey = '021FED5FD081CE5C4356431267D04C6E2167E4112C897D5E10335D4E22B4DA49ED';
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';
    transaction.tx_json.Flags = 0;

    assert(transaction.complete());
    assert.strictEqual(transaction.tx_json.Flags, 2147483648);

    done();
  });

  it('Get signing hash', function(done) {
    var transaction = new Transaction();
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoij';
    transaction.tx_json.SigningPubKey = '021FED5FD081CE5C4356431267D04C6E2167E4112C897D5E10335D4E22B4DA49ED';
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';
    transaction.tx_json.Flags = 0;
    transaction.tx_json.Fee = 10;
    transaction.tx_json.Sequence = 1;
    transaction.tx_json.TransactionType = 'AccountSet';

    assert.strictEqual(transaction.signingHash(), 'D1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE')

    done();
  });

  it('Get hash - no prefix', function(done) {
    var transaction = new Transaction();
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoij';
    transaction.tx_json.SigningPubKey = '021FED5FD081CE5C4356431267D04C6E2167E4112C897D5E10335D4E22B4DA49ED';
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';
    transaction.tx_json.Flags = 0;
    transaction.tx_json.Fee = 10;
    transaction.tx_json.Sequence = 1;
    transaction.tx_json.TransactionType = 'AccountSet';

    assert.strictEqual(transaction.hash(), '1A860FC46D1DD9200560C64002418A4E8BBDE939957AC82D7B14D80A1C0E2EB5')

    done();
  });

  it('Get hash - prefix', function(done) {
    var transaction = new Transaction();
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoij';
    transaction.tx_json.SigningPubKey = '021FED5FD081CE5C4356431267D04C6E2167E4112C897D5E10335D4E22B4DA49ED';
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';
    transaction.tx_json.Flags = 0;
    transaction.tx_json.Fee = 10;
    transaction.tx_json.Sequence = 1;
    transaction.tx_json.TransactionType = 'AccountSet';

    assert.strictEqual(transaction.hash('HASH_TX_SIGN'), 'D1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE')
    assert.strictEqual(transaction.hash('HASH_TX_SIGN_TESTNET'), '9FE7D27FC5B9891076B66591F99A683E01E0912986A629235459A3BD1961F341');

    done();
  });

  it('Get hash - invalid prefix', function(done) {
    var transaction = new Transaction();
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoij';
    transaction.tx_json.SigningPubKey = '021FED5FD081CE5C4356431267D04C6E2167E4112C897D5E10335D4E22B4DA49ED';
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';
    transaction.tx_json.Flags = 0;
    transaction.tx_json.Fee = 10;
    transaction.tx_json.Sequence = 1;
    transaction.tx_json.TransactionType = 'AccountSet';

    assert.throws(function() {
      transaction.hash('HASH_TX_SIGNZ');
    });

    done();
  });

  it('Get hash - complex transaction', function() {
    var input_json = {
      Account : 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
      Amount : {
        currency : 'LTC',
        issuer : 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
        value : '9.985'
      },
      Destination : 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
      Fee : '15',
      Flags : 0,
      Paths : [
        [
          {
        account : 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',
        currency : 'USD',
        issuer : 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',
        type : 49,
        type_hex : '0000000000000031'
      },
      {
        currency : 'LTC',
        issuer : 'rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX',
        type : 48,
        type_hex : '0000000000000030'
      },
      {
        account : 'rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX',
        currency : 'LTC',
        issuer : 'rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX',
        type : 49,
        type_hex : '0000000000000031'
      }
      ]
      ],
      SendMax : {
        currency : 'USD',
        issuer : 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
        value : '30.30993068'
      },
      Sequence : 415,
      SigningPubKey : '02854B06CE8F3E65323F89260E9E19B33DA3E01B30EA4CA172612DE77973FAC58A',
      TransactionType : 'Payment',
      TxnSignature : '304602210096C2F385530587DE573936CA51CB86B801A28F777C944E268212BE7341440B7F022100EBF0508A9145A56CDA7FAF314DF3BBE51C6EE450BA7E74D88516891A3608644E'
    };

    var expected_hash = "87366146D381AD971B97DD41CFAC1AE4670B0E996AB574B0CE18CE6467811868";
    var transaction = Transaction.from_json(input_json);

    assert.deepEqual(transaction.hash(), expected_hash);
  });

  it('Serialize transaction', function() {
    var input_json = {
      Account : 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
      Amount : {
        currency : 'LTC',
        issuer : 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
        value : '9.985'
      },
      Destination : 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
      Fee : '15',
      Flags : 0,
      Paths : [
        [
          {
        account : 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',
        currency : 'USD',
        issuer : 'rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q',
        type : 49,
        type_hex : '0000000000000031'
      },
      {
        currency : 'LTC',
        issuer : 'rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX',
        type : 48,
        type_hex : '0000000000000030'
      },
      {
        account : 'rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX',
        currency : 'LTC',
        issuer : 'rfYv1TXnwgDDK4WQNbFALykYuEBnrR4pDX',
        type : 49,
        type_hex : '0000000000000031'
      }
      ]
      ],
      SendMax : {
        currency : 'USD',
        issuer : 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
        value : '30.30993068'
      },
      Sequence : 415,
      SigningPubKey : '02854B06CE8F3E65323F89260E9E19B33DA3E01B30EA4CA172612DE77973FAC58A',
      TransactionType : 'Payment',
      TxnSignature : '304602210096C2F385530587DE573936CA51CB86B801A28F777C944E268212BE7341440B7F022100EBF0508A9145A56CDA7FAF314DF3BBE51C6EE450BA7E74D88516891A3608644E'
    };

    var expected_hex = '1200002200000000240000019F61D4A3794DFA1510000000000000000000000000004C54430000000000EF7ED76B77750D79EC92A59389952E0E8054407668400000000000000F69D4CAC4AC112283000000000000000000000000005553440000000000EF7ED76B77750D79EC92A59389952E0E80544076732102854B06CE8F3E65323F89260E9E19B33DA3E01B30EA4CA172612DE77973FAC58A7448304602210096C2F385530587DE573936CA51CB86B801A28F777C944E268212BE7341440B7F022100EBF0508A9145A56CDA7FAF314DF3BBE51C6EE450BA7E74D88516891A3608644E8114EF7ED76B77750D79EC92A59389952E0E805440768314EF7ED76B77750D79EC92A59389952E0E80544076011231DD39C650A96EDA48334E70CC4A85B8B2E8502CD30000000000000000000000005553440000000000DD39C650A96EDA48334E70CC4A85B8B2E8502CD3300000000000000000000000004C5443000000000047DA9E2E00ECF224A52329793F1BB20FB1B5EA643147DA9E2E00ECF224A52329793F1BB20FB1B5EA640000000000000000000000004C5443000000000047DA9E2E00ECF224A52329793F1BB20FB1B5EA6400';

    var transaction = Transaction.from_json(input_json);

    assert.deepEqual(transaction.serialize().to_hex(), expected_hex);
  });

  it('Sign transaction', function(done) {
    var transaction = new Transaction();
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoij';
    transaction.tx_json.SigningPubKey = '021FED5FD081CE5C4356431267D04C6E2167E4112C897D5E10335D4E22B4DA49ED';
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';
    transaction.tx_json.Flags = 0;
    transaction.tx_json.Fee = 10;
    transaction.tx_json.Sequence = 1;
    transaction.tx_json.TransactionType = 'AccountSet';

    transaction.sign();

    var signature = transaction.tx_json.TxnSignature;

    assert.strictEqual(transaction.previousSigningHash, 'D1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE');
    assert(/^[A-Z0-9]+$/.test(signature));

    // Unchanged transaction, signature should be the same
    transaction.sign();

    assert.strictEqual(transaction.previousSigningHash, 'D1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE');
    assert(/^[A-Z0-9]+$/.test(signature));
    assert.strictEqual(transaction.tx_json.TxnSignature, signature);

    done();
  });

  it('Sign transaction - with callback', function(done) {
    var transaction = new Transaction();
    transaction._secret = 'sh2pTicynUEG46jjR4EoexHcQEoij';
    transaction.tx_json.SigningPubKey = '021FED5FD081CE5C4356431267D04C6E2167E4112C897D5E10335D4E22B4DA49ED';
    transaction.tx_json.Account = 'rMWwx3Ma16HnqSd4H6saPisihX9aKpXxHJ';
    transaction.tx_json.Flags = 0;
    transaction.tx_json.Fee = 10;
    transaction.tx_json.Sequence = 1;
    transaction.tx_json.TransactionType = 'AccountSet';

    transaction.sign(function() {
      var signature = transaction.tx_json.TxnSignature;
      assert.strictEqual(transaction.previousSigningHash, 'D1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE');
      assert(/^[A-Z0-9]+$/.test(signature));
      done();
    });
  });

  it('Add transaction ID', function(done) {
    var transaction = new Transaction();
    var saved = 0;

    transaction.on('save', function() {
      ++saved;
    });

    transaction.once('save', function() {
      setImmediate(function() {
        assert.strictEqual(saved, 2);
        assert.deepEqual(
          transaction.submittedIDs,
          [ 'F1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE',
            'D1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE' ]
        );
        done();
      });
    });

    transaction.addId('D1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE');
    transaction.addId('F1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE');
    transaction.addId('F1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE');
  });

  it('Find transaction IDs in cache', function(done) {
    var transaction = new Transaction();

    assert.deepEqual(transaction.findId({
      F1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE: transaction
    }), void(0));

    transaction.addId('F1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE');

    assert.deepEqual(transaction.findId({
      F1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE: transaction
    }), transaction);

    assert.strictEqual(transaction.findId({
      Z1C15200CF532175F1890B6440AD223D3676140522BC11D2784E56760AE3B4FE: transaction
    }), void(0));

    done();
  });

  it('Set build_path', function() {
    var transaction = new Transaction();
    transaction.buildPath(true);
    assert.strictEqual(transaction._build_path, true);
  });

  it('Set DestinationTag', function() {
    var transaction = new Transaction();
    transaction.destinationTag();
    transaction.destinationTag('tag');
    assert.strictEqual(transaction.tx_json.DestinationTag, 'tag');
  });

  it('Set InvoiceID', function() {
    var transaction = new Transaction();

    transaction.invoiceID(1);
    assert.strictEqual(transaction.tx_json.InvoiceID, void(0));

    transaction.invoiceID('DEADBEEF');
    assert.strictEqual(transaction.tx_json.InvoiceID, 'DEADBEEF00000000000000000000000000000000000000000000000000000000');

    transaction.invoiceID('FEADBEEF00000000000000000000000000000000000000000000000000000000');
    assert.strictEqual(transaction.tx_json.InvoiceID, 'FEADBEEF00000000000000000000000000000000000000000000000000000000');
  });

  it('Set ClientID', function() {
    var transaction = new Transaction();

    transaction.clientID(1);
    assert.strictEqual(transaction._clientID, void(0));

    transaction.clientID('DEADBEEF');
    assert.strictEqual(transaction._clientID, 'DEADBEEF');
  });

  it('Set LastLedgerSequence', function() {
    var transaction = new Transaction();

    transaction.lastLedger('a');
    assert.strictEqual(transaction.tx_json.LastLedgerSequence, void(0));
    assert(!transaction._setLastLedger);

    transaction.lastLedger(NaN);
    assert.strictEqual(transaction.tx_json.LastLedgerSequence, void(0));
    assert(!transaction._setLastLedger);

    transaction.lastLedger(12);
    assert.strictEqual(transaction.tx_json.LastLedgerSequence, 12);
    assert(transaction._setLastLedger);
  });

  it('Set Max Fee', function() {
    var transaction = new Transaction();

    transaction.maxFee('a');
    assert(!transaction._setMaxFee);

    transaction.maxFee(NaN);
    assert(!transaction._setMaxFee);

    transaction.maxFee(1000);
    assert.strictEqual(transaction._maxFee, 1000);
    assert.strictEqual(transaction._setMaxFee, true);
  });

  it('Rewrite transaction path', function() {
    var transaction = new Transaction();

    var path = [
      {
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        extraneous_property: 1,
        currency: 'USD'
      },
      {
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        type_hex: '0000000000000001'
      },
      {
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        test: 'XRP',
        currency: 'USD'
      }
    ];

    assert.deepEqual(Transaction._pathRewrite(path), [
      {
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        currency: 'USD'
      },
      {
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        type_hex: '0000000000000001'
      },
      {
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        currency: 'USD'
      }
    ]);
  });

  it('Rewrite transaction path - invalid path', function() {
    assert.strictEqual(Transaction._pathRewrite(1), void(0));
  });

  it('Add transaction path', function() {
    var transaction = new Transaction();

    transaction.pathAdd(1);

    assert.strictEqual(transaction.tx_json.Paths, void(0));

    var path = [
      {
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        extraneous_property: 1,
        currency: 'USD'
      }
    ];

    var path2 = [
      {
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        test: 'XRP',
        currency: 'USD'
      }
    ];

    transaction.pathAdd(path);

    assert.deepEqual(transaction.tx_json.Paths, [
      [{
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        currency: 'USD'
      }]
    ]);

    transaction.pathAdd(path2);

    assert.deepEqual(transaction.tx_json.Paths, [
      [{
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        currency: 'USD'
      }],
      [{
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        currency: 'USD'
      }]
    ]);
  });

  it('Add transaction paths', function() {
    var transaction = new Transaction();

    transaction.paths(1);

    assert.strictEqual(transaction.tx_json.Paths, void(0));

    transaction.paths([
      [{
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        test: 1,
        currency: 'USD'
      }],
      [{
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        test: 2,
        currency: 'USD'
      }]
    ]);

    assert.deepEqual(transaction.tx_json.Paths, [
      [{
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        currency: 'USD'
      }],
      [{
        account: 'rP51ycDJw5ZhgvdKiRjBYZKYjsyoCcHmnY',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        currency: 'USD'
      }]
    ]);
  });

  it('Set secret', function() {
    var transaction = new Transaction();
    transaction.secret('shHXjwp9m3MDQNcUrTekXcdzFsCjM');
    assert.strictEqual(transaction._secret, 'shHXjwp9m3MDQNcUrTekXcdzFsCjM');
  });

  it('Set SendMax', function() {
    var transaction = new Transaction();
    transaction.sendMax('1/USD/rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm');
    assert.deepEqual(transaction.tx_json.SendMax, {
      value: '1',
      currency: 'USD',
      issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm'
    });
  });

  it('Set SourceTag', function() {
    var transaction = new Transaction();
    transaction.sourceTag('tag');
    assert.strictEqual(transaction.tx_json.SourceTag, 'tag');
  });

  it('Set TransferRate', function() {
    var transaction = new Transaction();

    assert.throws(function() {
      transaction.transferRate(1);
    });

    assert.throws(function() {
      transaction.transferRate('1');
    });

    transaction.transferRate(1.5 * 1e9);

    assert.strictEqual(transaction.tx_json.TransferRate, 1.5 * 1e9);
  });

  it('Set Flags', function(done) {
    var transaction = new Transaction();
    transaction.tx_json.TransactionType = 'Payment';

    transaction.setFlags();

    assert.strictEqual(transaction.tx_json.Flags, 0);

    transaction.setFlags(1);

    assert.strictEqual(transaction.tx_json.Flags, 1);

    transaction.setFlags('PartialPayment');

    assert.strictEqual(transaction.tx_json.Flags, 131073);

    transaction.setFlags([ 'LimitQuality', 'PartialPayment' ]);

    assert.strictEqual(transaction.tx_json.Flags, 524289);

    transaction.once('error', function(err) {
      assert.strictEqual(err.result, 'tejInvalidFlag');
      done();
    });

    transaction.setFlags('test');
  });

  it('Add Memo', function() {
    var transaction = new Transaction();
    transaction.tx_json.TransactionType = 'Payment';

    transaction.addMemo('testkey', 'testvalue');
    transaction.addMemo('testkey2', 'testvalue2');
    transaction.addMemo('testkey3');
    transaction.addMemo(void(0), 'testvalue4');

    var expected = [
      { Memo: {
        MemoType: new Buffer('testkey').toString('hex'),
        MemoData: new Buffer('testvalue').toString('hex')
      }},
      { Memo: {
        MemoType: new Buffer('testkey2').toString('hex'),
        MemoData: new Buffer('testvalue2').toString('hex')
      }},
      { Memo: {
        MemoType: new Buffer('testkey3').toString('hex')
      }},
      { Memo: {
        MemoData: new Buffer('testvalue4').toString('hex')
      } }
    ];

    assert.deepEqual(transaction.tx_json.Memos, expected);
  });

  it('Add Memo - invalid MemoType', function() {
    var transaction = new Transaction();
    transaction.tx_json.TransactionType = 'Payment';

    assert.throws(function() {
      transaction.addMemo(1);
    }, /^Error: MemoType must be a string$/);
  });

  it('Add Memo - invalid MemoData', function() {
    var transaction = new Transaction();
    transaction.tx_json.TransactionType = 'Payment';

    assert.throws(function() {
      transaction.addMemo('key', 1);
    }, /^Error: MemoData must be a string$/);
  });

  it('Construct AccountSet transaction', function() {
    var transaction = new Transaction().accountSet('rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm');

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'AccountSet',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm'
    });
  });

  it('Construct AccountSet transaction - with setFlag, clearFlag', function() {
    var transaction = new Transaction().accountSet('rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm', 'asfRequireDest', 'asfRequireAuth');

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      SetFlag: 1,
      ClearFlag: 2,
      TransactionType: 'AccountSet',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm'
    });
  });

  it('Construct AccountSet transaction - params object', function() {
    var transaction = new Transaction().accountSet({
      account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      set: 'asfRequireDest',
      clear: 'asfRequireAuth'
    });

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      SetFlag: 1,
      ClearFlag: 2,
      TransactionType: 'AccountSet',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm'
    });
  });

  it('Construct AccountSet transaction - invalid account', function() {
    assert.throws(function() {
      var transaction = new Transaction().accountSet('xrsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm');
    });
  });

  it('Construct OfferCancel transaction', function() {
    var transaction = new Transaction().offerCancel('rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm', 1);

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'OfferCancel',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      OfferSequence: 1
    });
  });

  it('Construct OfferCancel transaction - params object', function() {
    var transaction = new Transaction().offerCancel({
      account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      sequence: 1
    });

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'OfferCancel',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      OfferSequence: 1
    });
  });

  it('Construct OfferCancel transaction - invalid account', function() {
    assert.throws(function() {
      var transaction = new Transaction().offerCancel('xrsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm', 1);
    });
  });

  it('Construct OfferCreate transaction', function() {
    var bid = '1/USD/rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm';
    var ask = '1/EUR/rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm';

    var transaction = new Transaction().offerCreate('rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm', bid, ask);

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'OfferCreate',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      TakerPays: {
        value: '1',
        currency: 'USD',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm'
      },
      TakerGets: {
        value: '1',
        currency: 'EUR',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm'
      }
    });
  });

  it('Construct OfferCreate transaction - with expiration, cancelSequence', function() {
    var bid = '1/USD/rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm';
    var ask = '1/EUR/rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm';
    var expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);

    var rippleExpiration = Math.round(expiration.getTime() / 1000) - 0x386D4380;

    var transaction = new Transaction().offerCreate('rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm', bid, ask, expiration, 1);

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'OfferCreate',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      TakerPays: {
        value: '1',
        currency: 'USD',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm'
      },
      TakerGets: {
        value: '1',
        currency: 'EUR',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm'
      },
      Expiration: rippleExpiration,
      OfferSequence: 1
    });
  });

  it('Construct OfferCreate transaction - params object', function() {
    var bid = '1/USD/rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm';
    var ask = '1/EUR/rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm';
    var expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);

    var rippleExpiration = Math.round(expiration.getTime() / 1000) - 0x386D4380;

    var transaction = new Transaction().offerCreate({
      account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      taker_gets: ask,
      taker_pays: bid,
      expiration: expiration,
      cancel_sequence: 1
    });

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'OfferCreate',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      TakerPays: {
        value: '1',
        currency: 'USD',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm'
      },
      TakerGets: {
        value: '1',
        currency: 'EUR',
        issuer: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm'
      },
      Expiration: rippleExpiration,
      OfferSequence: 1
    });
  });

  it('Construct OfferCreate transaction - invalid account', function() {
    var bid = '1/USD/rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm';
    var ask = '1/EUR/rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm';
    assert.throws(function() {
      var transaction = new Transaction().offerCreate('xrsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm', bid, ask);
    });
  });

  it('Construct SetRegularKey transaction', function() {
    var transaction = new Transaction().setRegularKey('rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm', 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe');

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'SetRegularKey',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      RegularKey: 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe'
    });
  });

  it('Construct SetRegularKey transaction - params object', function() {
    var transaction = new Transaction().setRegularKey({
      account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      regular_key: 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe'
    });

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'SetRegularKey',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      RegularKey: 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe'
    });
  });

  it('Construct SetRegularKey transaction - invalid account', function() {
    assert.throws(function() {
      var transaction = new Transaction().setRegularKey('xrsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm', 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe');
    });
  });

  it('Construct SetRegularKey transaction - invalid regularKey', function() {
    assert.throws(function() {
      var transaction = new Transaction().setRegularKey('rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm', 'xr36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe');
    });
  });

  it('Construct Payment transaction', function() {
    var transaction = new Transaction().payment(
      'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe',
      '1'
    );

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'Payment',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      Destination: 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe',
      Amount: '1'
    });
  });

  it('Construct Payment transaction - complex amount', function() {
    var transaction = new Transaction().payment(
      'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe',
      '1/USD/r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe'
    );

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'Payment',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      Destination: 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe',
      Amount: {
        value: '1',
        currency: 'USD',
        issuer: 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe'
      }
    });
  });

  it('Construct Payment transaction - params object', function() {
    var transaction = new Transaction().payment({
      account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      destination: 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe',
      amount: '1/USD/r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe'
    });

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'Payment',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      Destination: 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe',
      Amount: {
        value: '1',
        currency: 'USD',
        issuer: 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe'
      }
    });
  });

  it('Construct Payment transaction - invalid account', function() {
    assert.throws(function() {
      var transaction = new Transaction().payment(
        'xrsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe',
        '1/USD/r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe'
      );
    });
  });

  it('Construct Payment transaction - invalid destination', function() {
    assert.throws(function() {
      var transaction = new Transaction().payment(
        'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
        'xr36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe',
        '1/USD/r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe'
      );
    });
  });

  it('Construct TrustSet transaction', function() {
    var limit = '1/USD/r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe';
    var transaction = new Transaction().trustSet('rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm', limit);
    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'TrustSet',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      LimitAmount: {
        value: '1',
        currency: 'USD',
        issuer: 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe'
      }
    });
  });

  it('Construct TrustSet transaction - with qualityIn, qualityOut', function() {
    var limit = '1/USD/r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe';
    var transaction = new Transaction().trustSet('rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm', limit, 1.0, 1.0);
    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'TrustSet',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      LimitAmount: {
        value: '1',
        currency: 'USD',
        issuer: 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe'
      },
      QualityIn: 1.0,
      QualityOut: 1.0
    });
  });

  it('Construct TrustSet transaction - params object', function() {
    var limit = '1/USD/r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe';
    var transaction = new Transaction().trustSet({
      account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      limit: limit,
      quality_in: 1.0,
      quality_out: 1.0
    });

    assert(transaction instanceof Transaction);
    assert.deepEqual(transaction.tx_json, {
      Flags: 0,
      TransactionType: 'TrustSet',
      Account: 'rsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm',
      LimitAmount: {
        value: '1',
        currency: 'USD',
        issuer: 'r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe'
      },
      QualityIn: 1.0,
      QualityOut: 1.0
    });
  });

  it('Construct TrustSet transaction - invalid account', function() {
    assert.throws(function() {
      var limit = '1/USD/r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe';
      var transaction = new Transaction().trustSet('xrsLEU1TPdCJPPysqhWYw9jD97xtG5WqSJm', limit, 1.0, 1.0);
    });
  });

  it('Submit transaction', function(done) {
    var remote = new Remote();
    var transaction = new Transaction(remote).accountSet('r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe');

    assert.strictEqual(transaction.callback, void(0));
    assert.strictEqual(transaction._errorHandler, void(0));
    assert.strictEqual(transaction._successHandler, void(0));
    assert.strictEqual(transaction.listeners('error').length, 1);

    var account = remote.addAccount('r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe');

    account._transactionManager._nextSequence = 1;

    account._transactionManager._request = function(tx) {
      tx.emit('success', { });
    };

    transaction.complete = function() {
      return this;
    };

    var receivedSuccess = false;

    transaction.once('success', function() {
      receivedSuccess = true;
    });

    function submitCallback(err, res) {
      setImmediate(function() {
        assert.ifError(err);
        assert(receivedSuccess);
        done();
      });
    };

    transaction.submit(submitCallback);

    assert(transaction instanceof Transaction);
    assert.strictEqual(transaction.callback, submitCallback);
    assert.strictEqual(typeof transaction._errorHandler, 'function');
    assert.strictEqual(typeof transaction._successHandler, 'function');
  });

  it('Submit transaction - submission error', function(done) {
    var remote = new Remote();

    var transaction = new Transaction(remote).accountSet('r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe');

    var account = remote.addAccount('r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe');

    account._transactionManager._nextSequence = 1;

    account._transactionManager._request = function(tx) {
      tx.emit('error', new Error('Test error'));
    };

    transaction.complete = function() {
      return this;
    };

    var receivedError = false;

    transaction.once('error', function() {
      receivedError = true;
    });

    function submitCallback(err, res) {
      setImmediate(function() {
        assert(err);
        assert.strictEqual(err.constructor.name, 'RippleError');
        assert(receivedError);
        done();
      });
    };

    transaction.submit(submitCallback);
  });

  it('Submit transaction - submission error, no remote', function(done) {
    var transaction = new Transaction();

    transaction.once('error', function(error) {
      assert(error);
      assert.strictEqual(error.message, 'No remote found');
      done();
    });

    transaction.submit();
  });

  it('Submit transaction - invalid account', function(done) {
    var remote = new Remote();
    var transaction = new Transaction(remote).accountSet('r36xtKNKR43SeXnGn7kN4r4JdQzcrkqpWe');

    transaction.tx_json.Account += 'z';

    transaction.once('error', function(err) {
      assert.strictEqual(err.result, 'tejInvalidAccount');
      done();
    });

    transaction.submit();
  });

  it('Abort submission on presubmit', function(done) {
    var remote = new Remote();
    remote.setSecret('rJaT8TafQfYJqDm8aC5n3Yx5yWEL2Ery79', 'snPwFATthTkKnGjEW73q3TL4yci1Q');

    var server = new Server(remote, 'wss://s1.ripple.com:443');
    server._computeFee = function() { return '12'; };
    server._connected = true;

    remote._servers.push(server);
    remote._connected = true;
    remote._ledger_current_index = 1;

    var transaction = new Transaction(remote).accountSet('rJaT8TafQfYJqDm8aC5n3Yx5yWEL2Ery79');
    var account = remote.account('rJaT8TafQfYJqDm8aC5n3Yx5yWEL2Ery79');

    account._transactionManager._nextSequence = 1;

    transaction.once('presubmit', function() {
      transaction.abort();
    });

    transaction.submit(function(err, res) {
      setImmediate(function() {
        assert(err);
        assert.strictEqual(err.result, 'tejAbort');
        done();
      });
    });
  });
});

// vim:sw=2:sts=2:ts=8:et
