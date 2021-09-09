export interface Submit {
  success: boolean
  engineResult: string
  engineResultCode: number
  engineResultMessage?: string
  txBlob?: string
  txJson?: object
}

export interface KeyPair {
  publicKey: string
  privateKey: string
}

export interface SignOptions {
  signAs: string
}

export interface Outcome {
  result: string
  ledgerVersion: number
  indexInLedger: number
  fee: string
  balanceChanges: {
    [key: string]: Array<{
      currency: string
      counterparty?: string
      value: string
    }>
  }
  orderbookChanges: object
  deliveredAmount?: {
    currency: string
    counterparty?: string
    value: string
  }
  timestamp?: string
}
