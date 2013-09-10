/**
 * Type definitions for binary format.
 *
 * This file should not be included directly. Instead, find the format you're
 * trying to parse or serialize in binformat.js and pass that to
 * SerializedObject.parse() or SerializedObject.serialize().
 */

var extend   = require('extend');
var utils    = require('./utils');
var sjcl     = require('../../../build/sjcl');

var amount   = require('./amount');
var UInt128  = require('./uint128').UInt128;
var UInt160  = require('./uint160').UInt160;
var UInt256  = require('./uint256').UInt256;
var Amount   = amount.Amount;
var Currency = amount.Currency;

// Shortcuts
var hex    = sjcl.codec.hex;
var bytes  = sjcl.codec.bytes;

var jsbn    = require('./jsbn');
var BigInteger = jsbn.BigInteger;

var SerializedType = function (methods) {
  extend(this, methods);
};

function serialize_hex(so, hexData, noLength) {
  var byteData = bytes.fromBits(hex.toBits(hexData));
  if (!noLength) {
    SerializedType.serialize_varint(so, byteData.length);
  }
  so.append(byteData);
};


/**
 * parses bytes as hex
 */
function convert_bytes_to_hex (byte_array) {
  return sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(byte_array)).toUpperCase();
}

SerializedType.serialize_varint = function (so, val) {
  if (val < 0) {
    throw new Error("Variable integers are unsigned.");
  }
  if (val <= 192) {
    so.append([val]);
  } else if (val <= 12480) {
    val -= 193;
    so.append([193 + (val >>> 8), val & 0xff]);
  } else if (val <= 918744) {
    val -= 12481;
    so.append([
              241 + (val >>> 16),
              val >>> 8 & 0xff,
              val & 0xff
    ]);
  } else {
    throw new Error("Variable integer overflow.");
  }
};


SerializedType.prototype.parse_varint = function (so) {
  var b1 = so.read(1)[0], b2, b3;
  var result;
  if (b1 <= 192) {
    result = b1;
  } else if (b1 <= 240) {
    b2 = so.read(1)[0];
    result = 193 + (b1-193)*256 + b2;
  } else if (b1 <= 254) {
    b2 = so.read(1)[0];
    b3 = so.read(1)[0];
    result = 12481 + (b1-241)*65536 + b2*256 + b3
  }
  else {
    throw new Error("Invalid varint length indicator");
  }
  return result;
};




// In the following, we assume that the inputs are in the proper range. Is this correct?

// Helper functions for 1-, 2-, and 4-byte integers.

/**
 * Convert an integer value into an array of bytes.
 *
 * The result is appended to the serialized object ("so").
 */
function append_byte_array(so, val, bytes) {
  if (isNaN(val) || val === null) {
    throw new Error("Integer is not a number");
  }
  if (val < 0 || val >= (Math.pow(256, bytes))) {
    throw new Error("Integer out of bounds");
  }
  var newBytes = [];
  for (var i=0; i<bytes; i++) {
    newBytes.unshift(val >>> (i*8) & 0xff);
  }
  so.append(newBytes);
}

// Convert a certain number of bytes from the serialized object ("so") into an integer.
function readAndSum(so, bytes) {
  var sum = 0;
  for (var i=0; i<bytes; i++) {
    sum += (so.read(1)[0] << (8*(bytes-1-i)) );
  }
  return sum;
}


var STInt8 = exports.Int8 = new SerializedType({
  serialize: function (so, val) {
    append_byte_array(so, val, 1);
  },
  parse: function (so) {
    return readAndSum(so, 1);
  }
});

var STInt16 = exports.Int16 = new SerializedType({
  serialize: function (so, val) {
    append_byte_array(so, val, 2);
  },
  parse: function (so) {
    return readAndSum(so, 2);
  }
});

var STInt32 = exports.Int32 = new SerializedType({
  serialize: function (so, val) {
    append_byte_array(so, val, 4)
  },
  parse: function (so) {
    return readAndSum(so, 4);
  }
});


