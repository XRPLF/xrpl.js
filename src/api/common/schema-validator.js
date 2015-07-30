/* @flow */
'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const validator = require('is-my-json-valid');
const core = require('./utils').core;
const ValidationError = require('./errors').ValidationError;

let SCHEMAS = {};

function isValidAddress(address) {
  return core.UInt160.is_valid(address);
}

function isValidLedgerHash(ledgerHash) {
  return core.UInt256.is_valid(ledgerHash);
}

function loadSchema(filepath: string): {} {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    throw new Error('Failed to parse schema: ' + filepath);
  }
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function loadSchemas(dir) {
  const filenames = fs.readdirSync(dir).filter(name => endsWith(name, '.json'));
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

function schemaValidate(schemaName: string, object: any): void {
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
module.exports = {
  schemaValidate: schemaValidate,
  loadSchema: loadSchema,
  SCHEMAS: SCHEMAS
};
