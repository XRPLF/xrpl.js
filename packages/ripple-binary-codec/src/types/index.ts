import { AccountID } from './account-id'
import { Amount } from './amount'
import { Blob } from './blob'
import { Currency } from './currency'
import { Hash128 } from './hash-128'
import { Hash160 } from './hash-160'
import { Hash256 } from './hash-256'
import { Issue } from './issue'
import { PathSet } from './path-set'
import { STArray } from './st-array'
import { STObject } from './st-object'
import { UInt16 } from './uint-16'
import { UInt32 } from './uint-32'
import { UInt64 } from './uint-64'
import { UInt8 } from './uint-8'
import { Vector256 } from './vector-256'
import { XChainBridge } from './xchain-bridge'
import { type SerializedType } from './serialized-type'
import { DEFAULT_DEFINITIONS } from '../enums'

const coreTypes: Record<string, typeof SerializedType> = {
  AccountID,
  Amount,
  Blob,
  Currency,
  Hash128,
  Hash160,
  Hash256,
  Issue,
  PathSet,
  STArray,
  STObject,
  UInt8,
  UInt16,
  UInt32,
  UInt64,
  Vector256,
  XChainBridge,
}

// Ensures that the DEFAULT_DEFINITIONS object connects these types to fields for serializing/deserializing
// This is done here instead of in enums/index.ts to avoid a circular dependency
// because some of the above types depend on BinarySerializer which depends on enums/index.ts.
DEFAULT_DEFINITIONS.associateTypes(coreTypes)

export {
  coreTypes,
  AccountID,
  Amount,
  Blob,
  Currency,
  Hash128,
  Hash160,
  Hash256,
  PathSet,
  STArray,
  STObject,
  UInt8,
  UInt16,
  UInt32,
  UInt64,
  Vector256,
}
