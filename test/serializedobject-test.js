var buster      = require("buster");

var SerializedObject = require("../src/js/ripple/serializedobject").SerializedObject;
//var types = require("../src/js/ripple/serializedtypes");

var jsbn    = require('../src/js/ripple/jsbn');
var BigInteger = jsbn.BigInteger;

try {
  var conf = require('./config');
} catch(exception) {
  var conf = require('./config-example');
}

var config = require('../src/js/ripple/config').load(conf);

buster.testCase("Serialized objects", {
  "SerializedObject" : {
    "From json and back" : function () {
		var input_json = {
			"Account":"r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
			"Amount":"274579388",
			"Destination":"r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS",
			"Fee":"15",
			"Flags":0,
			"Paths":[[{"account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","currency":"USD","issuer":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV"},{"currency":"XRP"}]],
			"SendMax":{"currency":"USD","issuer":"r4qLSAzv4LZ9TLsR7diphGwKnSEAMQTSjS","value":"2.74579388"},
			"Sequence":351,
			"SigningPubKey":"02854B06CE8F3E65323F89260E9E19B33DA3E01B30EA4CA172612DE77973FAC58A",
			"TransactionType":"Payment",
			"TxnSignature":"30450221009DA3A42DD25E3B22EC45AD8BA8FC7A954264264A816D300B2DF69F814D7D4DD2022072C9627F97EEC6DA13DE841E06E2CD985EF06A0FBB15DDBF0800D0730C8986BF"
		}
		so = SerializedObject.from_json(input_json);
		var output_json = so.to_json();
		//console.log(input_json);
		assert.equals(input_json,output_json);
    }
  }

  
  

  
  
});

// vim:sw=2:sts=2:ts=8:et
