import { Amount } from '../common'
import { BaseTransaction, GlobalFlags } from './common'

export enum TrustSetFlagsEnum {
    tfSetfAuth = 0x00010000,
    tfSetNoRipple = 0x00020000,
    tfClearNoRipple = 0x00040000,
    tfSetFreeze = 0x00100000,
    tfClearFreeze = 0x00200000,
}

export interface TrustSetFlags extends GlobalFlags {
    tfSetfAuth?: boolean
    tfSetNoRipple?: boolean
    tfClearNoRipple?: boolean
    tfSetFreeze?: boolean
    tfClearFreeze?: boolean
}

export interface TrustSet extends BaseTransaction {
    TransactionType: 'TrustSet'
    LimitAmount: Amount
    QualityIn?: number
    QualityOut?: number
    Flags?: number | TrustSetFlags
}
