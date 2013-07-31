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

buster.testCase("Serialized types", {
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
});

// vim:sw=2:sts=2:ts=8:et
