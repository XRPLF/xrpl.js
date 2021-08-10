import { BaseRequest, BaseResponse } from "./baseMethod";

export interface ManifestRequest extends BaseRequest {
    command: "manifest"
    public_key: string
}

export interface ManifestResponse extends BaseResponse {
    result: {
        details?: {
            domain: string
            ephemeral_key: string
            master_key: string
            seq: number
        }
        manifest?: string
        requested: string
    }
}