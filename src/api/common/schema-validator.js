'use strict';
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const validator = require('is-my-json-valid');
const ripple = require('./core');
const ValidationError = require('./errors').ValidationError;

let SCHEMAS = {};

function isValidAddress(address) {
  return ripple.UInt160.is_valid(address);
}

function isValidLedgerHash(ledgerHash) {
  return ripple.UInt256.is_valid(ledgerHash);
}

function loadSchema(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    throw new Error('Failed to parse schema: ' + filepath);
  }
}

function loadSchemas(dir) {
  const filenames = fs.readdirSync(dir).filter(name => name.endsWith('.json'));
  const schemas = filenames.map(name => loadSchema(path.join(dir, name)));
  return _.indexBy(schemas, 'title');
}

function formatSchemaError(error) {
  return error.field + ' ' + error.message
    + (error.value ? ' (' + JSON.stringify(error.value) + ')' : '');
}

function formatSchemaErrors(errors) {
  return errors.map(formatSchemaError).join(', ');
}

function schemaValidate(schemaName, object) {
  const formats = {address: isValidAddress,
                   ledgerHash: isValidLedgerHash};
  const options = {schemas: SCHEMAS, formats: formats,
                   verbose: true, greedy: true};
  const schema = SCHEMAS[schemaName];
  if (schema === undefined) {
    throw new Error('schema not found for: ' + schemaName);
  }
  const validate = validator(schema, options);
  const isValid = validate(object);
  if (!isValid) {
    throw new ValidationError(formatSchemaErrors(validate.errors));
  }
}

SCHEMAS = loadSchemas(path.join(__dirname, './schemas'));
module.exports = schemaValidate;
