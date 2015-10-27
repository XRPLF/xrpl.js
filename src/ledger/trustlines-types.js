/* @flow */
'use strict';

export type TrustLineSpecification = {
  currency: string,
  counterparty: string,
  limit: string,
  qualityIn?: number,
  qualityOut?: number,
  ripplingDisabled?: boolean,
  authorized?: boolean,
  frozen?: boolean
}

export type Trustline = {
  specification: TrustLineSpecification,
  counterparty: {
    limit: string,
    ripplingDisabled?: boolean,
    frozen?: boolean,
    authorized?: boolean
  },
  state: {
    balance: string
  }
}

export type TrustlinesOptions = {
  counterparty?: string,
  currency?: string,
  limit?: number,
  ledgerVersion?: number
}
