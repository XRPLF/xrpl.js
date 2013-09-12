var utils            = require('./testutils');
var assert           = require('assert');
var SerializedObject = utils.load_module('serializedobject').SerializedObject;
var types            = utils.load_module('serializedtypes');
var jsbn             = utils.load_module('jsbn');
var BigInteger       = jsbn.BigInteger;

var config = require('./testutils').get_config();

describe('Serialized types', function() {
  describe('Int8', function() {
    it('Serialize 0', function () {
      var so = new SerializedObject();
      types.Int8.serialize(so, 0);
      assert.strictEqual(so.to_hex(), '00');
    });
    it('Serialize 123', function () {
      var so = new SerializedObject();
      types.Int8.serialize(so, 123);
      assert.strictEqual(so.to_hex(), '7B');
    });
    it('Serialize 255', function () {
      var so = new SerializedObject();
      types.Int8.serialize(so, 255);
      assert.strictEqual(so.to_hex(), 'FF');
    });
    it('Fail to serialize 256', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int8.serialize(so, 256);
      });
    });
    it('Fail to serialize -1', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int8.serialize(so, -1);
      });
    });
    it('Serialize 5.5 (should floor)', function () {
      var so = new SerializedObject();
      types.Int8.serialize(so, 5.5);
      assert.strictEqual(so.to_hex(), '05');
    });
    it('Serialize 255.9 (should floor)', function () {
      var so = new SerializedObject();
      types.Int8.serialize(so, 255.9);
      assert.strictEqual(so.to_hex(), 'FF');
    });
    it('Fail to serialize null', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int8.serialize(so, null);
      });
    });
    it('Fail to serialize "bla"', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int8.serialize(so, 'bla');
      });
    });
    it('Fail to serialize {}', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int8.serialize(so, {});
      });
    });
  });

  describe('Int16', function() {
    it('Serialize 0', function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 0);
      assert.strictEqual(so.to_hex(), '0000');
    });
    it('Serialize 123', function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 123);
      assert.strictEqual(so.to_hex(), '007B');
    });
    it('Serialize 255', function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 255);
      assert.strictEqual(so.to_hex(), '00FF');
    });
    it('Serialize 256', function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 256);
      assert.strictEqual(so.to_hex(), '0100');
    });
    it('Serialize 65535', function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 65535);
      assert.strictEqual(so.to_hex(), 'FFFF');
    });
    it('Fail to serialize 65536', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int8.serialize(so, 65536);
      });
    });
    it('Fail to serialize -1', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int16.serialize(so, -1);
      });
    });
    it('Serialize 123.5 (should floor)', function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 123.5);
      assert.strictEqual(so.to_hex(), '007B');
    });
    it('Serialize 65535.5 (should floor)', function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 65535.5);
      assert.strictEqual(so.to_hex(), 'FFFF');
    });
    it('Fail to serialize null', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int16.serialize(so, null);
      });
    });
    it('Fail to serialize "bla"', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int16.serialize(so, 'bla');
      });
    });
    it('Fail to serialize {}', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int16.serialize(so, {});
      });
    });
  });

  describe('Int32', function() {
    it('Serialize 0', function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 0);
      assert.strictEqual(so.to_hex(), '00000000');
    });
    it('Serialize 123', function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 123);
      assert.strictEqual(so.to_hex(), '0000007B');
    });
    it('Serialize 255', function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 255);
      assert.strictEqual(so.to_hex(), '000000FF');
    });
    it('Serialize 256', function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 256);
      assert.strictEqual(so.to_hex(), '00000100');
    });
    it('Serialize 0xF0F0F0F0', function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 0xF0F0F0F0);
      assert.strictEqual(so.to_hex(), 'F0F0F0F0');
    });
    it('Serialize 0xFFFFFFFF', function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 0xFFFFFFFF);
      assert.strictEqual(so.to_hex(), 'FFFFFFFF');
    });
    it('Fail to serialize 0x100000000', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int8.serialize(so, 0x100000000);
      });
    });
    it('Fail to serialize -1', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int32.serialize(so, -1);
      });
    });
    it('Serialize 123.5 (should floor)', function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 123.5);
      assert.strictEqual(so.to_hex(), '0000007B');
    });
    it('Serialize 4294967295.5 (should floor)', function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 4294967295.5);
      assert.strictEqual(so.to_hex(), 'FFFFFFFF');
    });
    it('Fail to serialize null', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int32.serialize(so, null);
      });
    });
    it('Fail to serialize "bla"', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int32.serialize(so, 'bla');
      });
    });
    it('Fail to serialize {}', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int32.serialize(so, {});
      });
    });
  });

  describe('Int64', function() {
    it('Serialize 0', function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 0);
      assert.strictEqual(so.to_hex(), '0000000000000000');
    });
    it('Serialize 123', function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 123);
      assert.strictEqual(so.to_hex(), '000000000000007B');
    });
    it('Serialize 255', function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 255);
      assert.strictEqual(so.to_hex(), '00000000000000FF');
    });
    it('Serialize 256', function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 256);
      assert.strictEqual(so.to_hex(), '0000000000000100');
    });
    it('Serialize 0xF0F0F0F0', function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 0xF0F0F0F0);
      assert.strictEqual(so.to_hex(), '00000000F0F0F0F0');
    });
    it('Serialize 0xFFFFFFFF', function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 0xFFFFFFFF);
      assert.strictEqual(so.to_hex(), '00000000FFFFFFFF');
    });
    it('Serialize 0x100000000', function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 0x100000000);
      assert.strictEqual(so.to_hex(), '0000000100000000');
    });
    it('Fail to serialize 0x100000000', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int8.serialize(so, 0x100000000);
      });
    });
    it('Fail to serialize -1', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int64.serialize(so, -1);
      });
    });
    it('Serialize 123.5 (should floor)', function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 123.5);
      assert.strictEqual(so.to_hex(), '000000000000007B');
    });
    it('Serialize 4294967295.5 (should floor)', function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 4294967295.5);
      assert.strictEqual(so.to_hex(), '00000000FFFFFFFF');
    });
    it('Serialize "0123456789ABCDEF"', function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, '0123456789ABCDEF');
      assert.strictEqual(so.to_hex(), '0123456789ABCDEF');
    });
    it('Serialize "F0E1D2C3B4A59687"', function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 'F0E1D2C3B4A59687');
      assert.strictEqual(so.to_hex(), 'F0E1D2C3B4A59687');
    });
    it('Serialize BigInteger("FFEEDDCCBBAA9988")', function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, new BigInteger('FFEEDDCCBBAA9988', 16));
      assert.strictEqual(so.to_hex(), 'FFEEDDCCBBAA9988');
    });
    it('Fail to serialize BigInteger("-1")', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int64.serialize(so, new BigInteger('-1', 10));
      });
    });
    it('Fail to serialize "10000000000000000"', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int64.serialize(so, '10000000000000000');
      });
    });
    it('Fail to serialize "110000000000000000"', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int64.serialize(so, '110000000000000000');
      });
    });
    it('Fail to serialize null', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int64.serialize(so, null);
      });
    });
    it('Fail to serialize "bla"', function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int64.serialize(so, 'bla');
      });
    });
    it('Fail to serialize {}',  function () {
      var so = new SerializedObject();
      assert.throws(function () {
        types.Int64.serialize(so, {});
      });
    });
  });

  describe('Hash128', function() {
    it('Serialize 0', function () {
      var so = new SerializedObject();
      types.Hash128.serialize(so, '00000000000000000000000000000000');
      assert.strictEqual(so.to_hex(), '00000000000000000000000000000000');
    });
    it('Serialize 102030405060708090A0B0C0D0E0F000', function () {
      var so = new SerializedObject();
      types.Hash128.serialize(so, '102030405060708090A0B0C0D0E0F000');
      assert.strictEqual(so.to_hex(), '102030405060708090A0B0C0D0E0F000');
    });
    it('Serialize FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', function () {
      var so = new SerializedObject();
      types.Hash128.serialize(so, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
      assert.strictEqual(so.to_hex(), 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
    });
  });

  describe('Hash160', function() {
    it('Serialize 0', function () {
      var so = new SerializedObject();
      types.Hash160.serialize(so, 'rrrrrrrrrrrrrrrrrrrrrhoLvTp');
      assert.strictEqual(so.to_hex(), '0000000000000000000000000000000000000000');
    });
    it('Serialize 1', function () {
      var so = new SerializedObject();
      types.Hash160.serialize(so, 'rrrrrrrrrrrrrrrrrrrrBZbvji');
      assert.strictEqual(so.to_hex(), '0000000000000000000000000000000000000001');
    });
    it('Serialize FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', function () {
      var so = new SerializedObject();
      types.Hash160.serialize(so, 'rQLbzfJH5BT1FS9apRLKV3G8dWEA5njaQi');
      assert.strictEqual(so.to_hex(), 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
    });
  });

  describe('Amount', function() {
    it('Serialize 0 XRP', function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, '0');
      assert.strictEqual(so.to_hex(), '4000000000000000');
    });
    it('Serialize 1 XRP', function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, '1');
      assert.strictEqual(so.to_hex(), '4000000000000001');
    });
    it('Serialize -1 XRP', function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, '-1');
      assert.strictEqual(so.to_hex(), '0000000000000001');
    });
    it('Serialize 213 XRP', function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, '213');
      assert.strictEqual(so.to_hex(), '40000000000000D5');
    });
    it('Serialize 270544960 XRP', function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, '270544960');
      assert.strictEqual(so.to_hex(), '4000000010203040');
    });
    it('Serialize 1161981756646125568 XRP', function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, '1161981756646125696');
      assert.strictEqual(so.to_hex(), '5020304050607080');
    });
    it('Serialize 1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, '1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
      assert.strictEqual(so.to_hex(), 'D4838D7EA4C680000000000000000000000000005553440000000000B5F762798A53D543A014CAF8B297CFF8F2F937E8');
    });
    it('Serialize 87654321.12345678/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, '87654321.12345678/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
      assert.strictEqual(so.to_hex(), 'D65F241D335BF24E0000000000000000000000004555520000000000B5F762798A53D543A014CAF8B297CFF8F2F937E8');
    });
    it('Serialize -1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, '-1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
      assert.strictEqual(so.to_hex(), '94838D7EA4C680000000000000000000000000005553440000000000B5F762798A53D543A014CAF8B297CFF8F2F937E8');
    });
    it('Parse 1 XRP', function () {
      var so = new SerializedObject('4000000000000001');
      assert.strictEqual(types.Amount.parse(so).to_json(), '1');
    });
    it('Parse -1 XRP', function () {
      var so = new SerializedObject('0000000000000001');
      assert.strictEqual(types.Amount.parse(so).to_json(), '-1');
    });
    it('Parse 213 XRP', function () {
      var so = new SerializedObject('40000000000000D5');
      assert.strictEqual(types.Amount.parse(so).to_json(), '213');
    });
    it('Parse 270544960 XRP', function () {
      var so = new SerializedObject('4000000010203040');
      assert.strictEqual(types.Amount.parse(so).to_json(), '270544960');
    });
    it('Parse 1161981756646125568 XRP', function () {
      var so = new SerializedObject('5020304050607080');
      assert.strictEqual(types.Amount.parse(so).to_json(), '1161981756646125696');
    });
    it('Parse 1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function () {
      var so = new SerializedObject('D4838D7EA4C680000000000000000000000000005553440000000000B5F762798A53D543A014CAF8B297CFF8F2F937E8');
      assert.strictEqual(types.Amount.parse(so).to_text_full(), '1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
    });
    it('Parse 87654321.12345678/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function () {
      var so = new SerializedObject('D65F241D335BF24E0000000000000000000000004555520000000000B5F762798A53D543A014CAF8B297CFF8F2F937E8');
      assert.strictEqual(types.Amount.parse(so).to_text_full(), '87654321.12345678/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
    });
    it('Parse -1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function () {
      var so = new SerializedObject('94838D7EA4C680000000000000000000000000005553440000000000B5F762798A53D543A014CAF8B297CFF8F2F937E8');
      assert.strictEqual(types.Amount.parse(so).to_text_full(), '-1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
    });
  });

  describe('PathSet', function() {
    it('Serialize single empty path [[]]', function () {
      var so = new SerializedObject();
      types.PathSet.serialize(so, [[]]);
      assert.strictEqual(so.to_hex(), '00');
    });
    it('Serialize [[e],[e,e]]', function () {
      var so = new SerializedObject();
      types.PathSet.serialize(so, [[ {
        account:   123,
        currency:  'USD',
        issuer:    789
      }],
      [{
        account:   123,
        currency:  'BTC',
        issuer:    789
      },
      {
        account:   987,
        currency:  'EUR',
        issuer:    321
      }]]);
      assert.strictEqual(so.to_hex(), '31000000000000000000000000000000000000007B00000000000000000000000055534400000000000000000000000000000000000000000000000315FF31000000000000000000000000000000000000007B000000000000000000000000425443000000000000000000000000000000000000000000000003153100000000000000000000000000000000000003DB0000000000000000000000004555520000000000000000000000000000000000000000000000014100'); //TODO: Check this independently
    });
    it('Parse single empty path [[]]', function () {
      var so = new SerializedObject('00');
      var parsed_path = types.PathSet.parse(so)
      assert.deepEqual(parsed_path, [[]]);
    });
    it('Parse [[e],[e,e]]', function () {
      var so = new SerializedObject('31000000000000000000000000000000000000007B00000000000000000000000055534400000000000000000000000000000000000000000000000315FF31000000000000000000000000000000000000007B000000000000000000000000425443000000000000000000000000000000000000000000000003153100000000000000000000000000000000000003DB0000000000000000000000004555520000000000000000000000000000000000000000000000014100');

      var parsed_path = types.PathSet.parse(so);
	  var comp =[ [ { account: 'rrrrrrrrrrrrrrrrrrrrNxV3Xza',
					  currency: 'USD',
					  issuer: 'rrrrrrrrrrrrrrrrrrrpYnYCNYf' } ],
				  [ { account: 'rrrrrrrrrrrrrrrrrrrrNxV3Xza',
					  currency: 'BTC',
					  issuer: 'rrrrrrrrrrrrrrrrrrrpYnYCNYf' },
					{ account: 'rrrrrrrrrrrrrrrrrrrpvQsW3V3',
					  currency: 'EUR',
					  issuer: 'rrrrrrrrrrrrrrrrrrrdHRtqg2' } ] ];  
      assert.deepEqual(SerializedObject.jsonify_structure(parsed_path, ""), comp);
    });
  });

  describe('Object', function() {
    it('Serialize empty object {}', function () {
      var so = new SerializedObject();
      types.Object.serialize(so, {});
      assert.strictEqual(so.to_hex(), 'E1');
    });
    it('Parse empty object {}', function () {
      var so = new SerializedObject('E1');
      var parsed_object = types.Object.parse(so)
      assert.deepEqual(parsed_object, { });
    });
    it('Serialize simple object {TakerPays:"87654321.12345678/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", TakerGets:213, Fee:"789"}', function () {
      var so = new SerializedObject();
      types.Object.serialize(so, {
        TakerPays:  '87654321.12345678/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        TakerGets:  '213',
        Fee:        789
      });
      assert.strictEqual(so.to_hex(), '64D65F241D335BF24E0000000000000000000000004555520000000000B5F762798A53D543A014CAF8B297CFF8F2F937E86540000000000000D5684000000000000315E1');
      //TODO: Check independently.
    });
    it('Parse same object', function () {
      var so = new SerializedObject('64D65F241D335BF24E0000000000000000000000004555520000000000B5F762798A53D543A014CAF8B297CFF8F2F937E86540000000000000D5684000000000000315E1');
      var parsed_object=types.Object.parse(so);
	  var comp =  { TakerPays:
					   { value: '87654321.12345678',
						 currency: 'EUR',
						 issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh' },
					  TakerGets: '213',
					  Fee: '789' };
      assert.deepEqual(SerializedObject.jsonify_structure(parsed_object, ""), comp);
      //TODO: Check independently.
    });

    it('Serialize simple object {DestinationTag:123, QualityIn:456, QualityOut:789}', function () {
      var so = new SerializedObject();
      types.Object.serialize(so, {DestinationTag:123, QualityIn:456, QualityOut:789});
      assert.strictEqual(so.to_hex(), '2E0000007B2014000001C8201500000315E1');
      //TODO: Check independently.
    });
    it('Parse simple object {DestinationTag:123, QualityIn:456, QualityOut:789}', function () { //2E0000007B22000001C82400000315E1 2E0000007B2002000001C8200200000315E1
      var so = new SerializedObject('2E0000007B2014000001C8201500000315E1');
      var parsed_object=types.Object.parse(so);
      assert.deepEqual(parsed_object, { DestinationTag:123, QualityIn:456, QualityOut:789 });
      //TODO: Check independently.
    });
  });

  describe('Array', function() {
    it('Serialize empty array []', function () {
      var so = new SerializedObject();
      types.Array.serialize(so, []);
      assert.strictEqual(so.to_hex(), 'F1');
    });
    it('Parse empty array []', function () {
      var so = new SerializedObject('F1');
      var parsed_object=types.Array.parse(so);
      assert.deepEqual(parsed_object, []);
    });
    it('Serialize 3-length array [{TakerPays:123}); {TakerGets:456}, {Fee:789}]', function () {
      var so = new SerializedObject();
      types.Array.serialize(so, [{TakerPays:123}, {TakerGets:456}, {Fee:789}]);
      //TODO: Check this manually
      assert.strictEqual(so.to_hex(), '64400000000000007B6540000000000001C8684000000000000315F1');
    });
    it('Parse the same array', function () {
      var so = new SerializedObject('64400000000000007B6540000000000001C8684000000000000315F1');
      var parsed_object=types.Array.parse(so);
	  var comp = [ { TakerPays: '123' }, { TakerGets: '456' }, { Fee: '789' } ];
      assert.deepEqual(SerializedObject.jsonify_structure(parsed_object, ""), comp);
    });
    it('Serialize 3-length array [{DestinationTag:123}); {QualityIn:456}, {Fee:789}]', function () {
      var so = new SerializedObject();
      types.Array.serialize(so, [{DestinationTag:123}, {QualityIn:456}, {Fee:789}]);
      //TODO: Check this manually
      assert.strictEqual(so.to_hex(), '2E0000007B2014000001C8684000000000000315F1');
    });
    it('Parse the same array 2', function () {
      var so = new SerializedObject('2E0000007B2014000001C8684000000000000315F1');
      var parsed_object = types.Array.parse(so);
	  var comp = [ { DestinationTag: 123 }, { QualityIn: 456 }, { Fee: '789' } ];
      //TODO: Is this correct? Return some things as integers, and others as objects?
      assert.deepEqual( SerializedObject.jsonify_structure(parsed_object, ""), comp);
    });
  });
});

// vim:sw=2:sts=2:ts=8:et
