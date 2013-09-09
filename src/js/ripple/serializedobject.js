var binformat = require('./binformat');
var sjcl      = require('../../../build/sjcl');
var extend    = require('extend');
var stypes    = require('./serializedtypes');

var UInt256 = require('./uint256').UInt256;

var SerializedObject = function (buf) {
  if (Array.isArray(buf) || (Buffer && Buffer.isBuffer(buf)) ) {
    this.buffer = buf;
  } else if (typeof buf === 'string') {
    this.buffer = sjcl.codec.bytes.fromBits(sjcl.codec.hex.toBits(buf));
  } else if (!buf) {
    this.buffer = [];
  } else {
    throw new Error("Invalid buffer passed.");
  }
  this.pointer = 0;
};

SerializedObject.from_json = function (obj) {
  var so = new SerializedObject();
  var typedef;

  // Create a copy of the object so we don't modify it
  obj = extend({}, obj);

  switch (typeof obj.TransactionType)  {
    case 'number':
      obj.TransactionType = SerializedObject.lookup_type_tx(obj.TransactionType);
      if (!obj.TransactionType) {
        throw new Error("Transaction type ID is invalid.");
      }
      break;
    case 'string':
      typedef = binformat.tx[obj.TransactionType].slice();
      obj.TransactionType = typedef.shift();
      break;
    default:
      if (typeof obj.LedgerEntryType !== 'undefined') {
      // XXX: TODO
      throw new Error("Ledger entry binary format not yet implemented.");
    } else {
      throw new Error("Object to be serialized must contain either " + "TransactionType or LedgerEntryType.");
    }
  }

  so.serialize(typedef, obj);

  return so;
};

SerializedObject.prototype.append = function (bytes) {
  this.buffer = this.buffer.concat(bytes);
  this.pointer += bytes.length;
};

SerializedObject.prototype.resetPointer = function () {
  this.pointer = 0;
};

function readOrPeek(advance) {
  return function(numberOfBytes) {
    var start = this.pointer;
    var end   = start + numberOfBytes;
    if (end > this.buffer.length) {
      throw new Error("There aren't that many bytes left.");
    } else {
      var result = this.buffer.slice(start, end);
      if (advance) {
        this.pointer = end;
      }
      return result;
    }
  }
};

SerializedObject.prototype.read = readOrPeek(true);
SerializedObject.prototype.peek = readOrPeek(false);

SerializedObject.prototype.to_bits = function () {
  return sjcl.codec.bytes.toBits(this.buffer);
};

SerializedObject.prototype.to_hex = function () {
  return sjcl.codec.hex.fromBits(this.to_bits()).toUpperCase();
};

var TRANSACTION_TYPES = {
  0:    "Payment",
  3:    "AccountSet",
  5:    "SetRegularKey",
  7:    "OfferCreate",
  8:    "OfferCancel",
  9:    "Contract",
  10:   "RemoveContract",
  20:   "TrustSet",
  100:  "EnableFeature",
  101:  "SetFee"
};

var LEDGER_ENTRY_TYPES = {
  97:   "AccountRoot",
  99:   "Contract",
  100:  "DirectoryNode",
  102:  "Features",
  103:  "GeneratorMap",
  104:  "LedgerHashes",
  110:  "Nickname",
  111:  "Offer",
  114:  "RippleState",
  115:  "FeeSettings"
};

var TRANSACTION_RESULTS = {
  0  :  "tesSUCCESS",
  100:  "tecCLAIM",
  101:  "tecPATH_PARTIAL",
  102:  "tecUNFUNDED_ADD",
  103:  "tecUNFUNDED_OFFER",
  104:  "tecUNFUNDED_PAYMENT",
  105:  "tecFAILED_PROCESSING",
  121:  "tecDIR_FULL",
  122:  "tecINSUF_RESERVE_LINE",
  123:  "tecINSUF_RESERVE_OFFER",
  124:  "tecNO_DST",
  125:  "tecNO_DST_INSUF_XRP",
  126:  "tecNO_LINE_INSUF_RESERVE",
  127:  "tecNO_LINE_REDUNDANT",
  128:  "tecPATH_DRY",
  129:  "tecUNFUNDED", // Deprecated, old ambiguous unfunded.
  130:  "tecMASTER_DISABLED",
  131:  "tecNO_REGULAR_KEY",
  132:  "tecOWNERS"
};

