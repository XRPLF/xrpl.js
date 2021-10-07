import type { Request } from '.'

export interface BaseRequest {
  [x: string]: unknown
  id?: number | string
  command: string
  api_version?: number
}

interface Warning {
  id: number
  message: string
  details?: { [key: string]: string }
}

export interface BaseResponse {
  id: number | string
  status?: 'success' | string
  type: 'response' | string
  result: unknown
  warning?: 'load'
  warnings?: Warning[]
  forwarded?: boolean
  api_version?: number
}

export interface ErrorResponse {
  id: number | string
  status: 'error'
  type: 'response' | string
  error: string
  error_code?: string
  error_message?: string
  request: Request
  api_version?: number
}
