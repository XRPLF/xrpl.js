var utils            = require('./testutils');
var assert           = require('assert');
var SerializedObject = utils.load_module('serializedobject').SerializedObject;

describe('Serialized object', function() {
  describe('#from_json(v).to_json() == v', function(){
    it('outputs same as passed to from_json', function() {
      var input_json = {
        Account: 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
        Amount: '274579388',
        Destination: 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
        Fee: '15',
        Flags: 0,
        Paths: [[
          {
            account:   'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV',
            currency:  'USD',
            issuer:    'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV'
          },
          {
            currency: 'XRP'
          }
        ]],
        SendMax: {
          currency:  'USD',
          issuer:    'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
          value:     '2.74579388'
        },
        Sequence: 351,
        SigningPubKey: '02854B06CE8F3E65323F89260E9E19B33DA3E01B30EA4CA172612DE77973FAC58A',
        TransactionType: 'Payment',
        TxnSignature: '30450221009DA3A42DD25E3B22EC45AD8BA8FC7A954264264A816D300B2DF69F814D7D4DD2022072C9627F97EEC6DA13DE841E06E2CD985EF06A0FBB15DDBF0800D0730C8986BF'
      };
      var output_json = SerializedObject.from_json(input_json).to_json();
      assert.deepEqual(input_json, output_json);
    });
  });

  describe('#from_json', function() {
    it('understands TransactionType as a Number', function() {
      var input_json = {
        // no non required fields
        Account: 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
        Amount: '274579388',
        Destination: 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
        Fee: '15',
        Sequence: 351,
        SigningPubKey: '02',// VL field ;)
        TransactionType: 0 //
      };
      var output_json = SerializedObject.from_json(input_json).to_json();

      assert.equal(0, input_json.TransactionType);
      assert.equal("Payment", output_json.TransactionType);
    });

    it('understands LedgerEntryType as a Number', function() {
      var input_json = {
        // no, non required fields
        "LedgerEntryType": 100,
        "Flags": 0,
        "Indexes": [],
        "RootIndex": "000360186E008422E06B72D5B275E29EE3BE9D87A370F424E0E7BF613C465909"
      }

      var output_json = SerializedObject.from_json(input_json).to_json();
      assert.equal(100, input_json.LedgerEntryType);
      assert.equal("DirectoryNode", output_json.LedgerEntryType);
    });

    describe('Format validation', function() {
      // Peercover actually had a problem submitting transactions without a `Fee`
      // and rippled was only informing of "transaction is invalid"
      it('should throw an Error when there is a missing field', function() {
        var input_json = {
          Account: 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
          Amount: '274579388',
          Destination: 'r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS',
          Sequence: 351,
          SigningPubKey: '02854B06CE8F3E65323F89260E9E19B33DA3E01B30EA4CA172612DE77973FAC58A',
          TransactionType: 'Payment',
          TxnSignature: '30450221009DA3A42DD25E3B22EC45AD8BA8FC7A954264264A816D300B2DF69F814D7D4DD2022072C9627F97EEC6DA13DE841E06E2CD985EF06A0FBB15DDBF0800D0730C8986BF'
        };
        assert.throws (
          function() {
            SerializedObject.from_json(input_json);
          },
          /Payment is missing fields: \["Fee"\]/
        );
      });
    });

    describe('Memos', function() {

      var input_json;

      beforeEach(function()  {
        input_json = {
          "Flags": 2147483648,
          "TransactionType": "Payment",
          "Account": "rhXzSyt1q9J8uiFXpK3qSugAAPJKXLtnrF",
          "Amount": "1",
          "Destination": "radqi6ppXFxVhJdjzaATRBxdrPcVTf1Ung",
          "Sequence": 281,
          "SigningPubKey": "03D642E6457B8AB4D140E2C66EB4C484FAFB1BF267CB578EC4815FE6CD06379C51",
          "Fee": "12000",
          "LastLedgerSequence": 10074214,
          "TxnSignature": "304402201180636F2CE215CE97A29CD302618FAE60D63EBFC8903DE17A356E857A449C430220290F4A54F9DE4AC79034C8BEA5F1F8757F7505F1A6FF04D2E19B6D62E867256B"
        };
      });

      it('should serialize and parse - full memo, all strings text/plain ', function() {
        input_json.Memos = [
          {
            "Memo": {
              "MemoType": "test",
              "MemoFormat": "text",
              "MemoData": "some data"
            }
          }
        ];

        var so = SerializedObject.from_json(input_json).to_json();
        input_json.Memos[0].Memo.parsed_memo_type = 'test';
        input_json.Memos[0].Memo.parsed_memo_format = 'text';
        input_json.Memos[0].Memo.parsed_memo_data = 'some data';

        assert.deepEqual(so, input_json);
      });

      it('should serialize and parse - full memo, all strings, invalid MemoFormat', function() {
        input_json.Memos = [
          {
            "Memo": {
              "MemoType": "test",
              "MemoFormat": "application/json",
              "MemoData": "some data"
            }
          }
        ];

        var so = SerializedObject.from_json(input_json).to_json();
        input_json.Memos[0].Memo.parsed_memo_type = 'test';
        input_json.Memos[0].Memo.parsed_memo_format = 'application/json';
        assert.deepEqual(so, input_json);
        assert.strictEqual(input_json.Memos[0].Memo.parsed_memo_data, void(0));
      });

      it('should throw an error - full memo, json data, invalid MemoFormat', function() {
        input_json.Memos = [
          {
            "Memo": {
              "MemoType": "test",
              "MemoFormat": "text",
              "MemoData": {
                "string" : "some_string",
                "boolean" : true
              }
            }
          }
        ];

        assert.throws(function() {
          SerializedObject.from_json(input_json);
        }, /^Error: MemoData can only be a JSON object with a valid json MemoFormat \(Memo\) \(Memos\)/);
      });

      it('should serialize and parse - full memo, json data, valid MemoFormat', function() {
        input_json.Memos = [
          {
            "Memo": {
              "MemoType": "test",
              "MemoFormat": "json",
              "ignored" : "ignored",
              "MemoData": {
                "string" : "some_string",
                "boolean" : true
              }
            }
          }
        ];

        var so = SerializedObject.from_json(input_json).to_json();
        delete input_json.Memos[0].Memo.ignored;
        input_json.Memos[0].Memo.parsed_memo_type = 'test';
        input_json.Memos[0].Memo.parsed_memo_format = 'json';
        input_json.Memos[0].Memo.parsed_memo_data = {
          "string" : "some_string",
          "boolean" : true
        };

        assert.deepEqual(so, input_json);
      });

      it('should serialize and parse - full memo, json data, valid MemoFormat', function() {
        input_json.Memos = [
          {
            "Memo": {
              "MemoType": "test",
              "MemoFormat": "json",
              "MemoData": {
                "string" : "some_string",
                "boolean" : true
              }
            }
          }
        ];

        var so = SerializedObject.from_json(input_json).to_json();
        input_json.Memos[0].Memo.parsed_memo_type = 'test';
        input_json.Memos[0].Memo.parsed_memo_format = 'json';
        input_json.Memos[0].Memo.parsed_memo_data = {
          "string" : "some_string",
          "boolean" : true
        };

        assert.deepEqual(so, input_json);
      });

      it('should serialize and parse - full memo, json data, valid MemoFormat', function() {
        input_json.Memos = [
          {
            "Memo": {
              "MemoType": "test",
              "MemoFormat": "json",
              "MemoData": 3
            }
          }
        ];

        var so = SerializedObject.from_json(input_json).to_json();
        input_json.Memos[0].Memo.parsed_memo_type = 'test';
        input_json.Memos[0].Memo.parsed_memo_format = 'json';
        input_json.Memos[0].Memo.parsed_memo_data = 3;
        assert.deepEqual(so, input_json);
      });

      it('should serialize and parse - full memo, json data, valid MemoFormat', function() {
        input_json.Memos = [
          {
            "Memo": {
              "MemoType": "test",
              "MemoFormat": "json",
              "MemoData": 3
            }
          }
        ];

        var so = SerializedObject.from_json(input_json).to_json();
        input_json.Memos[0].Memo.parsed_memo_type = 'test';
        input_json.Memos[0].Memo.parsed_memo_format = 'json';
        input_json.Memos[0].Memo.parsed_memo_data = 3;
        assert.deepEqual(so, input_json);
      });

      it('should throw an error - invalid Memo field', function() {
        input_json.Memos = [
          {
            "Memo": {
              "MemoType": "test",
              "MemoParty": "json",
              "MemoData": 3
            }
          }
        ];

        assert.throws(function() {
          SerializedObject.from_json(input_json);
        }, /^Error: JSON contains unknown field: "MemoParty" \(Memo\) \(Memos\)/);
      });


    });

  });


});


// vim:sw=2:sts=2:ts=8:et
