import * as enums from './definitions.json'
import { XrplDefinitions, FieldInstance, Bytes } from './xrpl-definitions'
/**
 * By default, coreTypes from the `types` folder is where known type definitions are initialized to avoid import cycles.
 */
const DEFAULT_DEFINITIONS = new XrplDefinitions(enums, {})

const Type = DEFAULT_DEFINITIONS.type
const LedgerEntryType = DEFAULT_DEFINITIONS.ledgerEntryType
const TransactionType = DEFAULT_DEFINITIONS.transactionType
const TransactionResult = DEFAULT_DEFINITIONS.transactionResult
const Field = DEFAULT_DEFINITIONS.field

/*
 * @brief: All valid transaction types
 */
const TRANSACTION_TYPES = DEFAULT_DEFINITIONS.transactionNames

export {
  Bytes,
  XrplDefinitions,
  DEFAULT_DEFINITIONS,
  Field,
  FieldInstance,
  Type,
  LedgerEntryType,
  TransactionResult,
  TransactionType,
  TRANSACTION_TYPES,
}
