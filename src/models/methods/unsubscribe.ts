import { Currency, StreamType } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

interface Book {
  taker_gets: Currency
  taker_pays: Currency
  both?: boolean
}

export interface UnsubscribeRequest extends BaseRequest {
  command: 'unsubscribe'
  streams?: StreamType[]
  accounts?: string[]
  accounts_proposed?: string[]
  books?: Book[]
}

export interface UnsubscribeResponse extends BaseResponse {
  // TODO: figure out if there's a better way to type this
  // eslint-disable-next-line @typescript-eslint/ban-types -- actually should be an empty object
  result: {}
}
