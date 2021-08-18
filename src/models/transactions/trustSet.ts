import { Amount } from '../common'
import { BaseTransaction } from './common'

export interface TrustSet extends BaseTransaction {
    TransactionType: 'TrustSet'
    LimitAmount: Amount
    QualityIn?: number
    QualityOut?: number
}
