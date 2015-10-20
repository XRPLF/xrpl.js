// flow is disabled for this file until support for requiring json is added:
// https://github.com/facebook/flow/issues/167
'use strict';
const _ = require('lodash');
const assert = require('assert');
const validator = require('is-my-json-valid');
const ValidationError = require('./errors').ValidationError;
const {isValidAddress} = require('ripple-address-codec');

let SCHEMAS = {};

function loadSchemas() {
  // listed explicitly for webpack (instead of scanning schemas directory)
  const schemas = [
    require('./schemas/address.json'),
    require('./schemas/adjustment.json'),
    require('./schemas/amount.json'),
    require('./schemas/amountbase.json'),
    require('./schemas/balance.json'),
    require('./schemas/blob.json'),
    require('./schemas/currency.json'),
    require('./schemas/get-account-info.json'),
    require('./schemas/get-balances.json'),
    require('./schemas/get-balance-sheet'),
    require('./schemas/balance-sheet-options.json'),
    require('./schemas/get-ledger.json'),
    require('./schemas/get-orderbook.json'),
    require('./schemas/get-orders.json'),
    require('./schemas/get-paths.json'),
    require('./schemas/get-server-info.json'),
    require('./schemas/get-settings.json'),
    require('./schemas/get-transaction.json'),
    require('./schemas/get-transactions.json'),
    require('./schemas/get-trustlines.json'),
    require('./schemas/hash128.json'),
    require('./schemas/hash256.json'),
    require('./schemas/instructions.json'),
    require('./schemas/issue.json'),
    require('./schemas/ledger-options.json'),
    require('./schemas/ledgerversion.json'),
    require('./schemas/max-adjustment.json'),
    require('./schemas/memo.json'),
    require('./schemas/order-cancellation-transaction.json'),
    require('./schemas/order-cancellation.json'),
    require('./schemas/order-change.json'),
    require('./schemas/order-transaction.json'),
    require('./schemas/order.json'),
    require('./schemas/orderbook-orders.json'),
    require('./schemas/orderbook.json'),
    require('./schemas/orders-options.json'),
    require('./schemas/outcome.json'),
    require('./schemas/pathfind.json'),
    require('./schemas/payment-transaction.json'),
    require('./schemas/payment.json'),
    require('./schemas/quality.json'),
    require('./schemas/remote-options.json'),
    require('./schemas/sequence.json'),
    require('./schemas/settings-options.json'),
    require('./schemas/settings-transaction.json'),
    require('./schemas/settings.json'),
    require('./schemas/sign.json'),
    require('./schemas/signed-value.json'),
    require('./schemas/submit.json'),
    require('./schemas/suspended-payment-cancellation.json'),
    require('./schemas/suspended-payment-execution.json'),
    require('./schemas/suspended-payment-creation.json'),
    require('./schemas/timestamp.json'),
    require('./schemas/transaction-options.json'),
    require('./schemas/transactions-options.json'),
    require('./schemas/trustline-transaction.json'),
    require('./schemas/trustline.json'),
    require('./schemas/trustlines-options.json'),
    require('./schemas/tx.json'),
    require('./schemas/uint32.json'),
    require('./schemas/value.json'),
    require('./schemas/prepare.json'),
    require('./schemas/ledger-closed.json')
  ];
  const titles = _.map(schemas, schema => schema.title);
  const duplicates = _.keys(_.pick(_.countBy(titles), count => count > 1));
  assert(duplicates.length === 0, 'Duplicate schemas for: ' + duplicates);
  return _.indexBy(schemas, 'title');
}

function formatSchemaError(error) {
  try {
    return error.field + ' ' + error.message
      + (error.value ? ' (' + JSON.stringify(error.value) + ')' : '');
  } catch (err) {
    return error.field + ' ' + error.message;
  }
}

function formatSchemaErrors(errors) {
  return errors.map(formatSchemaError).join(', ');
}

function schemaValidate(schemaName: string, object: any): void {
  const formats = {address: isValidAddress};
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

SCHEMAS = loadSchemas();
module.exports = {
  schemaValidate: schemaValidate,
  SCHEMAS: SCHEMAS
};