var STInt64 = exports.Int64 = new SerializedType({
  serialize: function (so, val) {
    var bigNumObject;

    if (typeof val === 'number' & !isNaN(val)) {
      val = Math.floor(val);
      if (val < 0) {
        throw new Error("Negative value for unsigned Int64 is invalid.");
      }
      bigNumObject = new BigInteger(String(val), 10);
    } else if (typeof val === 'string') {
      if (!/^[0-9A-F]{0,16}$/i.test(val)) {
        throw new Error("Not a valid hex Int64.");
      }
      bigNumObject = new BigInteger(val, 16);
    } else if (val instanceof BigInteger) {
      if (val.compareTo(BigInteger.ZERO) < 0) {
        throw new Error("Negative value for unsigned Int64 is invalid.");
      }
      bigNumObject = val;
    } else {
      throw new Error("Invalid type for Int64");
    }

    var hex = bigNumObject.toString(16);

    if (hex.length > 16) {
      throw new Error("Int64 is too large");
    }

    while (hex.length < 16) {
      hex = "0" + hex;
    }

    return serialize_hex(so, hex, true); //noLength = true
  },
  parse: function (so) {
    var hi = readAndSum(so, 4);
    var lo = readAndSum(so, 4);
    var result = new BigInteger(String(hi));
    result.shiftLeft(32);
    result.add(lo);
    return result;
  }
});

var STHash128 = exports.Hash128 = new SerializedType({
  serialize: function (so, val) {
    var hash = UInt128.from_json(val);
    if (!hash.is_valid()) {
      throw new Error("Invalid Hash128");
    }
    serialize_hex(so, hash.to_hex(), true); //noLength = true
  },
  parse: function (so) {
    return UInt128.from_bytes(so.read(16));
  }
});

var STHash256 = exports.Hash256 = new SerializedType({
  serialize: function (so, val) {
    var hash = UInt256.from_json(val);
    if (!hash.is_valid()) {
      throw new Error("Invalid Hash256");
    }
    serialize_hex(so, hash.to_hex(), true); //noLength = true
  },
  parse: function (so) {
    return UInt256.from_bytes(so.read(32));
  }
});

var STHash160 = exports.Hash160 = new SerializedType({
  serialize: function (so, val) {
    var hash = UInt160.from_json(val);
    if (!hash.is_valid()) {
      throw new Error("Invalid Hash160");
    }
    serialize_hex(so, hash.to_hex(), true); //noLength = true
  },
  parse: function (so) {
    return UInt160.from_bytes(so.read(20));
  }
});

// Internal
var STCurrency = new SerializedType({
  serialize: function (so, val) {
    var currency = val.to_json().toUpperCase();
    if (currency === 'XRP') {
      serialize_hex(so, UInt160.HEX_ZERO, true);
    } else if (typeof currency === 'string'&& currency.length === 3) {
      var currencyCode = currency.toUpperCase();
      var currencyData = utils.arraySet(20, 0);

      if (!/^[A-Z]{3}$/.test(currencyCode)) {
        throw new Error('Invalid currency code');
      }

      currencyData[12] = currencyCode.charCodeAt(0) & 0xff;
      currencyData[13] = currencyCode.charCodeAt(1) & 0xff;
      currencyData[14] = currencyCode.charCodeAt(2) & 0xff;

      so.append(currencyData);
    } else {
      throw new Error('Tried to serialize invalid/unimplemented currency type.');
    }
  },
  parse: function (so) {
    var bytes = so.read(20);
    var currency = Currency.from_bytes(bytes);
    // XXX Disabled check. Theoretically, the Currency class should support any
    //     UInt160 value and consider it valid. But it doesn't, so for the
    //     deserialization to be usable, we need to allow invalid results for now.
    //if (!currency.is_valid()) {
    //  throw new Error("Invalid currency: "+convert_bytes_to_hex(bytes));
    //}
    return currency;
  }
});

