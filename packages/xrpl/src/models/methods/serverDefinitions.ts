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

        /** Account set flags (added in newer rippled versions) */
        ACCOUNT_SET_FLAGS?: Record<string, number>

        /** Ledger entry flags (added in newer rippled versions) */
        LEDGER_ENTRY_FLAGS?: Record<string, Record<string, number>>

        /** Ledger entry formats (added in newer rippled versions) */
        LEDGER_ENTRY_FORMATS?: Record<
          string,
          Array<{ name: string; required: boolean }>
        >

        /** Transaction flags (added in newer rippled versions) */
        TRANSACTION_FLAGS?: Record<string, Record<string, number>>

        /** Transaction formats (added in newer rippled versions) */
        TRANSACTION_FORMATS?: Record<
          string,
          Array<{ name: string; required: boolean }>
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
