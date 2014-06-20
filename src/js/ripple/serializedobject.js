var assert    = require('assert');
var extend    = require('extend');
var binformat = require('./binformat');
var stypes    = require('./serializedtypes');
var UInt256   = require('./uint256').UInt256;
var Crypt     = require('./crypt').Crypt;
var utils     = require('./utils');

var sjcl = utils.sjcl;
var BigInteger = utils.jsbn.BigInteger;

var TRANSACTION_TYPES = { };

Object.keys(binformat.tx).forEach(function(key) {
  TRANSACTION_TYPES[binformat.tx[key][0]] = key;
});

var LEDGER_ENTRY_TYPES = {};

Object.keys(binformat.ledger).forEach(function(key) {
  LEDGER_ENTRY_TYPES[binformat.ledger[key][0]] = key;
});

var TRANSACTION_RESULTS = {};

Object.keys(binformat.ter).forEach(function(key) {
  TRANSACTION_RESULTS[binformat.ter[key]] = key;
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

SerializedObject.from_json = function(obj) {
  // Create a copy of the object so we don't modify it
  var obj = extend({}, obj);
  var so  = new SerializedObject();
  var typedef;

  if (typeof obj.TransactionType === 'number') {
    obj.TransactionType = SerializedObject.lookup_type_tx(obj.TransactionType);
    if (!obj.TransactionType) {
      throw new Error('Transaction type ID is invalid.');
    }
  }

  if (typeof obj.LedgerEntryType === 'number') {
    obj.LedgerEntryType = SerializedObject.lookup_type_le(obj.LedgerEntryType);

    if (!obj.LedgerEntryType) {
      throw new Error('LedgerEntryType ID is invalid.');
    }
  }

  if (typeof obj.TransactionType === 'string') {
    typedef = binformat.tx[obj.TransactionType];
    if (!Array.isArray(typedef)) {
      throw new Error('Transaction type is invalid');
    }

    typedef = typedef.slice();
    obj.TransactionType = typedef.shift();
  } else if (typeof obj.LedgerEntryType === 'string') {
    typedef = binformat.ledger[obj.LedgerEntryType];

    if (!Array.isArray(typedef)) {
      throw new Error('LedgerEntryType is invalid');
    }

    typedef = typedef.slice();
    obj.LedgerEntryType = typedef.shift();

  } else if (typeof obj.AffectedNodes === 'object') {
    typedef = binformat.metadata;
  } else {
    throw new Error('Object to be serialized must contain either' +
                    ' TransactionType, LedgerEntryType or AffectedNodes.');
  }

  // ND: This from_*json* seems a reasonable place to put validation of `json`
  SerializedObject.check_no_missing_fields(typedef, obj);
  so.serialize(typedef, obj);

  return so;
};

SerializedObject.check_no_missing_fields = function(typedef, obj) {
  var missing_fields = [];

  for (var i = typedef.length - 1; i >= 0; i--) {
    var spec = typedef[i];
    var field = spec[0];
    var requirement = spec[1];

    if (binformat.REQUIRED === requirement && obj[field] === void(0)) {
      missing_fields.push(field);
    };
  };

  if (missing_fields.length > 0) {
    var object_name;

    if (obj.TransactionType !== void(0)) {
      object_name = SerializedObject.lookup_type_tx(obj.TransactionType);
    } else if (obj.LedgerEntryType != null){
      object_name = SerializedObject.lookup_type_le(obj.LedgerEntryType);
    } else {
      object_name = "TransactionMetaData";
    }

    throw new Error(object_name + " is missing fields: " +
                    JSON.stringify(missing_fields));
  };
};

SerializedObject.prototype.append = function(bytes) {
  if (bytes instanceof SerializedObject) {
    bytes = bytes.buffer;
  }

  this.buffer = this.buffer.concat(bytes);
  this.pointer += bytes.length;
};

SerializedObject.prototype.resetPointer = function() {
  this.pointer = 0;
};

function readOrPeek(advance) {
  return function(bytes) {
    var start = this.pointer;
    var end = start + bytes;

    if (end > this.buffer.length) {
      throw new Error('Buffer length exceeded');
    }

    var result = this.buffer.slice(start, end);

    if (advance) {
      this.pointer = end;
    }

    return result;
  };
};

SerializedObject.prototype.read = readOrPeek(true);

SerializedObject.prototype.peek = readOrPeek(false);

SerializedObject.prototype.to_bits = function() {
  return sjcl.codec.bytes.toBits(this.buffer);
};

SerializedObject.prototype.to_hex = function() {
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
};

SerializedObject.jsonify_structure = function(structure, field_name) {
  var output;

  switch (typeof structure) {
    case 'number':
      switch (field_name) {
        case 'LedgerEntryType':
          output = LEDGER_ENTRY_TYPES[structure];
          break;
        case 'TransactionResult':
          output = TRANSACTION_RESULTS[structure];
          break;
        case 'TransactionType':
          output = TRANSACTION_TYPES[structure];
          break;
        default:
          output = structure;
      }
      break;
    case 'object':
      if (structure === null) {
        break;
      }

      if (typeof structure.to_json === 'function') {
        output = structure.to_json();
      } else if (structure instanceof BigInteger) {
        output = structure.toString(16).toUpperCase();
      } else {
        //new Array or Object
        output = new structure.constructor();

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

SerializedObject.prototype.serialize = function(typedef, obj) {
  // Serialize object without end marker
  stypes.Object.serialize(this, obj, true);

  // ST: Old serialization
  /*
  // Ensure canonical order
  typedef = SerializedObject.sort_typedef(typedef);

  // Serialize fields
  for (var i=0, l=typedef.length; i<l; i++) {
    this.serialize_field(typedef[i], obj);
  }
  */
};

SerializedObject.prototype.hash = function(prefix) {
  var sign_buffer = new SerializedObject();
  
  // Add hashing prefix
  if ("undefined" !== typeof prefix) {
    stypes.Int32.serialize(sign_buffer, prefix);
  }

  // Copy buffer to temporary buffer
  sign_buffer.append(this.buffer);
  
  // XXX We need a proper Buffer class then Crypt could accept that
  var bits = sjcl.codec.bytes.toBits(sign_buffer.buffer);
  return Crypt.hashSha512Half(bits);
};

// DEPRECATED
SerializedObject.prototype.signing_hash = SerializedObject.prototype.hash;

SerializedObject.prototype.serialize_field = function(spec, obj) {
  var name     = spec[0];
  var presence = spec[1];
  var field_id = spec[2];
  var Type     = stypes[spec[3]];

  if (typeof obj[name] !== 'undefined') {
    // ST: Old serialization code
    //this.append(SerializedObject.get_field_header(Type.id, field_id));
    try {
      // ST: Old serialization code
      //Type.serialize(this, obj[name]);
      stypes.serialize(this, name, obj[name]);
    } catch (e) {
      // Add field name to message and rethrow
      e.message = 'Error serializing "' + name + '": ' + e.message;
      throw e;
    }
  } else if (presence === binformat.REQUIRED) {
    throw new Error('Missing required field ' + name);
  }
};

SerializedObject.get_field_header = function(type_id, field_id) {
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

SerializedObject.sort_typedef = function(typedef) {
  assert(Array.isArray(typedef));

  function sort_field_compare(a, b) {
    // Sort by type id first, then by field id
    return a[3] !== b[3] ? stypes[a[3]].id - stypes[b[3]].id : a[2] - b[2];
  };

  return typedef.sort(sort_field_compare);
};

SerializedObject.lookup_type_tx = function(id) {
  assert.strictEqual(typeof id, 'number');
  return TRANSACTION_TYPES[id];
};

SerializedObject.lookup_type_le = function (id) {
  assert(typeof id === 'number');
  return LEDGER_ENTRY_TYPES[id];
};

exports.SerializedObject = SerializedObject;
