export interface BaseRequest {
    id: number | string
    command: string
    api_version?: number
}

interface Warning {
    id: number
    message: string
    details?: {[key: string]: string}
}

export interface BaseResponse {
    id: number | string
    status: string
    type: string
    result: any
    warning?: "load"
    warnings?: Warning[]
    forwarded?: boolean
}