import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `federator_info` command asks the federator for information
 * about the door account and other bridge-related information. This
 * method only exists on sidechain federators. Expects a response in
 * the form of a {@link FederatorInfoResponse}.
 *
 * @category Requests
 */
export interface FederatorInfoRequest extends BaseRequest {
  command: 'federator_info'
}

/**
 * Response expected from a {@link FederatorInfoRequest}.
 *
 * @category Responses
 */
export interface FederatorInfoResponse extends BaseResponse {
  result: {
    info: {
      mainchain: {
        door_status: {
          initialized: boolean
          status: 'open' | 'opening' | 'closed' | 'closing'
        }
        last_transaction_sent_seq: number
        listener_info: {
          state: 'syncing' | 'normal'
        }
        pending_transactions: Array<{
          amount: string
          destination_account: string
          signatures: Array<{
            public_key: string
            seq: number
          }>
        }>
        sequence: number
        tickets: {
          initialized: boolean
          tickets: Array<{
            status: 'taken' | 'available'
            ticket_seq: number
          }>
        }
      }
      public_key: string
      sidechain: {
        door_status: {
          initialized: boolean
          status: 'open' | 'opening' | 'closed' | 'closing'
        }
        last_transaction_sent_seq: number
        listener_info: {
          state: 'syncing' | 'normal'
        }
        pending_transactions: Array<{
          amount: string
          destination_account: string
          signatures: Array<{
            public_key: string
            seq: number
          }>
        }>
        sequence: number
        tickets: {
          initialized: boolean
          tickets: Array<{
            status: 'taken' | 'available'
            ticket_seq: number
          }>
        }
      }
    }
  }
}