var STAmount = exports.Amount = new SerializedType({
  serialize: function (so, val) {
    var amount = Amount.from_json(val);
    if (!amount.is_valid()) {
      throw new Error("Not a valid Amount object.");
    }

    // Amount (64-bit integer)
    var valueBytes = utils.arraySet(8, 0);
    if (amount.is_native()) {
      var valueHex = amount._value.toString(16);

      // Enforce correct length (64 bits)
      if (valueHex.length > 16) {
        throw new Error('Value out of bounds');
      }

      while (valueHex.length < 16) {
        valueHex = "0" + valueHex;
      }

      valueBytes = bytes.fromBits(hex.toBits(valueHex));
      // Clear most significant two bits - these bits should already be 0 if
      // Amount enforces the range correctly, but we'll clear them anyway just
      // so this code can make certain guarantees about the encoded value.
      valueBytes[0] &= 0x3f;
      if (!amount.is_negative()) valueBytes[0] |= 0x40;
    } else {
      var hi = 0, lo = 0;

      // First bit: non-native
      hi |= 1 << 31;

      if (!amount.is_zero()) {
        // Second bit: non-negative?
        if (!amount.is_negative()) hi |= 1 << 30;

        // Next eight bits: offset/exponent
        hi |= ((97 + amount._offset) & 0xff) << 22;

        // Remaining 52 bits: mantissa
        hi |= amount._value.shiftRight(32).intValue() & 0x3fffff;
        lo = amount._value.intValue() & 0xffffffff;
      }

      valueBytes = sjcl.codec.bytes.fromBits([hi, lo]);
    }

    so.append(valueBytes);

    if (!amount.is_native()) {
      // Currency (160-bit hash)
      var currency = amount.currency();
      STCurrency.serialize(so, currency);

      // Issuer (160-bit hash)
      so.append(amount.issuer().to_bytes());
    }
  },
  parse: function (so) {
    var amount = new Amount();
    var value_bytes = so.read(8);
    var is_zero = !(value_bytes[0] & 0x7f);

    for (var i=1; i<8; i++) {
      is_zero = is_zero && !value_bytes[i];
    }

    if (value_bytes[0] & 0x80) {
      //non-native
      var currency = STCurrency.parse(so);
      var issuer_bytes = so.read(20);
      var issuer = UInt160.from_bytes(issuer_bytes);
      var offset = ((value_bytes[0] & 0x3f) << 2) + (value_bytes[1] >>> 6) - 97;
      var mantissa_bytes = value_bytes.slice(1);
      mantissa_bytes[0] &= 0x3f;
      var value = new BigInteger(mantissa_bytes, 256);

      if (value.equals(BigInteger.ZERO) && !is_zero ) {
        throw new Error("Invalid zero representation");
      }

      amount._value = value;
      amount._offset = offset;
      amount._currency    = currency;
      amount._issuer      = issuer;
      amount._is_native   = false;
    } else {
      //native
      var integer_bytes = value_bytes.slice();
      integer_bytes[0] &= 0x3f;
      amount._value = new BigInteger(integer_bytes, 256);
      amount._is_native   = true;
    }
    amount._is_negative = !is_zero && !(value_bytes[0] & 0x40);
    return amount;
  }
});

var STVL = exports.VariableLength = new SerializedType({
  serialize: function (so, val) {
    if (typeof val === 'string') {
      serialize_hex(so, val);
    } else {
      throw new Error("Unknown datatype.");
    }
  },
  parse: function (so) {
    var len = this.parse_varint(so);
    return convert_bytes_to_hex(so.read(len));
  }
});

var STAccount = exports.Account = new SerializedType({
  serialize: function (so, val) {
    var account = UInt160.from_json(val);
    if (!account.is_valid()) {
      throw new Error("Invalid account!");
    }
    serialize_hex(so, account.to_hex());
  },
  parse: function (so) {
    var len = this.parse_varint(so);

    if (len !== 20) {
      throw new Error("Non-standard-length account ID");
    }

    var result = UInt160.from_bytes(so.read(len));

    //XX
    if (false && !result.is_valid()) {
      throw new Error("Invalid Account");
    }

    return result;
  }
});

