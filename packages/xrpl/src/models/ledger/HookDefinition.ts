import { HookParameter } from '../common'

import BaseLedgerEntry from './BaseLedgerEntry'

/**
 * The HookDefintion object type contains the
 *
 * @category Ledger Entries
 */
export default interface HookDefintion extends BaseLedgerEntry {
  LedgerEntryType: 'HookDefintion'

  /**
   * The flags that are set on the hook.
   */
  Flags: number

  /**
   * This field contains a string that is used to uniquely identify the hook.
   */
  HookHash: string

  /**
   * The transactions that triggers the hook. Represented as a 256Hash
   */
  HookOn?: string

  /**
   * The namespace of the hook.
   */
  HookNamespace?: string

  /**
   * The API version of the hook.
   */
  HookApiVersion?: string

  /**
   * The parameters of the hook.
   */
  HookParameters?: HookParameter[]

  /**
   * The code that is executed when the hook is triggered.
   */
  CreateCode?: string

  /**
   * This is an optional field that contains the transaction ID of the hook set.
   */
  HookSetTxnID?: string

  /**
   * This is an optional field that contains the number of references to this hook.
   */
  ReferenceCount?: number

  /**
   * This is an optional field that contains the fee associated with the hook.
   */
  Fee?: string

  /**
   * This is an optional field that contains the callback fee associated with the hook.
   */
  HookCallbackFee?: number
}
