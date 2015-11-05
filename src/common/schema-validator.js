// flow is disabled for this file until support for requiring json is added:
// https://github.com/facebook/flow/issues/167
'use strict';
const _ = require('lodash');
const assert = require('assert');
const Ajv = require('ajv');
const ValidationError = require('./errors').ValidationError;
const {isValidAddress} = require('ripple-address-codec');
const {isValidSecret} = require('./utils');

function loadSchemas() {
  // listed explicitly for webpack (instead of scanning schemas directory)
  const schemas = [
    require('./schemas/objects/tx-json.json'),
    require('./schemas/objects/hash128.json'),
    require('./schemas/objects/hash256.json'),
    require('./schemas/objects/sequence.json'),
    require('./schemas/objects/issue.json'),
    require('./schemas/objects/ledgerversion.json'),
    require('./schemas/objects/max-adjustment.json'),
    require('./schemas/objects/memo.json'),
    require('./schemas/objects/uint32.json'),
    require('./schemas/objects/value.json'),
    require('./schemas/objects/source-adjustment.json'),
    require('./schemas/objects/destination-adjustment.json'),
    require('./schemas/objects/tag.json'),
    require('./schemas/objects/lax-amount.json'),
    require('./schemas/objects/lax-lax-amount.json'),
    require('./schemas/objects/min-adjustment.json'),
    require('./schemas/objects/lax-adjustment.json'),
    require('./schemas/objects/tx-hash.json'),
    require('./schemas/objects/address.json'),
    require('./schemas/objects/adjustment.json'),
    require('./schemas/objects/quality.json'),
    require('./schemas/objects/amount.json'),
    require('./schemas/objects/amount-base.json'),
    require('./schemas/objects/balance.json'),
    require('./schemas/objects/blob.json'),
    require('./schemas/objects/currency.json'),
    require('./schemas/objects/signed-value.json'),
    require('./schemas/objects/orderbook.json'),
    require('./schemas/objects/instructions.json'),
    require('./schemas/specifications/settings.json'),
    require('./schemas/specifications/payment.json'),
    require('./schemas/specifications/suspended-payment-cancellation.json'),
    require('./schemas/specifications/order-cancellation.json'),
    require('./schemas/specifications/order.json'),
    require('./schemas/specifications/suspended-payment-execution.json'),
    require('./schemas/specifications/suspended-payment-creation.json'),
    require('./schemas/specifications/trustline.json'),
    require('./schemas/output/sign.json'),
    require('./schemas/output/submit.json'),
    require('./schemas/output/get-account-info.json'),
    require('./schemas/output/get-balances.json'),
    require('./schemas/output/get-balance-sheet'),
    require('./schemas/output/get-ledger.json'),
    require('./schemas/output/get-orderbook.json'),
    require('./schemas/output/settings-transaction.json'),
    require('./schemas/output/get-orders.json'),
    require('./schemas/output/order-change.json'),
    require('./schemas/output/order-cancellation-transaction.json'),
    require('./schemas/output/prepare.json'),
    require('./schemas/output/ledger-closed.json'),
    require('./schemas/output/order-transaction.json'),
    require('./schemas/output/get-paths.json'),
    require('./schemas/output/trustline-transaction.json'),
    require('./schemas/output/get-server-info.json'),
    require('./schemas/output/get-settings.json'),
    require('./schemas/output/orderbook-orders.json'),
    require('./schemas/output/payment-transaction.json'),
    require('./schemas/output/outcome.json'),
    require('./schemas/output/get-transaction.json'),
    require('./schemas/output/get-transactions.json'),
    require('./schemas/output/get-trustlines.json'),
    require('./schemas/input/get-balance-sheet.json'),
    require('./schemas/input/get-ledger.json'),
    require('./schemas/input/get-orders.json'),
    require('./schemas/input/get-orderbook.json'),
    require('./schemas/input/get-paths.json'),
    require('./schemas/input/api-options.json'),
    require('./schemas/input/get-settings.json'),
    require('./schemas/input/get-transaction.json'),
    require('./schemas/input/get-transactions.json'),
    require('./schemas/input/get-trustlines.json'),
    require('./schemas/input/prepare-payment.json'),
    require('./schemas/input/prepare-order.json'),
    require('./schemas/input/prepare-trustline.json'),
    require('./schemas/input/prepare-order-cancellation.json'),
    require('./schemas/input/prepare-settings.json'),
    require('./schemas/input/prepare-suspended-payment-creation.json'),
    require('./schemas/input/prepare-suspended-payment-cancellation.json'),
    require('./schemas/input/prepare-suspended-payment-execution.json'),
    require('./schemas/input/compute-ledger-hash'),
    require('./schemas/input/sign'),
    require('./schemas/input/submit')
  ];
  const titles = _.map(schemas, schema => schema.title);
  const duplicates = _.keys(_.pick(_.countBy(titles), count => count > 1));
  assert(duplicates.length === 0, 'Duplicate schemas for: ' + duplicates);
  const ajv = new Ajv();
  _.forEach(schemas, schema => ajv.addSchema(schema, schema.title));
  ajv.addFormat('address', isValidAddress);
  ajv.addFormat('secret', isValidSecret);
  return ajv;
}

const ajv = loadSchemas();

function schemaValidate(schemaName: string, object: any): void {
  const isValid = ajv.validate(schemaName, object);
  if (!isValid) {
    throw new ValidationError(ajv.errorsText());
  }
}

module.exports = {
  schemaValidate,
  isValidSecret
};
