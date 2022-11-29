import { Amount } from 'xrpl-local/models/common'
import { BaseTransaction } from 'xrpl-local/models/transactions'

export interface NewTx extends BaseTransaction {
  Amount: Amount
}
