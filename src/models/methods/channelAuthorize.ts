import { BaseRequest, BaseResponse } from './baseMethod'

export interface ChannelAuthorizeRequest extends BaseRequest {
    command: 'channel_authorize'
    channel_id: string
    amount: string
    secret?: string
    seed?: string
    seed_hex?: string
    passphrase?: string
    key_type?: 'secp256k1' | 'ed25519' // TODO: replace with ECDSA enum type
}

export interface ChannelAuthorizeResponse extends BaseResponse {
    result: {
        signature: string
    }
}
