var binformat = require('./binformat');
var sjcl      = require('./utils').sjcl;
var extend    = require('extend');
var stypes    = require('./serializedtypes');
var UInt256   = require('./uint256').UInt256;
var assert    = require('assert');

var TRANSACTION_TYPES = {
  0:    'Payment',
  3:    'AccountSet',
  5:    'SetRegularKey',
  7:    'OfferCreate',
  8:    'OfferCancel',
  9:    'Contract',
  10:   'RemoveContract',
  20:   'TrustSet',
  100:  'EnableFeature',
  101:  'SetFee'
};

var LEDGER_ENTRY_TYPES = {
  97:   'AccountRoot',
  99:   'Contract',
  100:  'DirectoryNode',
  102:  'Features',
  103:  'GeneratorMap',
  104:  'LedgerHashes',
  110:  'Nickname',
  111:  'Offer',
  114:  'RippleState',
  115:  'FeeSettings'
};

var TRANSACTION_RESULTS = {
  0  :  'tesSUCCESS',
  100:  'tecCLAIM',
  101:  'tecPATH_PARTIAL',
  102:  'tecUNFUNDED_ADD',
  103:  'tecUNFUNDED_OFFER',
  104:  'tecUNFUNDED_PAYMENT',
  105:  'tecFAILED_PROCESSING',
  121:  'tecDIR_FULL',
  122:  'tecINSUF_RESERVE_LINE',
  123:  'tecINSUF_RESERVE_OFFER',
  124:  'tecNO_DST',
  125:  'tecNO_DST_INSUF_XRP',
  126:  'tecNO_LINE_INSUF_RESERVE',
  127:  'tecNO_LINE_REDUNDANT',
  128:  'tecPATH_DRY',
  129:  'tecUNFUNDED', // Deprecated, old ambiguous unfunded.
  130:  'tecMASTER_DISABLED',
  131:  'tecNO_REGULAR_KEY',
  132:  'tecOWNERS'
};

var TX_ID_MAP = { };

Object.keys(binformat.tx).forEach(function(key) {
  TX_ID_MAP[key[0]] = key;
});

function SerializedObject(buf) {
  if (Array.isArray(buf) || (Buffer && Buffer.isBuffer(buf)) ) {
    this.buffer = buf;
  } else if (typeof buf === 'string') {
    this.buffer = sjcl.codec.bytes.fromBits(sjcl.codec.hex.toBits(buf));
  } else if (!buf) {
    this.buffer = [];
  } else {
    throw new Error('Invalid buffer passed.');
  }
  this.pointer = 0;
};

