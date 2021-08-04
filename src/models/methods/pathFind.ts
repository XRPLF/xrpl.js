import { Amount } from '../common'
import { BaseRequest, BaseResponse } from './baseMethod';

interface PathStep {
    account?: string
    currency?: string
    issuer?: string
}

type Path = PathStep[]

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

interface PathsComputed {
    paths_computed: Path[]
    source_amount: Amount
}

export interface PathFindResponse extends BaseResponse {
  result: {
      alternatives: PathsComputed[]
      destination_account: string
      destination_amount: Amount
      source_account: string
      full_reply: boolean
      id: number | string
  }
}

// TODO: figure out where to put the path_find asynchronous follow-ups
// https://xrpl.org/path_find.html#asynchronous-follow-ups
// probably with the subscribe response objects
