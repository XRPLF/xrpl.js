import { BaseRequest, BaseResponse } from './baseMethod'
import { Currency, LedgerIndex } from "../common"

type Stream = "consensus" | "ledger" | "manifests" | "peer_status" | "transactions" | "transactions_proposed" | "server" | "validations"

interface Book {
    taker_gets: Currency
    taker_pays: Currency
    taker: string
    snapshot?: boolean
    both?: boolean
}
  
export interface SubscribeRequest extends BaseRequest {
    command: "subscribe"
    streams?: Stream[]
    accounts?: string[]
    accounts_proposed?: string[]
    books?: Book[]
    url?: string
    url_username?: string
    url_password?: string
}

export interface SubscribeResponse extends BaseResponse {
    result: any
}