SerializedObject.from_json = function (obj) {
  // Create a copy of the object so we don't modify it
  var obj = extend({}, obj);
  var so  = new SerializedObject;
  var typedef;

  switch (typeof obj.TransactionType)  {
    case 'number':
      obj.TransactionType = SerializedObject.lookup_type_tx(obj.TransactionType);

      if (!obj.TransactionType) {
        throw new Error('Transaction type ID is invalid.');
      }
      break;
    case 'string':
      typedef = binformat.tx[obj.TransactionType];

      if (!Array.isArray(typedef)) {
        throw new Error('Transaction type is invalid');
      }

      typedef = typedef.slice();
      obj.TransactionType = typedef.shift();
      break;
    default:
      if (typeof obj.LedgerEntryType !== 'undefined') {
      // XXX: TODO
      throw new Error('Ledger entry binary format not yet implemented.');
    } else {
      throw new Error('Object to be serialized must contain either ' + 'TransactionType or LedgerEntryType.');
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
  return function(bytes) {
    var start = this.pointer;
    var end   = start + bytes;

    if (end > this.buffer.length) {
      throw new Error('Buffer length exceeded');
    }

    var result = this.buffer.slice(start, end);

    if (advance) {
      this.pointer = end;
    }

    return result;
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

SerializedObject.prototype.to_json = function() {
  var old_pointer = this.pointer;
  this.resetPointer();
  var output = { };

  while (this.pointer < this.buffer.length) {
    var key_and_value = stypes.parse(this);
    var key = key_and_value[0];
    var value = key_and_value[1];
    output[key] = SerializedObject.jsonify_structure(value, key);
  }

  this.pointer = old_pointer;

  return output;
}

SerializedObject.jsonify_structure = function(structure, field_name) {
  var output;

  switch (typeof structure) {
    case 'number':
      switch (field_name) {
        case 'LedgerEntryType':
          output = LEDGER_ENTRY_TYPES[structure] || thing;
          break;
        case 'TransactionResult':
          output = TRANSACTION_RESULTS[structure] || thing;
          break;
        case 'TransactionType':
          output = TRANSACTION_TYPES[structure] || thing;
          break;
        default:
          output = structure;
      }
      break;
    case 'object':
      if (!structure) break; //null
      if (typeof structure.to_json === 'function') {
        output = structure.to_json();
      } else {
        output = new structure.constructor; //new Array or Object
        var keys = Object.keys(structure);
        for (var i=0, l=keys.length; i<l; i++) {
          var key = keys[i];
          output[key] = SerializedObject.jsonify_structure(structure[key], key);
        }
      }
      break;
    default:
      output = structure;
  }

  return output;
};

SerializedObject.prototype.serialize = function (typedef, obj) {
  // Ensure canonical order
  var typedef = SerializedObject.sort_typedef(typedef);

  // Serialize fields
  for (var i=0, l=typedef.length; i<l; i++) {
    this.serialize_field(typedef[i], obj);
  }
};

SerializedObject.prototype.hash = function (prefix) {
  var sign_buffer = new SerializedObject();
  stypes.Int32.serialize(sign_buffer, prefix);
  sign_buffer.append(this.buffer);
  return sign_buffer.hash_sha512_half();
};

// DEPRECATED
SerializedObject.prototype.signing_hash = SerializedObject.prototype.hash;

SerializedObject.prototype.hash_sha512_half = function () {
  var bits = sjcl.codec.bytes.toBits(this.buffer);
  var hash = sjcl.bitArray.bitSlice(sjcl.hash.sha512.hash(bits), 0, 256);
  return UInt256.from_hex(sjcl.codec.hex.fromBits(hash));
};

SerializedObject.prototype.serialize_field = function (spec, obj) {
  var name     = spec[0];
  var presence = spec[1];
  var field_id = spec[2];
  var Type     = spec[3];

  if (typeof obj[name] !== 'undefined') {
    this.append(SerializedObject.get_field_header(Type.id, field_id));
    try {
      Type.serialize(this, obj[name]);
    } catch (e) {
      // Add field name to message and rethrow
      e.message = 'Error serializing "' + name + '": ' + e.message;
      throw e;
    }
  } else if (presence === binformat.REQUIRED) {
    throw new Error('Missing required field ' + name);
  }
};

SerializedObject.get_field_header = function (type_id, field_id) {
  var buffer = [ 0 ];

  if (type_id > 0xF) {
    buffer.push(type_id & 0xFF);
  } else {
    buffer[0] += (type_id & 0xF) << 4;
  }

  if (field_id > 0xF) {
    buffer.push(field_id & 0xFF);
  } else {
    buffer[0] += field_id & 0xF;
  }

  return buffer;
};

SerializedObject.sort_typedef = function (typedef) {
  assert(Array.isArray(typedef));

  function sort_field_compare(a, b) {
    // Sort by type id first, then by field id
    return a[3].id !== b[3].id ? a[3].id - b[3].id : a[2] - b[2];
  };

  return typedef.sort(sort_field_compare);
};

SerializedObject.lookup_type_tx = function (id) {
  assert(typeof id === 'string');
  return TX_ID_MAP[id];
};

exports.SerializedObject = SerializedObject;
