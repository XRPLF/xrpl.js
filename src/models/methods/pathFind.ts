import { Amount, Path } from '../common'
import { BaseRequest, BaseResponse } from './baseMethod';

interface BasePathFindRequest extends BaseRequest {
    command: "path_find"
    subcommand: string
}

interface PathFindCreateRequest extends BasePathFindRequest {
    subcommand: "create"
    source_account: string
    destination_account: string
    destination_amount: Amount
    send_max?: Amount
    paths?: Path[]
}

interface PathFindCloseRequest extends BasePathFindRequest {
    subcommand: "close"
}

interface PathFindStatusRequest extends BasePathFindRequest {
    subcommand: "status"
}

export type PathFindRequest = PathFindCreateRequest | PathFindCloseRequest | PathFindStatusRequest

interface PathOption {
    paths_computed: Path[]
    source_amount: Amount
}

export interface PathFindResponse extends BaseResponse {
  result: {
      alternatives: PathOption[]
      destination_account: string
      destination_amount: Amount
      source_account: string
      full_reply: boolean
      id?: number | string
      closed?: true
      status?: true
  }
}

// TODO: figure out where to put the path_find asynchronous follow-ups
// https://xrpl.org/path_find.html#asynchronous-follow-ups
// probably with the subscribe response objects
