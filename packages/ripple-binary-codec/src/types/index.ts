import {
  Field,
  TransactionResult,
  TransactionType,
  LedgerEntryType,
} from '../enums'
import { AccountID } from './account-id'
import { Amount } from './amount'
import { Blob } from './blob'
import { Currency } from './currency'
import { Hash128 } from './hash-128'
import { Hash160 } from './hash-160'
import { Hash256 } from './hash-256'
import { IssuedCurrency } from './issued-currency'
import { PathSet } from './path-set'
import { Sidechain } from './sidechain'
import { Signature } from './signature'
import { STArray } from './st-array'
import { STObject } from './st-object'
import { UInt16 } from './uint-16'
import { UInt32 } from './uint-32'
import { UInt64 } from './uint-64'
import { UInt8 } from './uint-8'
import { Vector256 } from './vector-256'
import { XChainClaimProof } from './xchain-claim-proof'

const coreTypes = {
  AccountID,
  Amount,
  Blob,
  Currency,
  Hash128,
  Hash160,
  Hash256,
  IssuedCurrency,
  PathSet,
  Sidechain,
  Signature,
  STArray,
  STObject,
  UInt8,
  UInt16,
  UInt32,
  UInt64,
  Vector256,
  XChainClaimProof,
}

Object.values(Field).forEach((field) => {
  field.associatedType = coreTypes[field.type.name]
})

Field['TransactionType'].associatedType = TransactionType
Field['TransactionResult'].associatedType = TransactionResult
Field['LedgerEntryType'].associatedType = LedgerEntryType

export { coreTypes }