SerializedObject.prototype.to_json = function() {
  var old_pointer = this.pointer;
  this.resetPointer();
  var output = { };

  while (this.pointer < this.buffer.length) {
    var key_and_value = stypes.parse_whatever(this);
    var key = key_and_value[0];
    var value = key_and_value[1];
    output[key] = jsonify_structure(value,key);
  }

  this.pointer = old_pointer;

  return output;
}

function jsonify_structure(thing, field_name) {
  var output;

  switch (typeof thing) {
    case 'number':
      switch (field_name) {
        case 'LedgerEntryType':
          output = LEDGER_ENTRY_TYPES[thing] || thing;
          break;
        case 'TransactionResult':
          output = TRANSACTION_RESULTS[thing] || thing;
          break;
        case 'TransactionType':
          output = TRANSACTION_TYPES[thing] || thing;
          break;
        default:
          output = thing;
      }
      break;
    case 'object':
      if (typeof thing.to_json === 'function') {
        output = thing.to_json();
      } else if (thing === null) {
        break;
      } else {
        output = new thing.constructor;
        var keys = Object.keys(thing);
        for (var i=0; i<keys.length; i++) {
          var key = keys[i];
          output[key] = jsonify_structure(thing[key], key);
        }
      }
      break;
    default:
      output = thing;
  }

  return output;
};

SerializedObject.prototype.serialize = function (typedef, obj) {
  // Ensure canonical order
  typedef = SerializedObject._sort_typedef(typedef.slice());

  // Serialize fields
  for (var i=0, l=typedef.length; i<l; i++) {
    var spec = typedef[i];
    this.serialize_field(spec, obj);
  }
};

SerializedObject.prototype.signing_hash = function (prefix) {
  var sign_buffer = new SerializedObject();
  stypes.Int32.serialize(sign_buffer, prefix);
  sign_buffer.append(this.buffer);
  return sign_buffer.hash_sha512_half();
};

SerializedObject.prototype.hash_sha512_half = function () {
  var bits = sjcl.codec.bytes.toBits(this.buffer),
  hash = sjcl.bitArray.bitSlice(sjcl.hash.sha512.hash(bits), 0, 256);

  return UInt256.from_hex(sjcl.codec.hex.fromBits(hash));
};

SerializedObject.prototype.serialize_field = function (spec, obj) {
  var spec     = spec.slice();
  var name     = spec.shift();
  var presence = spec.shift();
  var field_id = spec.shift();
  var Type     = spec.shift();

  if (typeof obj[name] !== 'undefined') {
    //console.log(name, Type.id, field_id);
    this.append(SerializedObject.get_field_header(Type.id, field_id));
    try {
      Type.serialize(this, obj[name]);
    } catch (e) {
      // Add field name to message and rethrow
      e.message = "Error serializing '" + name + "': " + e.message;
      throw e;
    }
  } else if (presence === binformat.REQUIRED) {
    throw new Error('Missing required field ' + name);
  }
};

SerializedObject.get_field_header = function (type_id, field_id) {
  var buffer = [0];

  if (type_id > 0xf) {
    buffer.push(type_id & 0xff);
  } else {
    buffer[0] += (type_id & 0xf) << 4;
  }

  if (field_id > 0xf) {
    buffer.push(field_id & 0xff);
  } else {
    buffer[0] += field_id & 0xf;
  }

  return buffer;
};

function sort_field_compare(a, b) {
  // Sort by type id first, then by field id
  return a[3].id !== b[3].id ? a[3].id - b[3].id : a[2] - b[2];
};

SerializedObject._sort_typedef = function (typedef) {
  return typedef.sort(sort_field_compare);
};

SerializedObject.lookup_type_tx = function (id) {
  var keys = Object.keys(binformat.tx);
  var result = null;

  for (var i=0; i<keys.length; i++) {
    var key = keys[i];
    if (binformat.tx[key][0] === id) {
      result = key;
      break;
    }
  }

  return result;
};

exports.SerializedObject = SerializedObject;
