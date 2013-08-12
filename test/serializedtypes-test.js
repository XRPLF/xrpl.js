var buster      = require("buster");

var SerializedObject = require("../src/js/ripple/serializedobject").SerializedObject;
var types = require("../src/js/ripple/serializedtypes");

var jsbn    = require('../src/js/ripple/jsbn');
var BigInteger = jsbn.BigInteger;

try {
  var conf = require('./config');
} catch(exception) {
  var conf = require('./config-example');
}

var config = require('../src/js/ripple/config').load(conf);

buster.testCase("Serialized types", { /*
  "Int8" : {
    "Serialize 0" : function () {
      var so = new SerializedObject();
      types.Int8.serialize(so, 0);
      assert.equals(so.to_hex(), "00");
    },
    "Serialize 123" : function () {
      var so = new SerializedObject();
      types.Int8.serialize(so, 123);
      assert.equals(so.to_hex(), "7B");
    },
    "Serialize 255" : function () {
      var so = new SerializedObject();
      types.Int8.serialize(so, 255);
      assert.equals(so.to_hex(), "FF");
    },
    "Fail to serialize 256" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int8.serialize(so, 256);
      });
    },
    "Fail to serialize -1" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int8.serialize(so, -1);
      });
    },
    "Serialize 5.5 (should floor)" : function () {
      var so = new SerializedObject();
      types.Int8.serialize(so, 5.5);
      assert.equals(so.to_hex(), "05");
    },
    "Serialize 255.9 (should floor)" : function () {
      var so = new SerializedObject();
      types.Int8.serialize(so, 255.9);
      assert.equals(so.to_hex(), "FF");
    },
    "Fail to serialize null" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int8.serialize(so, null);
      });
    },
    "Fail to serialize 'bla'" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int8.serialize(so, 'bla');
      });
    },
    "Fail to serialize {}" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int8.serialize(so, {});
      });
    }
  },
  "Int16" : {
    "Serialize 0" : function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 0);
      assert.equals(so.to_hex(), "0000");
    },
    "Serialize 123" : function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 123);
      assert.equals(so.to_hex(), "007B");
    },
    "Serialize 255" : function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 255);
      assert.equals(so.to_hex(), "00FF");
    },
    "Serialize 256" : function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 256);
      assert.equals(so.to_hex(), "0100");
    },
    "Serialize 65535" : function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 65535);
      assert.equals(so.to_hex(), "FFFF");
    },
    "Fail to serialize 65536" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int8.serialize(so, 65536);
      });
    },
    "Fail to serialize -1" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int16.serialize(so, -1);
      });
    },
    "Serialize 123.5 (should floor)" : function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 123.5);
      assert.equals(so.to_hex(), "007B");
    },
    "Serialize 65535.5 (should floor)" : function () {
      var so = new SerializedObject();
      types.Int16.serialize(so, 65535.5);
      assert.equals(so.to_hex(), "FFFF");
    },
    "Fail to serialize null" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int16.serialize(so, null);
      });
    },
    "Fail to serialize 'bla'" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int16.serialize(so, 'bla');
      });
    },
    "Fail to serialize {}" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int16.serialize(so, {});
      });
    }
  },
  "Int32" : {
    "Serialize 0" : function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 0);
      assert.equals(so.to_hex(), "00000000");
    },
    "Serialize 123" : function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 123);
      assert.equals(so.to_hex(), "0000007B");
    },
    "Serialize 255" : function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 255);
      assert.equals(so.to_hex(), "000000FF");
    },
    "Serialize 256" : function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 256);
      assert.equals(so.to_hex(), "00000100");
    },
    "Serialize 0xF0F0F0F0" : function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 0xF0F0F0F0);
      assert.equals(so.to_hex(), "F0F0F0F0");
    },
    "Serialize 0xFFFFFFFF" : function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 0xFFFFFFFF);
      assert.equals(so.to_hex(), "FFFFFFFF");
    },
    "Fail to serialize 0x100000000" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int8.serialize(so, 0x100000000);
      });
    },
    "Fail to serialize -1" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int32.serialize(so, -1);
      });
    },
    "Serialize 123.5 (should floor)" : function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 123.5);
      assert.equals(so.to_hex(), "0000007B");
    },
    "Serialize 4294967295.5 (should floor)" : function () {
      var so = new SerializedObject();
      types.Int32.serialize(so, 4294967295.5);
      assert.equals(so.to_hex(), "FFFFFFFF");
    },
    "Fail to serialize null" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int32.serialize(so, null);
      });
    },
    "Fail to serialize 'bla'" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int32.serialize(so, 'bla');
      });
    },
    "Fail to serialize {}" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int32.serialize(so, {});
      });
    }
  },
  "Int64" : {
    "Serialize 0" : function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 0);
      assert.equals(so.to_hex(), "0000000000000000");
    },
    "Serialize 123" : function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 123);
      assert.equals(so.to_hex(), "000000000000007B");
    },
    "Serialize 255" : function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 255);
      assert.equals(so.to_hex(), "00000000000000FF");
    },
    "Serialize 256" : function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 256);
      assert.equals(so.to_hex(), "0000000000000100");
    },
    "Serialize 0xF0F0F0F0" : function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 0xF0F0F0F0);
      assert.equals(so.to_hex(), "00000000F0F0F0F0");
    },
    "Serialize 0xFFFFFFFF" : function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 0xFFFFFFFF);
      assert.equals(so.to_hex(), "00000000FFFFFFFF");
    },
    "Serialize 0x100000000" : function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 0x100000000);
      assert.equals(so.to_hex(), "0000000100000000");
    },
    "Fail to serialize 0x100000000" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int8.serialize(so, 0x100000000);
      });
    },
    "Fail to serialize -1" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int64.serialize(so, -1);
      });
    },
    "Serialize 123.5 (should floor)" : function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 123.5);
      assert.equals(so.to_hex(), "000000000000007B");
    },
    "Serialize 4294967295.5 (should floor)" : function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, 4294967295.5);
      assert.equals(so.to_hex(), "00000000FFFFFFFF");
    },
    "Serialize '0123456789ABCDEF'" : function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, "0123456789ABCDEF");
      assert.equals(so.to_hex(), "0123456789ABCDEF");
    },
    "Serialize 'F0E1D2C3B4A59687'" : function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, "F0E1D2C3B4A59687");
      assert.equals(so.to_hex(), "F0E1D2C3B4A59687");
    },
    "Serialize BigInteger('FFEEDDCCBBAA9988')" : function () {
      var so = new SerializedObject();
      types.Int64.serialize(so, new BigInteger("FFEEDDCCBBAA9988", 16));
      assert.equals(so.to_hex(), "FFEEDDCCBBAA9988");
    },
    "Fail to serialize BigInteger('-1')" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int64.serialize(so, new BigInteger("-1", 10));
      });
    },
    "Fail to serialize '10000000000000000'" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int64.serialize(so, "10000000000000000");
      });
    },
    "Fail to serialize '110000000000000000'" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int64.serialize(so, "110000000000000000");
      });
    },
    "Fail to serialize null" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int64.serialize(so, null);
      });
    },
    "Fail to serialize 'bla'" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int64.serialize(so, 'bla');
      });
    },
    "Fail to serialize {}" : function () {
      var so = new SerializedObject();
      assert.exception(function () {
        types.Int64.serialize(so, {});
      });
    }
  },
  "Hash128" : {
    "Serialize 0" : function () {
      var so = new SerializedObject();
      types.Hash128.serialize(so, "00000000000000000000000000000000");
      assert.equals(so.to_hex(), "00000000000000000000000000000000");
    },
    "Serialize 102030405060708090A0B0C0D0E0F000" : function () {
      var so = new SerializedObject();
      types.Hash128.serialize(so, "102030405060708090A0B0C0D0E0F000");
      assert.equals(so.to_hex(), "102030405060708090A0B0C0D0E0F000");
    },
    "Serialize FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" : function () {
      var so = new SerializedObject();
      types.Hash128.serialize(so, "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
      assert.equals(so.to_hex(), "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
    },
  },
  "Hash160" : {
    "Serialize 0" : function () {
      var so = new SerializedObject();
      types.Hash160.serialize(so, "rrrrrrrrrrrrrrrrrrrrrhoLvTp");
      assert.equals(so.to_hex(), "0000000000000000000000000000000000000000");
    },
    "Serialize 1" : function () {
      var so = new SerializedObject();
      types.Hash160.serialize(so, "rrrrrrrrrrrrrrrrrrrrBZbvji");
      assert.equals(so.to_hex(), "0000000000000000000000000000000000000001");
    },
    "Serialize FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" : function () {
      var so = new SerializedObject();
      types.Hash160.serialize(so, "rQLbzfJH5BT1FS9apRLKV3G8dWEA5njaQi");
      assert.equals(so.to_hex(), "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
    },
  },
  "Amount" : {
    "Serialize 0 XRP" : function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, "0");
      assert.equals(so.to_hex(), "4000000000000000");
    },
    "Serialize 1 XRP" : function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, "1");
      assert.equals(so.to_hex(), "4000000000000001");
    },
    "Serialize -1 XRP" : function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, "-1");
      assert.equals(so.to_hex(), "0000000000000001");
    },
    "Serialize 213 XRP" : function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, "213");
      assert.equals(so.to_hex(), "40000000000000D5");
    },
    "Serialize 270544960 XRP" : function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, "270544960");
      assert.equals(so.to_hex(), "4000000010203040");
    },
    "Serialize 1161981756646125568 XRP" : function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, "1161981756646125696");
      assert.equals(so.to_hex(), "5020304050607080");
    },
    "Serialize 1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh" : function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, "1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");
      assert.equals(so.to_hex(), "D4838D7EA4C680000000000000000000000000005553440000000000B5F762798A53D543A014CAF8B297CFF8F2F937E8");
    },
    "Serialize 87654321.12345678/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh" : function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, "87654321.12345678/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");
      assert.equals(so.to_hex(), "D65F241D335BF24E0000000000000000000000004555520000000000B5F762798A53D543A014CAF8B297CFF8F2F937E8");
    },
    "Serialize -1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh" : function () {
      var so = new SerializedObject();
      types.Amount.serialize(so, "-1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");
      assert.equals(so.to_hex(), "94838D7EA4C680000000000000000000000000005553440000000000B5F762798A53D543A014CAF8B297CFF8F2F937E8");
    },
    "Parse 1 XRP" : function () {
      var so = new SerializedObject("4000000000000001");
      assert.equals(types.Amount.parse(so).to_json(), "1");
    },
    "Parse -1 XRP" : function () {
      var so = new SerializedObject("0000000000000001");
      assert.equals(types.Amount.parse(so).to_json(), "-1");
    },
    "Parse 213 XRP" : function () {
      var so = new SerializedObject("40000000000000D5");
      assert.equals(types.Amount.parse(so).to_json(), "213");
    },
    "Parse 270544960 XRP" : function () {
      var so = new SerializedObject("4000000010203040");
      assert.equals(types.Amount.parse(so).to_json(), "270544960");
    },
    "Parse 1161981756646125568 XRP" : function () {
      var so = new SerializedObject("5020304050607080");
      assert.equals(types.Amount.parse(so).to_json(), "1161981756646125696");
    },
    "Parse 1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh" : function () {
      var so = new SerializedObject("D4838D7EA4C680000000000000000000000000005553440000000000B5F762798A53D543A014CAF8B297CFF8F2F937E8");
      assert.equals(types.Amount.parse(so).to_text_full(), "1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");
    },
    "Parse 87654321.12345678/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh" : function () {
      var so = new SerializedObject("D65F241D335BF24E0000000000000000000000004555520000000000B5F762798A53D543A014CAF8B297CFF8F2F937E8");
      assert.equals(types.Amount.parse(so).to_text_full(), "87654321.12345678/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");
    },
    "Parse -1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh" : function () {
      var so = new SerializedObject("94838D7EA4C680000000000000000000000000005553440000000000B5F762798A53D543A014CAF8B297CFF8F2F937E8");
      assert.equals(types.Amount.parse(so).to_text_full(), "-1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");
    },
  }
  */
  
  "PathSet" : {
    "Serialize single empty path [[]]" : function () {
      var so = new SerializedObject();
      types.PathSet.serialize(so, [[]]);
      assert.equals(so.to_hex(), "00");
    },
	
	"Serialize [[e],[e,e]]" : function () {
      var so = new SerializedObject();
      //types.PathSet.serialize(so, [[{account:123, currency:"USD", issuer:789}],[{account:123, currency:"BTC", issuer:789},{account:987, currency:"EUR", issuer:321}]]);
      types.PathSet.serialize(so, [[{account:123, currency:"USD", issuer:789}],[{account:123, currency:"BTC", issuer:789},{account:987, currency:"EUR", issuer:321}]]);
      assert.equals(so.to_hex(), "31000000000000000000000000000000000000007B00000000000000000000000055534400000000000000000000000000000000000000000000000315FF31000000000000000000000000000000000000007B000000000000000000000000425443000000000000000000000000000000000000000000000003153100000000000000000000000000000000000003DB0000000000000000000000004555520000000000000000000000000000000000000000000000014100"); //TODO: Check this independently
    },

	"Parse single empty path [[]]" : function () {
      var so = new SerializedObject("00");
	  var parsed_path=types.PathSet.parse(so)
      assert.equals(parsed_path,[[]]);
    },

	"Parse [[e],[e,e]]" : function () {
	  var so = new SerializedObject("31000000000000000000000000000000000000007B00000000000000000000000055534400000000000000000000000000000000000000000000000315FF31000000000000000000000000000000000000007B000000000000000000000000425443000000000000000000000000000000000000000000000003153100000000000000000000000000000000000003DB0000000000000000000000004555520000000000000000000000000000000000000000000000014100");
	  //console.log("AAAA!",types.PathSet);
	  parsed_path=types.PathSet.parse(so);
	  //console.log(parsed_path); 
      assert.equals(parsed_path,[[{account:{_value:123}, currency:{_value:"USD"}, issuer:{_value:789}}],[{account:{_value:123}, currency:{_value:"BTC"}, issuer:{_value:789}},{account:{_value:987}, currency:{_value:"EUR"}, issuer:{_value:321}}]]);
    }
	
  },
  
  "Object" : {
    "Serialize empty object {}" : function () {
      var so = new SerializedObject();
      types.Object.serialize(so, {});
      assert.equals(so.to_hex(), "E1");
    },
    "Parse empty object {}" : function () {
      var so = new SerializedObject("E1");
	  var parsed_object=types.Object.parse(so)
      assert.equals(parsed_object,{});
    },
    'Serialize simple object {"TakerPays":"87654321.12345678/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", "TakerGets":"213", "Fee":789}' : function () {
      var so = new SerializedObject();
      types.Object.serialize(so, {"TakerPays":"87654321.12345678/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", "TakerGets":"213", "Fee":789});
	  assert.equals(so.to_hex(), "64D65F241D335BF24E0000000000000000000000004555520000000000B5F762798A53D543A014CAF8B297CFF8F2F937E86540000000000000D5684000000000000315E1");
	  //console.log("!!!!!!!!!!!!!!!!!!",so.to_hex());
	  //TODO: Check independently.
    },
    "Parse same object" : function () {
      var so = new SerializedObject("64D65F241D335BF24E0000000000000000000000004555520000000000B5F762798A53D543A014CAF8B297CFF8F2F937E86540000000000000D5684000000000000315E1");
	  var parsed_object=types.Object.parse(so);
      refute.equals(parsed_object,{"TakerPays":{_value:123}, "TakerGets":{_value:456}, "Fee":{_value:789}});
	  //TODO: Check independently.
	  console.log("LEFT OFF HERE!!!!!!!!!!!!!!!!!!!!!!!!!!!! MAKE THIS WORK!!!!!!!!!!");
	  console.log(parsed_object);
    },
	
    'Serialize simple object {"DestinationTag":123, "QualityIn":456, "QualityOut":789}' : function () {
      var so = new SerializedObject();
      types.Object.serialize(so, {"DestinationTag":123, "QualityIn":456, "QualityOut":789});
	  //console.log("what?", so.to_hex());
	  assert.equals(so.to_hex(), "2E0000007B2014000001C8201500000315E1");
	  //TODO: Check independently.
    },
    'Parse simple object {"DestinationTag":123, "QualityIn":456, "QualityOut":789}' : function () { //2E0000007B22000001C82400000315E1 2E0000007B2002000001C8200200000315E1
      var so = new SerializedObject("2E0000007B2014000001C8201500000315E1");
	  var parsed_object=types.Object.parse(so);
      assert.equals(parsed_object,{"DestinationTag":123, "QualityIn":456, "QualityOut":789});
	  //TODO: Check independently.
    },

  },
  
  "Array" : {/*
    "Serialize empty array []" : function () {
      var so = new SerializedObject();
      types.Array.serialize(so, []);
      assert.equals(so.to_hex(), "F1");
    },
    "Parse empty array []" : function () {
      var so = new SerializedObject("F1");
	  var parsed_object=types.Array.parse(so);
      assert.equals(parsed_object,[]);
    },*/
    'Serialize 3-length array [{"TakerPays":123}, {"TakerGets":456}, {"Fee":789}]' : function () {
      var so = new SerializedObject();
      types.Array.serialize(so, [{"TakerPays":123}, {"TakerGets":456}, {"Fee":789}]);
	  //TODO: Check this manually
      assert.equals(so.to_hex(), "64400000000000007B6540000000000001C8684000000000000315F1");
    },
    "Parse the same array" : function () {
      var so = new SerializedObject("64400000000000007B6540000000000001C8684000000000000315F1");
	  var parsed_object=types.Array.parse(so);
	  //console.log("WE GOT:", parsed_object[0].TakerPays._value, parsed_object[1].TakerGets._value, parsed_object[2].Fee._value);
	  console.log("WE GOT BACK 1:", parsed_object);
      assert.equals([123,456,789],[parsed_object[0].TakerPays._value, parsed_object[1].TakerGets._value, parsed_object[2].Fee._value]);
    },
	'Serialize 3-length array [{"DestinationTag":123}, {"QualityIn":456}, {"Fee":789}]' : function () {
      var so = new SerializedObject();
      types.Array.serialize(so, [{"DestinationTag":123}, {"QualityIn":456}, {"Fee":789}]);
	  //TODO: Check this manually
	  console.log("WE GOT!!:",so.to_hex());
      assert.equals(so.to_hex(), "2E0000007B2014000001C8684000000000000315F1");
    },
    "Parse the same array 2" : function () {
      var so = new SerializedObject("2E0000007B2014000001C8684000000000000315F1");
	  var parsed_object=types.Array.parse(so);
	  console.log("WE GOT BACK 2:", parsed_object);
	  //TODO: Is this correct? Return some things as integers, and others as objects?
      assert.equals([123,456,789],[parsed_object[0].DestinationTag, parsed_object[1].QualityIn, parsed_object[2].Fee._value]);
    },
  }
  
  
});

// vim:sw=2:sts=2:ts=8:et
