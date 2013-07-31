var buster      = require("buster");

var SerializedObject = require("../src/js/ripple/serializedobject").SerializedObject;
var types = require("../src/js/ripple/serializedtypes");

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
  }
});

// vim:sw=2:sts=2:ts=8:et
