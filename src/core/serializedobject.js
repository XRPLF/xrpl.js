'use strict';

const assert = require('assert');
const extend = require('extend');
const BN = require('bn.js');
const hashjs = require('hash.js');
const sjclcodec = require('sjcl-codec');
const binformat = require('./binformat');
const stypes = require('./serializedtypes');
const utils = require('./utils');
const UInt256 = require('./uint256').UInt256;

const TRANSACTION_TYPES = { };

Object.keys(binformat.tx).forEach(function(key) {
  TRANSACTION_TYPES[binformat.tx[key][0]] = key;
});

const LEDGER_ENTRY_TYPES = {};

Object.keys(binformat.ledger).forEach(function(key) {
  LEDGER_ENTRY_TYPES[binformat.ledger[key][0]] = key;
});

const TRANSACTION_RESULTS = {};

Object.keys(binformat.ter).forEach(function(key) {
  TRANSACTION_RESULTS[binformat.ter[key]] = key;
});

function fieldType(fieldName) {
  const fieldDef = binformat.fieldsInverseMap[fieldName];
  return binformat.types[fieldDef[0]];
}

function SerializedObject(buf) {
  if (Array.isArray(buf) || (Buffer && Buffer.isBuffer(buf))) {
    this.buffer = buf;
  } else if (typeof buf === 'string') {
    this.buffer = sjclcodec.bytes.fromBits(sjclcodec.hex.toBits(buf));
  } else if (!buf) {
    this.buffer = [];
  } else {
    throw new Error('Invalid buffer passed.');
  }
  this.pointer = 0;
}

SerializedObject.from_json = function(obj) {
  const so = new SerializedObject();
  so.parse_json(obj);
  return so;
};

SerializedObject.check_fields = function(typedef, obj) {
  const missingFields = [];
  const unknownFields = [];
  const fieldsMap = {};

  // Get missing required fields
  typedef.forEach(function(field) {
    const fieldName = field[0];
    const isRequired = field[1] === binformat.REQUIRED;

    if (isRequired && obj[fieldName] === undefined) {
      missingFields.push(fieldName);
    } else {
      fieldsMap[fieldName] = true;
    }
  });

  // Get fields that are not specified in format
  Object.keys(obj).forEach(function(key) {
    if (!fieldsMap[key] && /^[A-Z]/.test(key)) {
      unknownFields.push(key);
    }
  });

  if (!(missingFields.length || unknownFields.length)) {
    // No missing or unknown fields
    return;
  }

  let errorMessage;

  if (obj.TransactionType !== undefined) {
    errorMessage = SerializedObject.lookup_type_tx(obj.TransactionType);
  } else if (obj.LedgerEntryType !== undefined) {
    errorMessage = SerializedObject.lookup_type_le(obj.LedgerEntryType);
  } else {
    errorMessage = 'TransactionMetaData';
  }

  if (missingFields.length > 0) {
    errorMessage += ' is missing fields: ' + JSON.stringify(missingFields);
  }
  if (unknownFields.length > 0) {
    errorMessage += (missingFields.length ? ' and' : '')
     + ' has unknown fields: ' + JSON.stringify(unknownFields);
  }

  throw new Error(errorMessage);
};

SerializedObject.prototype.parse_json = function(obj_) {
  // Create a copy of the object so we don't modify it
  const obj = extend(true, {}, obj_);
  let typedef;

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

  SerializedObject.check_fields(typedef, obj);
  this.serialize(typedef, obj);
};

SerializedObject.prototype.append = function(bytes_) {
  const bytes = bytes_ instanceof SerializedObject ? bytes_.buffer : bytes_;

  // Make sure both buffer and bytes are Array. Either could be a Buffer.
  if (Array.isArray(this.buffer) && Array.isArray(bytes)) {
    // `this.buffer = this.buffer.concat(bytes)` can be unbearably slow for
    // large bytes length and acceptable bytes length is limited for
    // `Array.prototype.push.apply(this.buffer, bytes)` as every element in the
    // bytes array is pushed onto the stack, potentially causing a RangeError
    // exception. Both of these solutions are known to be problematic for
    // ledger 7501326. KISS instead

    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
  } else {
    this.buffer = this.buffer.concat(bytes);
  }

  this.pointer += bytes.length;
};

SerializedObject.prototype.resetPointer = function() {
  this.pointer = 0;
};

function readOrPeek(advance) {
  return function(bytes) {
    const start = this.pointer;
    const end = start + bytes;

    if (end > this.buffer.length) {
      throw new Error('Buffer length exceeded');
    }

    const result = this.buffer.slice(start, end);

    if (advance) {
      this.pointer = end;
    }

    return result;
  };
}

SerializedObject.prototype.read = readOrPeek(true);

SerializedObject.prototype.peek = readOrPeek(false);

SerializedObject.prototype.to_bits = function() {
  return sjclcodec.bytes.toBits(this.buffer);
};

SerializedObject.prototype.to_hex = function() {
  return sjclcodec.hex.fromBits(this.to_bits()).toUpperCase();
};

SerializedObject.prototype.to_json = function() {
  const old_pointer = this.pointer;

  this.resetPointer();

  const output = { };

  while (this.pointer < this.buffer.length) {
    const key_and_value = stypes.parse(this);
    const key = key_and_value[0];
    const value = key_and_value[1];
    output[key] = SerializedObject.jsonify_structure(value, key);
  }

  this.pointer = old_pointer;

  return output;
};

SerializedObject.jsonify_structure = function(structure, fieldName) {
  let output;

  switch (typeof structure) {
    case 'number':
      switch (fieldName) {
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
      } else if (structure instanceof BN) {
        // We assume that any BN is a UInt64 field
        assert.equal(fieldType(fieldName), 'Int64');
        output = utils.arrayToHex(structure.toArray('bn', 8));
      } else {
        // new Array or Object
        output = new structure.constructor();

        const keys = Object.keys(structure);

        for (let i = 0, l = keys.length; i < l; i++) {
          const key = keys[i];
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
  for (let i=0, l=typedef.length; i<l; i++) {
    this.serialize_field(typedef[i], obj);
  }
  */
};

SerializedObject.prototype.hash = function(prefix) {
  const sign_buffer = new SerializedObject();

  // Add hashing prefix
  if (typeof prefix !== 'undefined') {
    stypes.Int32.serialize(sign_buffer, prefix);
  }

  // Copy buffer to temporary buffer
  sign_buffer.append(this.buffer);
  const bytes = hashjs.sha512().update(sign_buffer.buffer).digest();

  return UInt256.from_bytes(bytes.slice(0, 32));
};

// DEPRECATED
SerializedObject.prototype.signing_hash = SerializedObject.prototype.hash;

SerializedObject.prototype.serialize_field = function(spec, obj) {
  const name = spec[0];
  const presence = spec[1];

  if (typeof obj[name] !== 'undefined') {
    try {
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
  const buffer = [0];

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
  }

  return typedef.sort(sort_field_compare);
};

SerializedObject.lookup_type_tx = function(id) {
  assert.strictEqual(typeof id, 'number');
  return TRANSACTION_TYPES[id];
};

SerializedObject.lookup_type_le = function(id) {
  assert(typeof id === 'number');
  return LEDGER_ENTRY_TYPES[id];
};

exports.SerializedObject = SerializedObject;
