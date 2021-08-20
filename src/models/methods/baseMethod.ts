import { Response } from ".";

export interface BaseRequest {
    id?: number | string
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
    status: "success" | "error" | string
    type: "response" | string
    result: any
    warning?: "load"
    warnings?: Warning[]
    forwarded?: boolean
    error?: string
    error_message?: string
    request?: Response
    api_version?: number
}