var STPathSet = exports.PathSet = new SerializedType({
  typeBoundary:  0xff,
  typeEnd:       0x00,
  typeAccount:   0x01,
  typeCurrency:  0x10,
  typeIssuer:    0x20,
  serialize: function (so, val) {
    // XXX
    for (var i=0, l=val.length; i<l; i++) {
      // Boundary
      if (i) {
        STInt8.serialize(so, this.typeBoundary);
      }

      for (var j=0, l2=val[i].length; j<l2; j++) {
        var entry = val[i][j];
        //if (entry.hasOwnProperty("_value")) {entry = entry._value;}
        var type = 0;

        if (entry.account) type |= this.typeAccount;
        if (entry.currency) type |= this.typeCurrency;
        if (entry.issuer) type |= this.typeIssuer;

        STInt8.serialize(so, type);

        if (entry.account) {
          so.append(UInt160.from_json(entry.account).to_bytes());
        }

        if (entry.currency) {
          var currency = Currency.from_json(entry.currency);
          STCurrency.serialize(so, currency);
        }

        if (entry.issuer) {
          so.append(UInt160.from_json(entry.issuer).to_bytes());
        }
      }
    }
    STInt8.serialize(so, this.typeEnd);
  },
  parse: function (so) {
    // XXX
    // should return a list of lists:
    /*
       [
       [entry, entry],
       [entry, entry, entry]
       [entry]
       []
       ]

       each entry has one or more of the following attributes: amount, currency, issuer.
       */

    var path_list    = [];
    var current_path = [];
    var tag_byte;

    while ((tag_byte = so.read(1)[0]) !== this.typeEnd) {
      //TODO: try/catch this loop, and catch when we run out of data without reaching the end of the data structure.
      //Now determine: is this an end, boundary, or entry-begin-tag?
      //console.log("Tag byte:", tag_byte);
      if (tag_byte == this.typeBoundary) {
        //console.log("Boundary");
        if (current_path) { //close the current path, if there is one,
          path_list.push(current_path);
        }
        current_path = []; //and start a new one.
      } else {
        //It's an entry-begin tag.
        //console.log("It's an entry-begin tag.");
        var entry = {};

        if (tag_byte & this.typeAccount) {
          //console.log("entry.account");
          /*var bta = so.read(20);
            console.log("BTA:", bta);*/
          entry.account = STHash160.parse(so);
        }
        if (tag_byte & this.typeCurrency) {
          //console.log("entry.currency");
          entry.currency = STCurrency.parse(so)
        }
        if (tag_byte & this.typeIssuer) {
          //console.log("entry.issuer");
          entry.issuer = STHash160.parse(so); //should know to use Base58?
          //console.log("DONE WITH ISSUER!");
        }

        if (entry.account || entry.currency || entry.issuer) {
          current_path.push(entry);
        } else {
          throw new Error("Invalid path entry"); //It must have at least something in it.
        }
      }
    }

    if (current_path) {
      //close the current path, if there is one,
      path_list.push(current_path);
    }

    return path_list;
  }

});

var STVector256 = exports.Vector256 = new SerializedType({
  serialize: function (so, val) { //Assume val is an array of STHash256 objects.
    var length_as_varint = SerializedType.serialize_varint(so, val.length);
    for (var i = 0; i<val.length; i++){
      STHash256.serialize(so, val[i]);
    }
  },
  parse: function (so) {
    var length_from_varint = this.parse_varint(so);
    var output = [];
    for (var i=0; i<length_from_varint; i++) {
      output.push(STHash256.parse(so));
    }
    return output;
  }
});

exports.serialize_whatever = serialize_whatever;

