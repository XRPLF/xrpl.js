import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `server_definitions` method retrieves information about the definition
 * enums available in this rippled node. Expects a response in the form of a
 * {@link ServerDefinitionsResponse}.
 *
 * @category Requests
 */
export interface ServerDefinitionsRequest extends BaseRequest {
  command: 'server_definitions'
  /**
   * The hash of a `server_definitions` response.
   */
  hash?: string
}

/**
 * Response expected from an {@link ServerDefinitionsRequest}.
 *
 * @category Responses
 */
export interface ServerDefinitionsResponse extends BaseResponse {
  result: {
    hash: string
  } & (
    | {
        FIELDS: Array<
          [
            string,
            {
              nth: number
              isVLEncoded: boolean
              isSerialized: boolean
              isSigningField: boolean
              type: string
            },
          ]
        >

        LEDGER_ENTRY_TYPES: Record<string, number>

        TRANSACTION_RESULTS: Record<string, number>

        TRANSACTION_TYPES: Record<string, number>

        TYPES: Record<string, number>

        /** Maps AccountSet flag names (asf flags) to their numeric values. */
        ACCOUNT_SET_FLAGS: Record<string, number>

        /** Maps ledger entry type names to their flags and flag values. */
        LEDGER_ENTRY_FLAGS: Record<string, Record<string, number>>

        /**
         * Describes the fields and their optionality for each ledger entry type,
         * including common fields shared across all ledger entries.
         */
        LEDGER_ENTRY_FORMATS: Record<
          string,
          Array<{ name: string; optionality: number }>
        >

        /** Maps transaction type names to their supported flags and flag values. */
        TRANSACTION_FLAGS: Record<string, Record<string, number>>

        /**
         * Describes the fields and their optionality for each transaction type,
         * including common fields shared across all transactions.
         */
        TRANSACTION_FORMATS: Record<
          string,
          Array<{ name: string; optionality: number }>
        >
      }
    | {
        FIELDS?: never

        LEDGER_ENTRY_TYPES?: never

        TRANSACTION_RESULTS?: never

        TRANSACTION_TYPES?: never

        TYPES?: never

        ACCOUNT_SET_FLAGS?: never

        LEDGER_ENTRY_FLAGS?: never

        LEDGER_ENTRY_FORMATS?: never

        TRANSACTION_FLAGS?: never

        TRANSACTION_FORMATS?: never
      }
  )
}
