import * as _ from 'lodash'
import {ValidationError} from './errors'
import {schemaValidate} from './schema-validator'

function error(text) {
  return new ValidationError(text)
}

function validateLedgerRange(options) {
  if (
    !_.isUndefined(options) &&
    !_.isUndefined(options.minLedgerVersion) &&
    !_.isUndefined(options.maxLedgerVersion)
  ) {
    if (Number(options.minLedgerVersion) > Number(options.maxLedgerVersion)) {
      throw error('minLedgerVersion must not be greater than maxLedgerVersion')
    }
  }
}

function validateOptions(schema, instance) {
  schemaValidate(schema, instance)
  validateLedgerRange(instance.options)
}

export const getPaths = _.partial(schemaValidate, 'getPathsParameters')

export const getTransactions = _.partial(
  validateOptions,
  'getTransactionsParameters'
)

export const getSettings = _.partial(validateOptions, 'getSettingsParameters')

export const getAccountInfo = _.partial(
  validateOptions,
  'getAccountInfoParameters'
)

export const getTrustlines = _.partial(
  validateOptions,
  'getTrustlinesParameters'
)

export const getBalances = _.partial(validateOptions, 'getBalancesParameters')

export const getBalanceSheet = _.partial(
  validateOptions,
  'getBalanceSheetParameters'
)

export const getOrders = _.partial(validateOptions, 'getOrdersParameters')

export const getOrderbook = _.partial(validateOptions, 'getOrderbookParameters')

export const getTransaction = _.partial(
  validateOptions,
  'getTransactionParameters'
)

export const getPaymentChannel = _.partial(
  validateOptions,
  'getPaymentChannelParameters'
)

export const getLedger = _.partial(validateOptions, 'getLedgerParameters')

export const preparePayment = _.partial(
  schemaValidate,
  'preparePaymentParameters'
)

export const prepareOrder = _.partial(schemaValidate, 'prepareOrderParameters')

export const prepareOrderCancellation = _.partial(
  schemaValidate,
  'prepareOrderCancellationParameters'
)

export const prepareTrustline = _.partial(
  schemaValidate,
  'prepareTrustlineParameters'
)

export const prepareSettings = _.partial(
  schemaValidate,
  'prepareSettingsParameters'
)

export const prepareEscrowCreation = _.partial(
  schemaValidate,
  'prepareEscrowCreationParameters'
)

export const prepareEscrowCancellation = _.partial(
  schemaValidate,
  'prepareEscrowCancellationParameters'
)

export const prepareEscrowExecution = _.partial(
  schemaValidate,
  'prepareEscrowExecutionParameters'
)

export const preparePaymentChannelCreate = _.partial(
  schemaValidate,
  'preparePaymentChannelCreateParameters'
)

export const preparePaymentChannelFund = _.partial(
  schemaValidate,
  'preparePaymentChannelFundParameters'
)

export const preparePaymentChannelClaim = _.partial(
  schemaValidate,
  'preparePaymentChannelClaimParameters'
)

export const prepareCheckCreate = _.partial(
  schemaValidate,
  'prepareCheckCreateParameters'
)

export const prepareCheckCash = _.partial(
  schemaValidate,
  'prepareCheckCashParameters'
)

export const prepareCheckCancel = _.partial(
  schemaValidate,
  'prepareCheckCancelParameters'
)

export const prepareTicketCreate = _.partial(
  schemaValidate,
  'prepareTicketParameters'
)

export const sign = _.partial(schemaValidate, 'signParameters')

export const combine = _.partial(schemaValidate, 'combineParameters')

export const submit = _.partial(schemaValidate, 'submitParameters')

export const computeLedgerHash = _.partial(
  schemaValidate,
  'computeLedgerHashParameters'
)

export const generateAddress = _.partial(
  schemaValidate,
  'generateAddressParameters'
)

export const signPaymentChannelClaim = _.partial(
  schemaValidate,
  'signPaymentChannelClaimParameters'
)

export const verifyPaymentChannelClaim = _.partial(
  schemaValidate,
  'verifyPaymentChannelClaimParameters'
)

export const apiOptions = _.partial(schemaValidate, 'api-options')

export const instructions = _.partial(schemaValidate, 'instructions')

export const tx_json = _.partial(schemaValidate, 'tx-json')