function serialize_whatever(so, field_name, value) {
  //so: a byte-stream to serialize into.
  //field_name: a string for the field name ("LedgerEntryType" etc.)
  //value: the value of that field.
  var field_coordinates = INVERSE_FIELDS_MAP[field_name];
  var type_bits         = parseInt(field_coordinates[0], 10);
  var field_bits        = parseInt(field_coordinates[1], 10);
  var tag_byte          = (type_bits < 16 ? type_bits << 4 : 0) | (field_bits < 16 ? field_bits : 0)
  STInt8.serialize(so, tag_byte)

  if (type_bits >= 16) {
    STInt8.serialize(so, type_bits)
  }

  if (field_bits >= 16) {
    STInt8.serialize(so, field_bits)
  }

  var serialized_object_type = TYPES_MAP[type_bits];
  //do something with val[keys] and val[keys[i]];
  serialized_object_type.serialize(so, value);
}

//What should this helper function be attached to?
//Take the serialized object, figure out what type/field it is, and return the parsing of that.
exports.parse_whatever = parse_whatever;

function parse_whatever(so) {
  var tag_byte   = so.read(1)[0];
  var type_bits  = tag_byte >> 4;
  var field_bits = tag_byte & 0x0f;
  var type;
  var field_name;

  if (type_bits === 0) {
    type_bits = so.read(1)[0];
  }

  type = TYPES_MAP[type_bits];

  if (typeof type === 'undefined') {
    throw Error("Unknown type");
  } else {
    if (field_bits === 0) {
      field_name = FIELDS_MAP[type_bits][so.read(1)[0]];
    } else {
      field_name = FIELDS_MAP[type_bits][field_bits];
    }
    if (typeof field_name === 'undefined') {
      throw Error("Unknown field " + tag_byte);
    } else {
      return [field_name, type.parse(so)]; //key, value
    }
  }
};

var STObject = exports.Object = new SerializedType({
  serialize: function (so, val) {
    var keys = Object.keys(val);
    for (var i=0; i<keys.length; i++) {
      serialize_whatever(so, keys[i], val[keys[i]]);
      //make this a function called "serialize_whatever"
      //figure out the type corresponding to field so named
      /*
         var field_coordinates = INVERSE_FIELDS_MAP[keys[i]];

         var type_bits = parseInt(field_coordinates[0]);
         var field_bits = parseInt(field_coordinates[1]);
         console.log(type_bits, field_bits);
         var tag_byte=(type_bits < 16 ? type_bits<<4 : 0) | (field_bits < 16 ? field_bits : 0)
         STInt8.serialize(so, tag_byte)
         if (type_bits >= 16) {
         STInt8.serialize(so, type_bits)
         }
         if (field_bits >= 16) {
         STInt8.serialize(so, field_bits)
         }
         var serialized_object_type = TYPES_MAP[type_bits];
      //do something with val[keys] and val[keys[i]];
      serialized_object_type.serialize(so, val[keys[i]]);
      */
    }
    STInt8.serialize(so, 0xe1); //Object ending marker
  },

  parse: function (so) {
    var output = {};
    while (so.peek(1)[0] !== 0xe1) {
      var key_and_value        = parse_whatever(so);
      output[key_and_value[0]] = key_and_value[1];
    }
    so.read(1);
    return output;
  }
});

var STArray = exports.Array = new SerializedType({
  serialize: function (so, val) {
    for (var i=0; i<val.length; i++) {
      var keys = Object.keys(val[i]);
      if (keys.length != 1) {
        throw Error("Cannot serialize an array containing non-single-key objects");
      } else {
        var field_name = keys[0];
        var value = val[i][field_name];
        serialize_whatever(so, field_name, value);
      }
    }
    STInt8.serialize(so, 0xf1); //Array ending marker
  },

  parse: function (so) {
    var output = [ ];

    while (so.peek(1)[0] !== 0xf1) {
      var key_and_value = parse_whatever(so);
      var obj = { };
      obj[key_and_value[0]] = key_and_value[1];
      output.push(obj);
    }

    so.read(1);

    return output;
  }
});


