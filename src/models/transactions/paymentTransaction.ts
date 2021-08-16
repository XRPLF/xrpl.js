import { Amount, Path } from '../common';
import { BaseTransaction } from './common';
import { GlobalFlags } from './common'

interface PaymentTransactionFlags extends GlobalFlags {
    tfNoDirectRipple?: boolean
    tfPartialPayment?: boolean
    tfLimitQuality?: boolean
}

export interface PaymentTransaction extends BaseTransaction {
    TransactionType: 'Payment'
    Amount: Amount
    Destination: string
    DestinationTag?: number
    InvoiceID?: string
    Paths?: Path[]
    SendMax?: Amount
    DeliverMin?: Amount
    Flags?: PaymentTransactionFlags
}