var TYPES_MAP = [
  void(0),

  //Common:
  STInt16,    //1
  STInt32,    //2
  STInt64,    //3
  STHash128,  //4
  STHash256,  //5
  STAmount,   //6
  STVL,       //7
  STAccount,  //8

  // 9-13 reserved
  void(0),    //9
  void(0),    //10
  void(0),    //11
  void(0),    //12
  void(0),    //13

  STObject,   //14
  STArray,    //15

  //Uncommon:
  STInt8,     //16
  STHash160,  //17
  STPathSet,  //18
  STVector256 //19
];

var FIELDS_MAP = {
  //Common types
  1: { //Int16
    1: "LedgerEntryType",2: "TransactionType"
  },
  2: { //Int32
    2:"Flags",3:"SourceTag",4:"Sequence",5:"PreviousTxnLgrSeq",6:"LedgerSequence",
    7:"CloseTime",8:"ParentCloseTime",9:"SigningTime",10:"Expiration",11:"TransferRate",
    12:"WalletSize",13:"OwnerCount",14:"DestinationTag",
    //Skip 15
    16:"HighQualityIn",17:"HighQualityOut",18:"LowQualityIn",19:"LowQualityOut",
    20:"QualityIn",21:"QualityOut",22:"StampEscrow",23:"BondAmount",24:"LoadFee",
    25:"OfferSequence",26:"FirstLedgerSequence",27:"LastLedgerSequence",28:"TransactionIndex",
    29:"OperationLimit",30:"ReferenceFeeUnits",31:"ReserveBase",32:"ReserveIncrement",
    33:"SetFlag",34:"ClearFlag",
  },
  3: { // Int64
    1:"IndexNext",2:"IndexPrevious",3:"BookNode",4:"OwnerNode",
    5:"BaseFee",6:"ExchangeRate",7:"LowNode",8:"HighNode"
  },
  4: { //Hash128
    1:"EmailHash"
  },
  5: { //Hash256
    1:"LedgerHash",2:"ParentHash",3:"TransactionHash",4:"AccountHash",5:"PreviousTxnID",
    6:"LedgerIndex",7:"WalletLocator",8:"RootIndex",16:"BookDirectory",17:"InvoiceID",
    18:"Nickname",19:"Feature"
  },
  6: { //Amount
    1:"Amount",2:"Balance",3:"LimitAmount",4:"TakerPays",5:"TakerGets",6:"LowLimit",
    7:"HighLimit",8:"Fee",9:"SendMax",16:"MinimumOffer",17:"RippleEscrow"
  },
  7: { //VL
    1:"PublicKey",2:"MessageKey",3:"SigningPubKey",4:"TxnSignature",5:"Generator",
    6:"Signature",7:"Domain",8:"FundCode",9:"RemoveCode",10:"ExpireCode",11:"CreateCode"
  },
  8: { //Account
    1:"Account",2:"Owner",3:"Destination",4:"Issuer",7:"Target",8:"RegularKey"
  },
  14: { //Object
    1:undefined, //end of Object
    2:"TransactionMetaData",3:"CreatedNode",4:"DeletedNode",5:"ModifiedNode",
    6:"PreviousFields",7:"FinalFields",8:"NewFields",9:"TemplateEntry",
  },
  15: { //Array
    1:undefined, //end of Array
    2:"SigningAccounts",3:"TxnSignatures",4:"Signatures",5:"Template",
    6:"Necessary",7:"Sufficient",8:"AffectedNodes",
  },

  //Uncommon types
  16: { //Int8
    1:"CloseResolution",2:"TemplateEntryType",3:"TransactionResult"
  },
  17: { //Hash160
    1:"TakerPaysCurrency",2:"TakerPaysIssuer",3:"TakerGetsCurrency",4:"TakerGetsIssuer"
  },
  18: { //PathSet
    1:"Paths"
  },
  19: { //Vector256
    1:"Indexes",2:"Hashes",3:"Features"
  }
};

var INVERSE_FIELDS_MAP = {};
for (var key1 in FIELDS_MAP) {
  for (var key2 in FIELDS_MAP[key1]) {
    INVERSE_FIELDS_MAP[FIELDS_MAP[key1][key2]] = [key1, key2];
  }
}
